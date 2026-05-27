/**
 * Error handling for authentication
 */

import type { AuthError } from '@/lib/auth-types';

export interface ErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  userMessage: string;
}

/**
 * Map auth errors to user-friendly messages
 */
export function getErrorMessage(error: AuthError | Error | null): string {
  if (!error) return 'An unknown error occurred';

  if ('code' in error && 'userMessage' in error) {
    return (error as any).userMessage || error.message;
  }

  if ('code' in error) {
    const authError = error as AuthError;
    switch (authError.code) {
      case 'INVALID_CREDENTIALS':
        return 'Invalid email or password. Please try again.';
      case 'MFA_REQUIRED':
        return 'Multi-factor authentication is required.';
      case 'SESSION_EXPIRED':
        return 'Your session has expired. Please log in again.';
      case 'PASSWORD_RESET_FAILED':
        return 'Password reset failed. Please try again.';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection.';
      default:
        return error.message || 'An authentication error occurred.';
    }
  }

  return error.message || 'An unknown error occurred';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  const err = error as any;
  
  return (
    err?.code === 'NETWORK_ERROR' ||
    err?.message?.includes('network') ||
    err?.message?.includes('fetch') ||
    err?.status === 0 ||
    err instanceof TypeError
  );
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (!error) return false;

  const err = error as any;
  
  return (
    'code' in err ||
    err?.status === 401 ||
    err?.status === 403 ||
    err?.message?.includes('auth') ||
    err?.message?.includes('jwt') ||
    err?.message?.includes('unauthorized')
  );
}

/**
 * Check if error is a session expiry error
 */
export function isSessionExpiredError(error: unknown): boolean {
  if (!error) return false;

  const err = error as any;
  
  return (
    err?.code === 'SESSION_EXPIRED' ||
    err?.code === 'bad_jwt' ||
    err?.message?.includes('expired') ||
    err?.message?.includes('jwt expired') ||
    err?.message?.includes('invalid jwt') ||
    err?.message?.includes('missing sub claim')
  );
}

/**
 * Create error response for API
 */
export function createErrorResponse(error: Error | null): ErrorResponse {
  if (!error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      statusCode: 500,
      userMessage: 'An unexpected error occurred. Please try again.',
    };
  }

  const authError = error as AuthError;
  
  return {
    code: authError.code || 'UNKNOWN_ERROR',
    message: error.message,
    statusCode: (authError.statusCode as number) || 500,
    userMessage: getErrorMessage(authError),
  };
}

/**
 * Log error for debugging (with privacy consideration)
 */
export function logAuthError(context: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[AuthError] ${context}:`, error);
  }
}
