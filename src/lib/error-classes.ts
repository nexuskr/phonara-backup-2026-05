/**
 * Custom error classes for authentication
 */

export class BaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends BaseError {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class AuthError extends BaseError {
  constructor(
    message: string,
    code: string = "AUTH_ERROR",
    statusCode: number = 401,
  ) {
    super(message, code, statusCode);
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor() {
    super("Invalid email or password", "INVALID_CREDENTIALS");
  }
}

export class MFARequiredError extends AuthError {
  constructor(public challengeId: string) {
    super("MFA verification required", "MFA_REQUIRED", 403);
  }
}

export class SessionExpiredError extends AuthError {
  constructor() {
    super("Session has expired", "SESSION_EXPIRED", 401);
  }
}

export class PasswordResetError extends AuthError {
  constructor(message: string) {
    super(message, "PASSWORD_RESET_ERROR", 400);
  }
}

export class NetworkError extends BaseError {
  constructor(message: string, statusCode?: number) {
    super(message, "NETWORK_ERROR", statusCode || 0);
  }
}

export class UnknownError extends BaseError {
  constructor(message: string = "An unexpected error occurred") {
    super(message, "UNKNOWN_ERROR", 500);
  }
}

/**
 * Error code to user-friendly message mapping
 */
export const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "이메일 또는 비밀번호가 잘못되었습니다.",
  AUTH_ERROR: "인증에 실패했습니다.",
  SESSION_EXPIRED: "세션이 만료되었습니다. 다시 로그인해주세요.",
  MFA_REQUIRED: "2단계 인증이 필요합니다.",
  PASSWORD_RESET_ERROR: "비밀번호 재설정에 실패했습니다.",
  NETWORK_ERROR: "네트워크 연결에 실패했습니다.",
  VALIDATION_ERROR: "입력 값이 유효하지 않습니다.",
  UNKNOWN_ERROR: "예기치 않은 오류가 발생했습니다.",
};

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: Error): string {
  if (error instanceof BaseError) {
    return ERROR_MESSAGES[error.code] || error.message;
  }
  return ERROR_MESSAGES["UNKNOWN_ERROR"];
}
