/**
 * Session management - handles token storage and validation
 */

import type { Session as SupabaseSession } from '@supabase/supabase-js';
import type { Session, User } from '@/lib/auth-types';

const SESSION_STORAGE_KEY = 'phonara_auth_session';
const TOKEN_STORAGE_KEY = 'phonara_auth_token';
const REFRESH_TOKEN_KEY = 'phonara_refresh_token';

/**
 * SessionStorage: Manages session persistence using localStorage + memory cache
 */
export class SessionStorage {
  private memoryCache: Session | null = null;
  private initialized = false;

  /**
   * Initialize from localStorage
   */
  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.memoryCache = this.hydrateSession(parsed);
      }
    } catch (err) {
      console.warn('[SessionStorage] Failed to load from localStorage:', err);
      this.clear();
    }
  }

  /**
   * Get current session from memory or storage
   */
  getSession(): Session | null {
    if (!this.initialized) {
      this.initialize();
    }
    return this.memoryCache;
  }

  /**
   * Save session to both memory and localStorage
   */
  saveSession(session: Session): void {
    if (!this.initialized) {
      this.initialize();
    }

    this.memoryCache = session;

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        token: session.token,
        expiresAt: session.expiresAt.toISOString(),
        refreshToken: session.refreshToken,
        user: session.user,
      }));
    } catch (err) {
      console.warn('[SessionStorage] Failed to save to localStorage:', err);
    }
  }

  /**
   * Clear session from memory and storage
   */
  clear(): void {
    this.memoryCache = null;

    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (err) {
      console.warn('[SessionStorage] Failed to clear localStorage:', err);
    }
  }

  /**
   * Check if session is valid (not expired)
   */
  isValid(): boolean {
    const session = this.getSession();
    if (!session) return false;

    const now = new Date();
    return now < session.expiresAt;
  }

  /**
   * Get time until token expiry in milliseconds
   */
  getTimeToExpiry(): number {
    const session = this.getSession();
    if (!session) return 0;

    const now = new Date().getTime();
    const expiryTime = session.expiresAt.getTime();
    return Math.max(0, expiryTime - now);
  }

  /**
   * Check if token needs refresh (less than 5 minutes remaining)
   */
  needsRefresh(): boolean {
    const timeToExpiry = this.getTimeToExpiry();
    const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    return timeToExpiry < REFRESH_THRESHOLD;
  }

  /**
   * Hydrate session from stored data
   */
  private hydrateSession(data: any): Session {
    return {
      token: data.token,
      expiresAt: new Date(data.expiresAt),
      refreshToken: data.refreshToken,
      user: data.user,
    };
  }
}

/**
 * Validate session token
 */
export function isValidToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;

  try {
    // JWT format check: three parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Basic validation - can be extended with JWT parsing
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract user from session
 */
export function getSessionUser(session: Session | null): User | null {
  return session?.user ?? null;
}

/**
 * Global session storage instance
 */
let sessionStorageInstance: SessionStorage | null = null;

export function getSessionStorage(): SessionStorage {
  if (!sessionStorageInstance) {
    sessionStorageInstance = new SessionStorage();
  }
  return sessionStorageInstance;
}
