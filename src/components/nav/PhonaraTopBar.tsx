import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bell, ChevronDown, LogOut, Settings, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyPower } from "@/hooks/use-my-power";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * PhonaraTopBar — 일론머스크 감성 버전
 * 제국/황제/아바타 컨셉 완전 제거
 * 미래지향적 + 프리미엄 + 깔끔한 테크 느낌
 */
export default function PhonaraTopBar() {
  const nav = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancel) return;
      setAuthed(!!data.session);
      setEmail(data.session?.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s);
      setEmail(s?.user?.email ?? null);
    });
    return () => {
      cancel = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <header
      className="sticky top-0 z-40 h-14 md:h-16 border-b border-white/10 bg-[#0a0c14]/90 backdrop-blur-lg supports-backdrop-filter:bg-[#0a0c14]/80 safe-top"
      role="banner"
    >
      <div className="container h-full flex items-center justify-between gap-3">
        {/* 로고 - 일론머스크 감성 (깔끔하고 미래지향적) */}
        <Link
          to="/"
          className="font-black text-2xl tracking-[-0.5px] text-white hover:text-[#E8B923] transition-colors"
        >
          PHONARA
        </Link>

        {/* 비로그인 상태 */}
        {authed === false && (
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="px-4 py-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              로그인
            </Link>
            <Link
              to="/auth?mode=signup"
              className="px-5 py-1.5 rounded-xl text-sm font-semibold bg-white text-[#0a0c14] hover:bg-[#E8B923] transition-all active:scale-[0.985]"
            >
              무료로 시작
            </Link>
          </div>
        )}

        {/* 로그인 상태 */}
        {authed && (
          <AuthedRight
            email={email}
            onSignOut={async () => {
              await supabase.auth.signOut();
              nav("/");
            }}
          />
        )}
      </div>
    </header>
  );
}

function AuthedRight({
  email,
  onSignOut,
}: {
  email: string | null;
  onSignOut: () => void;
}) {
  const { phon } = useMyPower();

  return (
    <div className="flex items-center gap-2">
      {/* PHON 잔액 */}
      <Link
        to="/wallet"
        className="hidden sm:flex items-center gap-2 h-9 px-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm"
      >
        <Wallet className="w-4 h-4 text-[#E8B923]" />
        <span className="font-mono text-white tabular-nums">
          {Math.floor(phon).toLocaleString()}
        </span>
        <span className="text-xs text-white/60">PHON</span>
      </Link>

      {/* 모바일 잔액 버튼 */}
      <Link
        to="/wallet"
        className="sm:hidden flex items-center gap-1.5 h-9 px-3 rounded-2xl bg-white/5 text-sm font-medium"
      >
        <Wallet className="w-4 h-4 text-[#E8B923]" />
        <span className="font-mono text-white tabular-nums text-sm">
          {Math.floor(phon).toLocaleString()}
        </span>
      </Link>

      {/* 알림 */}
      <Link
        to="/profile?tab=notifications"
        className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        aria-label="알림"
      >
        <Bell className="w-4 h-4 text-white/80" />
      </Link>

      {/* 설정 드롭다운 (아바타 제거) */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-9 items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm hover:bg-white/10 transition-colors">
          <span className="font-medium text-white/90">메뉴</span>
          <ChevronDown className="w-4 h-4 text-white/60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs text-white/60 truncate">
            {email ?? "내 계정"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile">프로필</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/wallet">지갑</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/security/overview">보안 설정</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onSignOut}
            className="text-red-400 focus:text-red-400"
          >
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
