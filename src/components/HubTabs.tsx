import { NavLink, useLocation } from "react-router-dom";
import { Target, Sparkles, Gamepad2, Crown, Layers, Users, Wallet, ArrowDownToLine, ArrowUpFromLine, Receipt, Trophy, Award, Share2 } from "lucide-react";
import type { ComponentType } from "react";

type Tab = { to: string; label: string; icon: ComponentType<{ className?: string }> };

const HUBS: Record<string, { title: string; tagline: string; tabs: Tab[] }> = {
  earn: {
    title: "EARN",
    tagline: "돈 버는 모든 것 — 한 곳에서",
    tabs: [
      { to: "/missions", label: "미션", icon: Target },
      { to: "/quests", label: "퀘스트", icon: Sparkles },
      { to: "/roulette", label: "룰렛", icon: Gamepad2 },
      { to: "/season-pass", label: "시즌패스", icon: Award },
    ],
  },
  empire: {
    title: "EMPIRE",
    tagline: "당신의 제국, 등급으로 말하다",
    tabs: [
      { to: "/packages", label: "패키지", icon: Crown },
      { to: "/empire", label: "Tier", icon: Layers },
      { to: "/empire?view=founding", label: "창립멤버", icon: Users },
    ],
  },
  treasury: {
    title: "TREASURY",
    tagline: "잔고 · 입출금 · 내역",
    tabs: [
      { to: "/wallet", label: "지갑", icon: Wallet },
      { to: "/wallet?tab=deposit", label: "입금", icon: ArrowDownToLine },
      { to: "/wallet?tab=withdraw", label: "출금", icon: ArrowUpFromLine },
      { to: "/wallet?tab=history", label: "내역", icon: Receipt },
    ],
  },
  legacy: {
    title: "LEGACY",
    tagline: "당신이 쌓은 것 — 영원히 남는다",
    tabs: [
      { to: "/legacy", label: "랭킹", icon: Trophy },
      { to: "/achievements", label: "업적", icon: Award },
      { to: "/legacy?tab=referral", label: "레퍼럴", icon: Share2 },
    ],
  },
};

export default function HubTabs({ hub }: { hub: keyof typeof HUBS }) {
  const cfg = HUBS[hub];
  const loc = useLocation();
  if (!cfg) return null;

  return (
    <div className="container pt-4 pb-2">
      <div className="flex items-baseline gap-3 mb-3">
        <h1 className="font-imperial text-2xl md:text-3xl text-gradient-imperial tracking-[0.18em]">
          {cfg.title}
        </h1>
        <span className="text-[11px] text-muted-foreground tracking-wide hidden sm:inline">
          {cfg.tagline}
        </span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
        {cfg.tabs.map(({ to, label, icon: Icon }) => {
          const path = to.split("?")[0];
          const active = loc.pathname === path;
          return (
            <NavLink
              key={to}
              to={to}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition press ${
                active
                  ? "bg-gradient-imperial text-primary-foreground glow-imperial"
                  : "glass text-muted-foreground hover:text-foreground border border-border/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
