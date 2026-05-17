/**
 * useAchievement — read-only access to catalog + current user's unlocks + badges.
 * Companion to use-achievement-watcher (which fires unlock side-effects elsewhere).
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AchievementCatalogRow = {
  key: string;
  name: string;
  description: string;
  category: string;
  ap: number;
  reward_credit: number;
  badge_tier: string | null;
  sort_order: number;
};

export type UserAchievementRow = { achievement_key: string; unlocked_at: string };

export type UserBadgeRow = { badge_key: string; acquired_at: string; equipped_slot: number | null };

export function useAchievement() {
  const [catalog, setCatalog] = useState<AchievementCatalogRow[]>([]);
  const [unlocked, setUnlocked] = useState<UserAchievementRow[]>([]);
  const [badges, setBadges] = useState<UserBadgeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const [cat, ua, ub] = await Promise.all([
        supabase.from("achievements_catalog").select("*").order("sort_order", { ascending: true }),
        user ? supabase.from("user_achievements").select("achievement_key, unlocked_at").eq("user_id", user.id) : Promise.resolve({ data: [] as UserAchievementRow[] }),
        user ? supabase.from("user_badges").select("badge_key, acquired_at, equipped_slot").eq("user_id", user.id) : Promise.resolve({ data: [] as UserBadgeRow[] }),
      ]);
      setCatalog(((cat as { data: AchievementCatalogRow[] | null }).data ?? []) as AchievementCatalogRow[]);
      setUnlocked(((ua as { data: UserAchievementRow[] | null }).data ?? []) as UserAchievementRow[]);
      setBadges(((ub as { data: UserBadgeRow[] | null }).data ?? []) as UserBadgeRow[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const unlockedSet = new Set(unlocked.map(u => u.achievement_key));
  const completion = catalog.length > 0 ? Math.round((unlocked.length / catalog.length) * 100) : 0;

  return { catalog, unlocked, unlockedSet, badges, loading, completion, reload: load };
}
