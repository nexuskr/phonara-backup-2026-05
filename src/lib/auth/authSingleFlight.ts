/**
 * authSingleFlight.ts
 * 세션 검증 유틸리티 (최소 동작 버전)
 */

export interface SessionResult {
  valid: boolean;
  userId?: string;
  error?: string;
}

export async function verifySessionOnce(): Promise<SessionResult> {
  try {
    // TODO: 나중에 Supabase 연동으로 업그레이드 가능
    return {
      valid: true,
      userId: 'dev-user',
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return {
      valid: false,
      error: '세션 확인에 실패했습니다.',
    };
  }
}