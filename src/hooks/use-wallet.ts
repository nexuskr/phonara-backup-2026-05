import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { fetchWallet, type WalletBalance } from "@/lib/wallet";
import { useWalletChannel } from "@/packages/realtime";

/**
 * useWallet Hook - Primary hook for general wallet balance
 *
 * ARCHITECTURE (as of 2026-05-22):
 * - This hook is the recommended way to access `wallet_balances` (Primary Wallet).
 * - `wallet_balances` manages: available_balance, locked_balance, pending_balance, total_balance
 * - For PHON token economy (staking, Duel, specific rewards) → use `phon_balances` related logic instead.
 *
 * Realtime Strategy:
 * - Main subscription: `wallet_balances` UPDATE
 * - Safety Net: `live_trade_history` INSERT (temporary workaround until atomic trading RPCs are fully reliable)
 *
 * Usage:
 * - Prefer this hook in most components for general balance display
 * - Use `reload()` or `wallet:refresh` event after balance-changing operations
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s),
    );
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

export function useWallet(userId: string | undefined) {
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(0);

  const reload = useCallback(async () => {
    if (!userId) return;
    const w = await fetchWallet(userId);
    setWallet(w);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void reload();

    const onRefresh = () => void reload();
    window.addEventListener("wallet:refresh", onRefresh);

    return () => window.removeEventListener("wallet:refresh", onRefresh);
  }, [userId, reload]);

  // Shared realtime channel for wallet updates
  useWalletChannel({
    key: userId ? `wallet:${userId}` : "",
    bindings: userId
      ? [
          // Primary source
          {
            event: "UPDATE",
            table: "wallet_balances",
            filter: `user_id=eq.${userId}`,
          },

          // Temporary safety net for trade settlement timing issues.
          // Should be reduced once atomic open/close position RPCs are implemented.
          {
            event: "INSERT",
            table: "live_trade_history",
            filter: `user_id=eq.${userId}`,
          },
        ]
      : [],
    onEvent: (payload) => {
      if (payload.table === "wallet_balances") {
        const next = payload.new as unknown as WalletBalance;
        setWallet((prev) => {
          if (prev && next.available_balance > prev.available_balance) {
            setPulse((p) => p + 1);
          }
          return next;
        });
      } else {
        // Fallback refresh when trade history changes
        void reload();
      }
    },
    enabled: !!userId,
  });

  return { wallet, loading, reload, pulse };
}
