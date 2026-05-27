// @ts-nocheck: Deno lint + VSCode 설정 충돌로 임시 비활성화
import { Link } from "react-router-dom";
import { formatKRW, useDB } from "@/lib/store";
import { Wallet } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

/**
 * Phonara V2 Top HUD — Empire 요소 완전 제거
 */
export default function TopHUD() {
  const [db] = useDB();
  const user = db.user;

  if (!user) return null;

  return (
    <div className="hidden md:flex items-center gap-2">
      <Link
        to="/treasury"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/20 hover:border-primary/50 transition"
      >
        <Wallet className="w-3.5 h-3.5 text-primary" />
        <span className="font-hud text-sm text-money font-bold tabular-nums">
          {formatKRW(user.balance ?? 0)} PHON
        </span>
      </Link>

      <LanguageSwitcher />
    </div>
  );
}

/** Mobile Compact */
export function TopHUDCompact() {
  const [db] = useDB();
  const user = db.user;
  if (!user) return null;

  return (
    <Link
      to="/treasury"
      className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full glass border border-primary/30"
    >
      <Wallet className="w-3 h-3 text-primary" />
      <span className="font-hud text-xs text-money font-bold tabular-nums">
        {formatKRW(user.balance ?? 0)} PHON
      </span>
    </Link>
  );
}
