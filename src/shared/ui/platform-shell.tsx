import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Gift,
  Home,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet as WalletIcon,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { APP_ROUTES } from "@/shared/constants/routes";

interface PlatformShellProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}

const navItems = [
  { to: APP_ROUTES.home, label: "홈", icon: Home },
  { to: APP_ROUTES.earn, label: "보상", icon: Gift },
  { to: APP_ROUTES.trading, label: "트레이딩", icon: BarChart3 },
  { to: APP_ROUTES.wallet, label: "지갑", icon: WalletIcon },
  { to: APP_ROUTES.referral, label: "추천", icon: Users },
] as const;

const routeTitles: Record<string, string> = {
  [APP_ROUTES.home]: "홈 오케스트레이션",
  [APP_ROUTES.earn]: "보상 허브",
  [APP_ROUTES.trading]: "실전 트레이딩",
  [APP_ROUTES.wallet]: "자산 운영",
  [APP_ROUTES.referral]: "추천 성장",
};

function isActivePath(pathname: string, target: string) {
  if (target === APP_ROUTES.home) {
    return pathname === APP_ROUTES.home;
  }

  return pathname === target || pathname.startsWith(`${target}/`);
}

export function PlatformShell({
  children,
  className = "",
  innerClassName = "mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6",
}: PlatformShellProps) {
  const location = useLocation();
  const currentTitle = routeTitles[location.pathname] ?? "PHONARA ELITE";

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden bg-[#03050f] text-white ${className}`}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,#4c1d95_0%,#090511_44%,#03050f_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(115deg,rgba(245,158,11,0.12),transparent_28%,rgba(34,211,238,0.09)_68%,rgba(244,114,182,0.08)_100%)]" />
      <div className="pointer-events-none fixed left-1/2 -top-28 h-56 w-56 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-20 -right-8 h-48 w-48 rounded-full bg-cyan-400/20 blur-[150px]" />

      <div className="relative z-10 mx-auto min-h-screen max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="sticky top-0 z-30 px-4 pb-4 pt-4 sm:px-6"
        >
          <div className="rounded-[28px] border border-white/10 bg-white/4 px-4 py-3 backdrop-blur-2xl sm:px-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-100/85">
                  PHONARA ELITE
                </p>
                <p className="mt-1 text-lg font-black text-white sm:text-xl">
                  {currentTitle}
                </p>
                <p className="mt-1 text-[11px] text-slate-200/80 sm:text-xs">
                  글로벌 수준의 실시간 시장 운영, 모바일 퍼스트 거래 경험
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-100">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  zero-lag sync
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  adaptive UX
                </span>
              </div>

              <div className="hidden items-center gap-2 xl:flex">
                {navItems.map(({ to, label, icon: Icon }) => {
                  const active = isActivePath(location.pathname, to);
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-black transition ${
                        active
                          ? "bg-white/10 text-white"
                          : "text-slate-200/70 hover:bg-white/6 hover:text-white"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.header>

        <div className={innerClassName}>{children}</div>
      </div>

      {location.pathname.startsWith("/auth") ? null : (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#03050f]/90 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-2xl sm:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between px-3 pt-2">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = isActivePath(location.pathname, to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[10px] font-black transition ${
                    active ? "bg-white/10 text-white" : "text-white/65"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export default PlatformShell;
