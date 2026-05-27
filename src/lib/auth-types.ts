/**
 * Domain types for authentication
 */

export type MFAMethod = 'otp' | 'passkey';

export type UserRole = 'user' | 'admin' | 'moderator' | 'support';

export interface User {
  id: string;
  email: string;
  displayName: string;
  mfaEnabled: boolean;
  mfaMethod?: MFAMethod;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  token: string;
  expiresAt: Date;
  refreshToken: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
}

export interface MFAChallenge {
  id: string;
  method: MFAMethod;
  createdAt: Date;
  expiresAt: Date;
}

export interface PasswordResetToken {
  token: string;
  expiresAt: Date;
  email: string;
}

/**
 * Custom error class for auth-specific errors
 */
export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor(message = 'Invalid email or password') {
    super('INVALID_CREDENTIALS', message, 401);
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

export class MFARequiredError extends AuthError {
  constructor(public challengeId: string) {
    super('MFA_REQUIRED', 'Multi-factor authentication is required', 403);
    Object.setPrototypeOf(this, MFARequiredError.prototype);
  }
}

export class SessionExpiredError extends AuthError {
  constructor(message = 'Session has expired') {
    super('SESSION_EXPIRED', message, 401);
    Object.setPrototypeOf(this, SessionExpiredError.prototype);
  }
}

export class PasswordResetError extends AuthError {
  constructor(message = 'Password reset failed') {
    super('PASSWORD_RESET_FAILED', message, 400);
    Object.setPrototypeOf(this, PasswordResetError.prototype);
  }
}

export class NetworkError extends AuthError {
  constructor(message = 'Network error occurred') {
    super('NETWORK_ERROR', message, 0);
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
