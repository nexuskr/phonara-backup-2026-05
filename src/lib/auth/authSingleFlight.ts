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
      userId: "dev-user",
    };
  } catch (error) {
    console.error("Session verification error:", error);
    return {
      valid: false,
      error: "세션 확인에 실패했습니다.",
    };
  }
}

/**
 * invalidateSessionCache
 * 세션 캐시 무효화 (현재는 더미)
 */
export function invalidateSessionCache(): void {
  // TODO: 실제 캐시 무효화 로직이 필요하면 여기에 구현
  // 현재는 최소 동작을 위해 빈 함수로 유지
  console.log("[authSingleFlight] invalidateSessionCache called (no-op)");
}
