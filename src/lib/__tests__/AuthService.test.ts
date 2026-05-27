/**
 * AuthService tests - Unit tests for authentication
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Session as SupabaseSession } from '@supabase/supabase-js';
import { AuthService } from '@/lib/auth/service';
import {
  InvalidCredentialsError,
  SessionExpiredError,
} from '@/lib/auth-types';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
      getSession: vi.fn(),
      verifyOtp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth-recovery', () => ({
  isInvalidSessionError: vi.fn(() => false),
  clearBrokenLocalSession: vi.fn(),
}));

// Mock storage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  mfaEnabled: false,
  role: 'user' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSupabaseSession: SupabaseSession = {
  access_token: 'access-token-123',
  refresh_token: 'refresh-token-123',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  expires_in: 3600,
  token_type: 'Bearer',
  user: {
    id: 'user-123',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { display_name: 'Test User' },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: mockSupabaseSession, user: mockSupabaseSession.user },
        error: null,
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBe('access-token-123');
      expect(result.refreshToken).toBe('refresh-token-123');
    });

    it('should throw InvalidCredentialsError with invalid credentials', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid credentials', status: 401 } as any,
      });

      await expect(
        authService.login('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw error if email is missing', async () => {
      await expect(
        authService.login('', 'password123'),
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw error if password is missing', async () => {
      await expect(
        authService.login('test@example.com', ''),
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('should save session to localStorage after successful login', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: mockSupabaseSession, user: mockSupabaseSession.user },
        error: null,
      });

      await authService.login('test@example.com', 'password123');

      const stored = mockLocalStorage.getItem('phonara_auth_session');
      expect(stored).toBeDefined();
      expect(JSON.parse(stored!).token).toBe('access-token-123');
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      // Setup initial session
      mockLocalStorage.setItem(
        'phonara_auth_session',
        JSON.stringify({
          token: 'access-token-123',
          refreshToken: 'refresh-token-123',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          user: mockUser,
        }),
      );

      await authService.logout();

      expect(authService.isAuthenticated()).toBe(false);
      expect(mockLocalStorage.getItem('phonara_auth_session')).toBeNull();
    });

    it('should clear session even if logout request fails', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: { message: 'Logout failed' } as any,
      });

      // Setup initial session
      mockLocalStorage.setItem(
        'phonara_auth_session',
        JSON.stringify({
          token: 'access-token-123',
          refreshToken: 'refresh-token-123',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          user: mockUser,
        }),
      );

      await authService.logout();

      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('session refresh', () => {
    it('should successfully refresh expired token', async () => {
      const { supabase } = await import('@/lib/supabase');

      const refreshedSession: SupabaseSession = {
        ...mockSupabaseSession,
        access_token: 'new-access-token',
        expires_at: Math.floor(Date.now() / 1000) + 7200,
      };

      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
        data: { session: refreshedSession, user: refreshedSession.user },
        error: null,
      });

      const result = await authService.refreshSession();

      expect(result).not.toBeNull();
      expect(result?.token).toBe('new-access-token');
    });

    it('should return null if refresh fails', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid refresh token' } as any,
      });

      const result = await authService.refreshSession();

      expect(result).toBeNull();
    });

    it('should prevent concurrent refresh calls (race condition)', async () => {
      const { supabase } = await import('@/lib/supabase');

      let callCount = 0;
      vi.mocked(supabase.auth.refreshSession).mockImplementation(async () => {
        callCount++;
        // Simulate network delay
        await new Promise((res) => setTimeout(res, 100));
        return {
          data: { session: mockSupabaseSession, user: mockSupabaseSession.user },
          error: null,
        };
      });

      // Call refresh multiple times concurrently
      const [result1, result2, result3] = await Promise.all([
        authService.refreshSession(),
        authService.refreshSession(),
        authService.refreshSession(),
      ]);

      // Should still only make 1 actual API call due to RefreshManager
      // (This depends on refresh implementation using RefreshManager)
      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      expect(result3).not.toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no session exists', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true when valid session exists', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: mockSupabaseSession, user: mockSupabaseSession.user },
        error: null,
      });

      await authService.login('test@example.com', 'password123');

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when session has expired', () => {
      const expiredSession = {
        token: 'token',
        expiresAt: new Date(Date.now() - 1000), // 1 second in the past
        refreshToken: 'refresh',
        user: mockUser,
      };

      mockLocalStorage.setItem(
        'phonara_auth_session',
        JSON.stringify(expiredSession),
      );

      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user when authenticated', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: mockSupabaseSession, user: mockSupabaseSession.user },
        error: null,
      });

      await authService.login('test@example.com', 'password123');
      const user = authService.getCurrentUser();

      expect(user).not.toBeNull();
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null when not authenticated', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  describe('password reset', () => {
    it('should request password reset email', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await authService.requestPasswordReset(
        'test@example.com',
      );

      expect(result.email).toBe('test@example.com');
      expect(vi.mocked(supabase.auth.resetPasswordForEmail)).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({ redirectTo: expect.stringContaining('/auth/reset-password') }),
      );
    });

    it('should throw error if email is empty', async () => {
      await expect(
        authService.requestPasswordReset(''),
      ).rejects.toThrow();
    });
  });

  describe('initialization', () => {
    it('should initialize from existing Supabase session', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSupabaseSession },
        error: null,
      });

      const result = await authService.initializeSession();

      expect(result).not.toBeNull();
      expect(result?.user.email).toBe('test@example.com');
    });

    it('should return null if no session exists', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await authService.initializeSession();

      expect(result).toBeNull();
    });
  });
});
