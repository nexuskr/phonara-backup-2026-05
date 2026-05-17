/**
 * useDailyChest — daily reward chest state + open RPC.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWalletChannel } from "@pkg/realtime";
import { type ChestTier } from "@/lib/gamification";

export type DailyChestState = {
  canOpen: boolean;
  streakDay: number;
  tierPreview: ChestTier;
  lastOpenedAt: string | null;
};

export type ChestOpenResult = {
  tier: ChestTier;
  phonReward: number;
  xpReward: number;
  boosterHours: number;
  payload: Record<string, unknown>;
};

const DEFAULT: DailyChestState = { canOpen: false, streakDay: 0, tierPreview: "bronze", lastOpenedAt: null };

export function useDailyChest() {
  const [state, setState] = useState<DailyChestState>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUid(user?.id ?? null);
      if (!user) { setState(DEFAULT); return; }
      const { data, error } = await (supabase.rpc as any)("get_daily_chest_state");
      if (error || !Array.isArray(data) || data.length === 0) { setState(DEFAULT); return; }
      const row = data[0] as { can_open: boolean; streak_day: number; tier_preview: ChestTier; last_opened_at: string | null };
      setState({
        canOpen: !!row.can_open,
        streakDay: Number(row.streak_day ?? 0),
        tierPreview: (row.tier_preview ?? "bronze") as ChestTier,
        lastOpenedAt: row.last_opened_at ?? null,
      });
    } catch {
      setState(DEFAULT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useWalletChannel({
    key: uid ? `chest:${uid}` : "",
    bindings: uid
      ? [{ event: "INSERT", table: "daily_chest_opens", filter: `user_id=eq.${uid}` }]
      : [],
    onEvent: () => void load(),
    enabled: !!uid,
  });

  const open = useCallback(async (): Promise<ChestOpenResult | null> => {
    if (!state.canOpen || opening) return null;
    setOpening(true);
    try {
      const { data, error } = await (supabase.rpc as any)("open_daily_chest");
      if (error) throw error;
      const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
      if (!row) return null;
      await load();
      return {
        tier: row.tier as ChestTier,
        phonReward: Number(row.phon_reward ?? 0),
        xpReward: Number(row.xp_reward ?? 0),
        boosterHours: Number(row.booster_hours ?? 0),
        payload: (row.payload ?? {}) as Record<string, unknown>,
      };
    } finally {
      setOpening(false);
    }
  }, [state.canOpen, opening, load]);

  return { ...state, loading, opening, open, reload: load };
}
