/**
 * API contract types for authentication endpoints
 */

import type { User } from '@/lib/auth-types';

/**
 * Login request/response
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string; // ISO date
  refreshToken: string;
  user: User;
}

/**
 * Logout request/response
 */
export interface LogoutRequest {
  // No additional data needed
}

export interface LogoutResponse {
  success: boolean;
}

/**
 * Refresh token request/response
 */
export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  token: string;
  expiresAt: string; // ISO date
  refreshToken: string;
}

/**
 * MFA verification request/response
 */
export interface VerifyMFARequest {
  challengeId: string;
  code: string;
  method: 'otp' | 'passkey';
}

export interface VerifyMFAResponse {
  success: boolean;
  token?: string;
  expiresAt?: string; // ISO date
}

/**
 * Password reset request/response
 */
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

/**
 * Password reset confirmation request/response
 */
export interface ConfirmPasswordResetRequest {
  token: string;
  newPassword: string;
}

export interface ConfirmPasswordResetResponse {
  success: boolean;
  message: string;
}

/**
 * Session validation request/response
 */
export interface ValidateSessionRequest {
  token: string;
}

export interface ValidateSessionResponse {
  valid: boolean;
  user?: User;
  expiresAt?: string; // ISO date
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
    userMessage: string;
  };
}

/**
 * Type guard for error responses
 */
export function isErrorResponse(data: unknown): data is ErrorResponse {
  return (
    data !== null &&
    typeof data === 'object' &&
    'error' in data &&
    typeof (data as any).error === 'object'
  );
}
