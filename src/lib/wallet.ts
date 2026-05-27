import { supabase } from "@/integrations/supabase/client";

export interface WalletBalance {
  user_id: string;
  available_balance: number;
  locked_balance: number;
  pending_balance: number;
  total_balance: number;
  today_earned: number;
  last_reset_date: string | null;
}

export async function fetchWallet(
  userId: string,
): Promise<WalletBalance | null> {
  const { data, error } = await (supabase
    .from("wallet_balances" as any)
    .select(
      `user_id, available_balance, locked_balance, pending_balance, total_balance, today_earned, last_reset_date`,
    )
    .eq("user_id", userId)
    .maybeSingle() as Promise<{
      data: WalletBalance | null;
      error: unknown;
    }>);

  if (error) {
    console.warn("[fetchWallet] failed", error);
    return null;
  }

  return data;
}
