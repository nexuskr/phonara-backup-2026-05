// src/lib/onboarding.ts
import { supabase } from "@/integrations/supabase/client";

interface ClaimResult {
  success: boolean;
  rewardAmount: number;
  newBalance?: number;
  nextStep: number;
  error?: string;
}

/**
 * 신규 가입 온보딩 보상 지급 함수
 */
export async function claimOnboardingReward(
  userId: string,
  amount: number = 10000
): Promise<ClaimResult> {
  const FLOW = "welcome_onboarding";

  try {
    // 중복 지급 방지 체크
    const { data: existing } = await supabase
      .from("user_onboarding_progress")
      .select("step")
      .eq("user_id", userId)
      .eq("flow", FLOW)
      .single();

    if (existing && existing.step >= 2) {
      return {
        success: false,
        rewardAmount: amount,
        nextStep: existing.step,
        error: "이미 보상을 받았습니다.",
      };
    }

    // 잔액 증가
    const { data: balanceData } = await supabase
      .from("phon_balances")
      .update({
        balance: supabase.rpc("increment_balance", { amount }),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("balance")
      .single();

    // 온보딩 진행 상태 업데이트
    await supabase.from("user_onboarding_progress").upsert(
      {
        user_id: userId,
        flow: FLOW,
        step: 2,
        data: {
          reward_amount: amount,
          reward_given_at: new Date().toISOString(),
          next_action: "go_to_trading",
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,flow" }
    );

    return {
      success: true,
      rewardAmount: amount,
      newBalance: balanceData?.balance,
      nextStep: 2,
    };
  } catch (error: any) {
    console.error("claimOnboardingReward error:", error);
    return {
      success: false,
      rewardAmount: amount,
      nextStep: 0,
      error: error.message || "보상 지급 중 오류가 발생했습니다.",
    };
  }
}