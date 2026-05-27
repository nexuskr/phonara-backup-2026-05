/**
 * AuthService - Main authentication service
 * 
 * Handles: login, logout, session refresh, MFA, password reset
 * Single source of truth for auth operations
 */

import { supabase } from '@/lib/supabase';
import type {
  User,
  Session,
  AuthError,
  MFAChallenge,
  PasswordResetToken,
} from '@/lib/auth-types';
import {
  InvalidCredentialsError,
  MFARequiredError,
  SessionExpiredError,
  PasswordResetError,
  NetworkError,
} from '@/lib/auth-types';
import {
  getSessionStorage,
  isValidToken,
  type SessionStorage,
} from '@/lib/auth/session';
import {
  RefreshManager,
  getRefreshManager,
} from '@/lib/auth/refresh';
import {
  isNetworkError,
  isSessionExpiredError,
  logAuthError,
} from '@/lib/auth/errorHandler';
import {
  isInvalidSessionError,
  clearBrokenLocalSession,
} from '@/lib/auth-recovery';

/**
 * AuthService: Main auth operations
 */
export class AuthService {
  private sessionStorage: SessionStorage;
  private refreshManager: RefreshManager;
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly AUTO_REFRESH_INTERVAL = 60_000; // 1 minute

  constructor() {
    this.sessionStorage = getSessionStorage();
    this.refreshManager = getRefreshManager();
    this.initializeAutoRefresh();
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<Session> {
    try {
      if (!email || !password) {
        throw new InvalidCredentialsError('Email and password are required');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logAuthError('login', error);
        if (error.status === 401 || error.message.includes('Invalid')) {
          throw new InvalidCredentialsError();
        }
        throw new Error(error.message);
      }

      if (!data.session?.user) {
        throw new InvalidCredentialsError('No session returned');
      }

      const session = this.buildSession(data.session);
      this.sessionStorage.saveSession(session);
      this.setupAutoRefresh();

      return session;
    } catch (err) {
      if (isNetworkError(err)) {
        throw new NetworkError();
      }
      throw err;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      this.clearAutoRefresh();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      // Clear local session regardless of Supabase response
      this.sessionStorage.clear();

      if (error && !isInvalidSessionError(error)) {
        logAuthError('logout', error);
      }
    } catch (err) {
      // Always clear session on logout attempt
      this.sessionStorage.clear();
      this.clearAutoRefresh();
      
      if (!isNetworkError(err)) {
        throw err;
      }
    }
  }

  /**
   * Refresh current session token
   */
  async refreshSession(): Promise<Session | null> {
    try {
      const result = await this.refreshManager.refresh();

      if (!result.success) {
        if (isSessionExpiredError(result.error)) {
          await clearBrokenLocalSession();
          this.sessionStorage.clear();
        }
        return null;
      }

      if (!result.session?.user) {
        return null;
      }

      const session = this.buildSession(result.session);
      this.sessionStorage.saveSession(session);
      
      return session;
    } catch (err) {
      logAuthError('refreshSession', err);
      if (isInvalidSessionError(err)) {
        await clearBrokenLocalSession();
        this.sessionStorage.clear();
      }
      return null;
    }
  }

  /**
   * Verify MFA with OTP
   */
  async verifyMFA(challengeId: string, code: string): Promise<Session> {
    try {
      if (!code || code.length < 6) {
        throw new Error('Invalid OTP code');
      }

      // TODO: Implement MFA verification via Supabase or custom endpoint
      // For now, placeholder implementation
      const { data, error } = await supabase.auth.verifyOtp({
        email: '',
        type: 'magiclink',
        token: code,
      });

      if (error) {
        throw new Error(`MFA verification failed: ${error.message}`);
      }

      if (!data.session?.user) {
        throw new Error('No session returned from MFA verification');
      }

      const session = this.buildSession(data.session);
      this.sessionStorage.saveSession(session);

      return session;
    } catch (err) {
      logAuthError('verifyMFA', err);
      throw err;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<PasswordResetToken> {
    try {
      if (!email) {
        throw new PasswordResetError('Email is required');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        logAuthError('requestPasswordReset', error);
        throw new PasswordResetError(error.message);
      }

      return {
        token: '', // Token is sent via email
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        email,
      };
    } catch (err) {
      if (isNetworkError(err)) {
        throw new NetworkError();
      }
      throw err;
    }
  }

  /**
   * Confirm password reset with new password
   */
  async confirmPasswordReset(
    token: string,
    newPassword: string,
  ): Promise<void> {
    try {
      if (!token || !newPassword) {
        throw new PasswordResetError('Token and password are required');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new PasswordResetError(error.message);
      }
    } catch (err) {
      if (isNetworkError(err)) {
        throw new NetworkError();
      }
      throw err;
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.sessionStorage.getSession();
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.sessionStorage.getSession()?.user ?? null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const session = this.sessionStorage.getSession();
    if (!session) return false;
    
    const now = new Date();
    return now < session.expiresAt;
  }

  /**
   * Initialize session from Supabase
   */
  async initializeSession(): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        logAuthError('initializeSession', error);
        if (isInvalidSessionError(error)) {
          await clearBrokenLocalSession();
        }
        return null;
      }

      if (!data.session?.user) {
        this.sessionStorage.clear();
        return null;
      }

      const session = this.buildSession(data.session);
      this.sessionStorage.saveSession(session);
      this.setupAutoRefresh();

      return session;
    } catch (err) {
      logAuthError('initializeSession', err);
      return null;
    }
  }

  /**
   * Setup automatic token refresh
   */
  private setupAutoRefresh(): void {
    this.clearAutoRefresh();

    if (typeof window === 'undefined') return;

    this.refreshTimer = window.setInterval(() => {
      const session = this.sessionStorage.getSession();
      if (session && this.sessionStorage.needsRefresh()) {
        void this.refreshSession();
      }
    }, this.AUTO_REFRESH_INTERVAL);
  }

  /**
   * Clear auto-refresh timer
   */
  private clearAutoRefresh(): void {
    if (this.refreshTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.refreshTimer);
    }
    this.refreshTimer = null;
  }

  /**
   * Initialize auto-refresh on service creation
   */
  private initializeAutoRefresh(): void {
    if (typeof window === 'undefined') return;

    // Setup refresh only if there's an existing session
    const session = this.sessionStorage.getSession();
    if (session && this.isAuthenticated()) {
      this.setupAutoRefresh();
    }
  }

  /**
   * Build session from Supabase session
   */
  private buildSession(supabaseSession: any): Session {
    if (!supabaseSession?.user) {
      throw new Error('Invalid session data');
    }

    const expiresAt = new Date(
      supabaseSession.expires_at ? supabaseSession.expires_at * 1000 : Date.now() + 60 * 60 * 1000
    );

    return {
      token: supabaseSession.access_token,
      expiresAt,
      refreshToken: supabaseSession.refresh_token || '',
      user: {
        id: supabaseSession.user.id,
        email: supabaseSession.user.email || '',
        displayName: supabaseSession.user.user_metadata?.display_name || supabaseSession.user.email?.split('@')[0] || '',
        mfaEnabled: supabaseSession.user.user_metadata?.mfa_enabled || false,
        mfaMethod: supabaseSession.user.user_metadata?.mfa_method,
        role: supabaseSession.user.user_metadata?.role || 'user',
        createdAt: new Date(supabaseSession.user.created_at),
        updatedAt: new Date(supabaseSession.user.updated_at),
      },
    };
  }

  /**
   * Cleanup on service destruction
   */
  destroy(): void {
    this.clearAutoRefresh();
  }
}

// Singleton instance
let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
}
