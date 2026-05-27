export type Tier = "NORMAL" | "VIP" | "GOD";

export interface LocalUser {
  id: string;
  email: string;
  nickname: string;
  phone: string;
  realName: string;
  birth: string;
  balance: number;
  coinBalance: number;
  todayEarnings: number;
  streak: number;
  level: number;
  xp: number;
  tier: Tier;
  isAdmin: boolean;
  badges: unknown[];
  lastAttendance?: string;
  attendanceStreak: number;
}

export interface LocalDB {
  user: LocalUser | null;
}

const STORAGE_KEY = "phonara_local_db";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function loadDB(): LocalDB {
  if (typeof window === "undefined") {
    return { user: null };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null };
    const parsed = JSON.parse(raw);
    if (!isObject(parsed) || !("user" in parsed)) {
      return { user: null };
    }
    return { user: parsed.user ?? null };
  } catch {
    return { user: null };
  }
}

export function saveDB(db: LocalDB): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // best-effort only
  }
}
