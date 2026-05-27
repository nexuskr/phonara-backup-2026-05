/**
 * AuthContext - Global authentication state using React Context
 * 
 * Provides auth state and methods to all components via useAuth hook
 */

import React, { createContext, useCallback, useEffect, useState, useRef } from 'react';
import type { User, AuthError, Session } from '@/lib/auth-types';
import { getAuthService } from '@/lib/auth/service';
import { logAuthError } from '@/lib/auth/errorHandler';

export interface AuthContextType {
  // State
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  session: Session | null;

  // Methods
  login: (email: string, password: string) => Promise<Session>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
  verifyMFA: (challengeId: string, code: string) => Promise<Session>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider - Wraps the app with auth context
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authService = useRef(getAuthService());
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const mounted = useRef(true);

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const initialSession = await authService.current.initializeSession();
        if (mounted.current) {
          if (initialSession) {
            setSession(initialSession);
            setUser(initialSession.user);
            setIsAuthenticated(true);
          } else {
            setSession(null);
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        if (mounted.current) {
          logAuthError('initializeAuth', err);
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted.current = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<Session> => {
      try {
        setIsLoading(true);
        setError(null);

        const newSession = await authService.current.login(email, password);

        if (mounted.current) {
          setSession(newSession);
          setUser(newSession.user);
          setIsAuthenticated(true);
        }

        return newSession;
      } catch (err) {
        const authError = err as AuthError;
        if (mounted.current) {
          setError(authError);
        }
        throw err;
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.current.logout();

      if (mounted.current) {
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err as AuthError);
      }
      throw err;
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<Session | null> => {
    try {
      const newSession = await authService.current.refreshSession();

      if (mounted.current) {
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          setIsAuthenticated(true);
          setError(null);
        } else {
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }

      return newSession;
    } catch (err) {
      if (mounted.current) {
        setError(err as AuthError);
      }
      throw err;
    }
  }, []);

  const verifyMFA = useCallback(
    async (challengeId: string, code: string): Promise<Session> => {
      try {
        setIsLoading(true);
        setError(null);

        const newSession = await authService.current.verifyMFA(
          challengeId,
          code,
        );

        if (mounted.current) {
          setSession(newSession);
          setUser(newSession.user);
          setIsAuthenticated(true);
        }

        return newSession;
      } catch (err) {
        if (mounted.current) {
          setError(err as AuthError);
        }
        throw err;
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await authService.current.requestPasswordReset(email);
      // Success message could be handled by the component
    } catch (err) {
      if (mounted.current) {
        setError(err as AuthError);
      }
      throw err;
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const confirmPasswordReset = useCallback(
    async (token: string, newPassword: string): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        await authService.current.confirmPasswordReset(token, newPassword);
        // Might want to auto-logout after password reset
      } catch (err) {
        if (mounted.current) {
          setError(err as AuthError);
        }
        throw err;
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    if (mounted.current) {
      setError(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    isAuthenticated,
    session,
    login,
    logout,
    refreshSession,
    verifyMFA,
    resetPassword,
    confirmPasswordReset,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth hook - Access auth state and methods
 */
export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
