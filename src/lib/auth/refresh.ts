/**
 * Consolidated refresh manager - replaces authSingleFlight, refreshMutex, and authBroadcast
 * 
 * Single responsibility: prevent race conditions and queue refresh requests
 */

import { supabase } from '@/lib/supabase';
import { isInvalidSessionError, clearBrokenLocalSession } from '@/lib/auth-recovery';
import { publishAuthEvent } from '@/lib/auth/authBroadcast';
import type { Session } from '@supabase/supabase-js';

const BACKOFF_MS = [500, 1_000, 2_000, 4_000];

export interface RefreshResult {
  success: boolean;
  session: Session | null;
  error?: Error;
  durationMs: number;
}

interface RefreshSubscriber {
  (result: RefreshResult): void;
}

/**
 * RefreshManager: Ensures only one refresh happens at a time, queues other requests
 * 
 * Usage:
 *   const refreshManager = new RefreshManager();
 *   const result = await refreshManager.refresh();
 *   refreshManager.subscribe((result) => {
 *     if (result.success) updateToken(result.session);
 *   });
 */
export class RefreshManager {
  private refreshPromise: Promise<RefreshResult> | null = null;
  private subscribers = new Set<RefreshSubscriber>();
  private lastResult: RefreshResult | null = null;

  /**
   * Refresh the session, preventing race conditions
   */
  async refresh(): Promise<RefreshResult> {
    // If refresh is already in flight, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Start the refresh
    this.refreshPromise = this.executeRefresh();
    
    try {
      const result = await this.refreshPromise;
      this.lastResult = result;
      
      // Notify all subscribers
      this.notifySubscribers(result);
      
      // Broadcast to other tabs
      if (result.success) {
        publishAuthEvent('TOKEN_REFRESHED', { ok: true });
      } else {
        publishAuthEvent('RECOVER_401', { ok: false, error: result.error?.message });
      }
      
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Execute the refresh with exponential backoff
   */
  private async executeRefresh(): Promise<RefreshResult> {
    const startedAt = Date.now();
    let lastError: Error | null = null;

    // Try refresh with exponential backoff (up to 4 attempts)
    for (let i = 0; i < BACKOFF_MS.length; i++) {
      try {
        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
          // bad_jwt or invalid token - don't retry, clear session
          if (isInvalidSessionError(error)) {
            await clearBrokenLocalSession();
            return {
              success: false,
              session: null,
              error: new Error(error.message),
              durationMs: Date.now() - startedAt,
            };
          }
          // Network or temporary error - retry with backoff
          lastError = new Error(error.message);
          throw lastError;
        }

        // Success
        return {
          success: true,
          session: data.session,
          durationMs: Date.now() - startedAt,
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        
        // Wait before retrying
        if (i < BACKOFF_MS.length - 1) {
          await new Promise((res) =>
            setTimeout(res, BACKOFF_MS[i] + Math.random() * 250)
          );
        }
      }
    }

    // All retries exhausted
    return {
      success: false,
      session: null,
      error: lastError || new Error('Refresh failed after all retries'),
      durationMs: Date.now() - startedAt,
    };
  }

  /**
   * Subscribe to refresh completion events
   */
  subscribe(callback: RefreshSubscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of refresh result
   */
  private notifySubscribers(result: RefreshResult): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(result);
      } catch (err) {
        console.error('[RefreshManager] Subscriber error:', err);
      }
    });
  }

  /**
   * Get the last refresh result
   */
  getLastResult(): RefreshResult | null {
    return this.lastResult;
  }

  /**
   * Check if refresh is currently in progress
   */
  isRefreshing(): boolean {
    return this.refreshPromise !== null;
  }
}

// Singleton instance
let refreshManagerInstance: RefreshManager | null = null;

export function getRefreshManager(): RefreshManager {
  if (!refreshManagerInstance) {
    refreshManagerInstance = new RefreshManager();
  }
  return refreshManagerInstance;
}

/**
 * Convenience function for single refresh call
 */
export async function safeRefreshSession(): Promise<Session | null> {
  const manager = getRefreshManager();
  const result = await manager.refresh();
  return result.success ? result.session : null;
}
