import { useCallback, useEffect, useMemo, useState } from "react";
import { useSyncExternalStore } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Trophy,
  Wallet as WalletIcon,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import ChartWithHeader from "@/components/trading/ChartWithHeader";
import MegaOrderPanel from "@/components/trading/MegaOrderPanel";
import OpenPositionsLive from "@/components/trading/OpenPositionsLive";
import TradingHistoryGold from "@/components/trading/TradingHistoryGold";
import DopamineLayer from "@/components/trading/DopamineLayer";
import PhonLiveSocialProof from "@/components/trading/v3/PhonLiveSocialProof";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/hooks/use-wallet";
import { notify } from "@/lib/notify";
import { priceStore } from "@/lib/trading/priceStore";
import { useRealStore } from "@/lib/trading/real-store";
import { usePaperStore } from "@/lib/paper-trading/store";
import { computePnl, computeRoi } from "@/lib/paper-trading/engine";
import { PlatformShell } from "@/shared/ui/platform-shell";
import type { TickerStat } from "@/lib/paper-trading/bybit-feed";
import type { Mode } from "@/lib/trading/types";

const EMPTY_STAT: TickerStat = {
  last: 0,
  change24hPct: 0,
  volume24h: 0,
  turnover24h: 0,
  high24h: 0,
  low24h: 0,
  fundingRate: 0,
  nextFundingTime: 0,
};

function formatCompact(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(abs / 1_000).toFixed(1)}K`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatLocked(value: number) {
  return `₩${Math.floor(value).toLocaleString()}`;
}

function statusTone(status: string) {
  return status === "open" ? "text-emerald-300" : "text-amber-200";
}

function MarketStatCard({
  label,
  value,
  sub,
  positive = true,
}: {
  label: string;
  value: string;
  sub: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/4 px-4 py-3 backdrop-blur-xl">
      <p className="text-[10px] uppercase tracking-[0.26em] text-muted-foreground/80">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
      <p
        className={`mt-1 text-[11px] ${positive ? "text-emerald-200/85" : "text-rose-200/85"}`}
      >
        {sub}
      </p>
    </div>
  );
}

function heroBadgeCopy(mode: Mode) {
  return mode === "real"
    ? {
        title: "REAL MODE",
        description: "KRW 기준 실전 계정",
        accent: "text-amber-200 border-amber-400/40 bg-amber-500/10",
      }
    : {
        title: "PAPER MODE",
        description: "USDT 기준 시뮬레이션",
        accent: "text-cyan-200 border-cyan-400/40 bg-cyan-500/10",
      };
}

function PaperPositionCard({
  position,
  mark,
}: {
  position: ReturnType<typeof usePaperStore.getState>["positions"][number];
  mark: number;
}) {
  const pnl = computePnl(position, mark);
  const roi = computeRoi(position, mark);
  const positive = pnl >= 0;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/4 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {position.symbol}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${position.side === "long" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}
            >
              {position.side.toUpperCase()}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {position.leverage}×
            </span>
          </div>
        </div>
        <div className="text-right">
          <div
            className={`text-sm font-black ${positive ? "text-emerald-300" : "text-rose-300"}`}
          >
            {positive ? "+" : ""}
            {pnl.toFixed(2)} USDT
          </div>
          <div className="text-[11px] text-muted-foreground">
            ROI {formatSigned(roi * 100)}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
        <div className="rounded-xl bg-black/20 px-3 py-2">
          진입{" "}
          <span className="font-mono text-white">
            {position.entry.toFixed(2)}
          </span>
        </div>
        <div className="rounded-xl bg-black/20 px-3 py-2">
          현재 <span className="font-mono text-white">{mark.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function PaperHistoryCard({
  position,
}: {
  position: ReturnType<typeof usePaperStore.getState>["history"][number];
}) {
  const positive = position.closed.pnl >= 0;
  return (
    <div className="rounded-3xl border border-white/10 bg-white/4 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-black text-white">{position.symbol}</div>
          <div className="text-[11px] text-muted-foreground">
            {new Date(position.closed.at).toLocaleString()}
          </div>
        </div>
        <div
          className={`text-right font-black ${positive ? "text-emerald-300" : "text-rose-300"}`}
        >
          {positive ? "+" : ""}
          {position.closed.pnl.toFixed(2)} USDT
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        <span className="rounded-full bg-black/20 px-2 py-1">
          {position.side.toUpperCase()} {position.leverage}×
        </span>
        <span className="rounded-full bg-black/20 px-2 py-1">
          exit {position.closed.price.toFixed(2)}
        </span>
        <span className="rounded-full bg-black/20 px-2 py-1">
          {position.closed.reason}
        </span>
      </div>
    </div>
  );
}

export default function TradingArenaBybit() {
  const { user } = useAuth();
  const { wallet, loading: walletLoading } = useWallet(user?.id);
  const realStore = useRealStore();
  const paperStore = usePaperStore((state) => ({
    positions: state.positions,
    history: state.history,
    paperCredit: state.paperCredit,
    comboWins: state.comboWins,
    open: state.open,
    close: state.close,
    resetCredit: state.resetCredit,
  }));
  const [mode, setMode] = useState<Mode>("real");
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [busy, setBusy] = useState(false);

  const liveSnapshot = useSyncExternalStore(
    priceStore.subscribe,
    priceStore.getSnapshot,
    priceStore.getSnapshot,
  );
  const price = liveSnapshot.prices[symbol] ?? 0;
  const stat = liveSnapshot.stats[symbol] ?? EMPTY_STAT;
  const availableBalance = wallet?.available_balance ?? 0;
  const balance = mode === "real" ? availableBalance : paperStore.paperCredit;
  const unit = mode === "real" ? "KRW" : "USDT";
  const modePill = heroBadgeCopy(mode);

  useEffect(() => {
    if (!user?.id) return;
    void realStore.load();
    return realStore.subscribe(user.id);
  }, [realStore, user?.id]);

  useEffect(() => {
    if (mode !== "paper") return;
    const tick = window.setInterval(() => {
      usePaperStore.getState().tick(liveSnapshot.prices);
    }, 3500);
    return () => window.clearInterval(tick);
  }, [liveSnapshot.prices, mode]);

  const handleSubmit = useCallback(
    async (args: {
      side: "long" | "short";
      leverage: number;
      margin: number;
      triggers?: {
        tpPct?: number;
        slPct?: number;
        trailingPct?: number;
        tpPrice?: number;
        slPrice?: number;
        trailingOffset?: number;
      };
      marginMode: "isolated" | "cross";
      allocatedMargin?: number;
    }) => {
      setBusy(true);
      try {
        if (mode === "paper") {
          const opened = paperStore.open({
            symbol,
            side: args.side,
            leverage: args.leverage,
            margin: args.margin,
            entry: price,
            marginMode: args.marginMode,
            allocatedMargin: args.allocatedMargin,
          });

          if (!opened) {
            notify.warning("모의 자금이 부족합니다", {
              description: "보유 현금을 확인한 뒤 다시 시도해 주세요.",
            });
            return;
          }

          notify.success("모의 주문 체결 완료", {
            description: `${symbol} ${args.side.toUpperCase()} ${args.leverage}×`,
          });
          return;
        }

        const result = await realStore.open({
          symbol,
          side: args.side,
          leverage: args.leverage,
          margin: args.margin,
          mark: price,
          tpPct: args.triggers?.tpPct,
          slPct: args.triggers?.slPct,
          trailingPct: args.triggers?.trailingPct,
          marginMode: args.marginMode,
          allocatedMargin: args.allocatedMargin,
          tpPrice: args.triggers?.tpPrice,
          slPrice: args.triggers?.slPrice,
          trailingOffset: args.triggers?.trailingOffset,
        });

        if ("error" in result) {
          notify.error("실전 주문 실패", { description: result.error });
          return;
        }

        notify.success("실전 주문 체결 요청 완료", {
          description: `${symbol} ${args.side.toUpperCase()} ${args.leverage}×`,
        });
      } finally {
        setBusy(false);
      }
    },
    [mode, paperStore, price, realStore, symbol],
  );

  const closeRealPosition = useCallback(
    async (id: string, mark: number) => {
      const result = await realStore.close(id, mark);
      if ("error" in result) {
        notify.error("포지션 청산 실패", { description: result.error });
        return result;
      }

      notify.success("포지션 청산 완료", {
        description: `${result.pnl >= 0 ? "+" : ""}${result.pnl.toLocaleString()}원`,
      });
      if (result.pnl >= 0) {
        notify.info("수익 실현", {
          description: "다음 레이스도 지금부터 시작합니다.",
        });
      }
      return result;
    },
    [realStore],
  );

  const liquidateRealPosition = useCallback(
    async (id: string, mark: number) => {
      const result = await realStore.liquidate(id, mark);
      if ("error" in result) {
        notify.error("강제 청산 실패", { description: result.error });
        return result;
      }

      notify.error("강제 청산", {
        description: "자산 보호 장치가 작동했습니다.",
      });
      return result;
    },
    [realStore],
  );

  const stats = useMemo(
    () => [
      {
        label: "현재가",
        value:
          price > 0
            ? `${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : "—",
        sub: `24h ${formatSigned(stat.change24hPct)}`,
        positive: stat.change24hPct >= 0,
      },
      {
        label: "거래량",
        value: formatCompact(stat.volume24h),
        sub: "실시간 체결량",
        positive: true,
      },
      {
        label: "예치금",
        value:
          mode === "real"
            ? formatLocked(availableBalance)
            : `${balance.toFixed(2)} USDT`,
        sub: walletLoading ? "지갑 동기화 중" : "보유 자산",
        positive: true,
      },
      {
        label: "모드",
        value: mode === "real" ? "REAL" : "PAPER",
        sub:
          mode === "real" ? "베이비트급 실전 전환" : "전략 검증용 시뮬레이션",
        positive: true,
      },
    ],
    [
      availableBalance,
      balance,
      mode,
      price,
      stat.change24hPct,
      stat.volume24h,
      walletLoading,
    ],
  );

  return (
    <PlatformShell innerClassName="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <DopamineLayer />

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-5"
      >
        <section className="rounded-[30px] border border-white/10 bg-white/3 p-5 sm:p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.3em] border-amber-400/40 bg-amber-500/10 text-amber-200">
                <Sparkles className="h-3.5 w-3.5" />
                PHONARA ELITE TRADING
              </div>

              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-sm text-slate-200/80">
                    거래소급 실시간 운영 체계
                  </p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                    바이비트·바이낸스·OKX급 파이프라인을 직접 운영하세요
                  </h1>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-slate-200/80 sm:text-base">
                  실시간 차트, 고도화된 주문 패널, 포지션 관리, 자산 요약,
                  사회적 증거가 하나의 화면에 정렬된 모바일 퍼스트 거래
                  경험입니다.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold ${modePill.accent}`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  {modePill.title}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {liveSnapshot.status === "open" ? "LIVE FEED" : "SYNCING"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-[11px] text-fuchsia-200">
                  <BarChart3 className="h-3.5 w-3.5" />
                  {stat.change24hPct >= 0 ? "강세 흐름" : "약세 흐름"}
                </span>
              </div>
            </div>

            <div className="grid w-full max-w-xl grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
              {stats.map((item) => (
                <MarketStatCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  sub={item.sub}
                  positive={item.positive}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1">
              {(["real", "paper"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`rounded-full px-4 py-2 text-sm font-black transition ${mode === item ? "bg-amber-400 text-black" : "text-muted-foreground hover:text-white"}`}
                >
                  {item === "real" ? "REAL" : "PAPER"}
                </button>
              ))}
            </div>

            {mode === "paper" && (
              <button
                type="button"
                onClick={() => {
                  paperStore.resetCredit();
                  notify.info("모의 계좌 재설정", {
                    description: "전략 검증을 처음부터 다시 시작합니다.",
                  });
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-white"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Paper Reset
              </button>
            )}
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-5">
            <section className="rounded-[28px] border border-white/10 bg-white/3 p-3 sm:p-4 backdrop-blur-xl">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    MARKET BOARD
                  </p>
                  <h2 className="mt-2 text-lg font-black text-white">
                    실시간 차트 · 시장 심리 · 펀딩 동기화
                  </h2>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-slate-200">
                  <span
                    className={`inline-flex h-2.5 w-2.5 rounded-full ${statusTone(liveSnapshot.status)}`}
                  />
                  {liveSnapshot.status === "open" ? "CONNECTED" : "SYNCING"}
                </div>
              </div>
              <div className="mt-3">
                <ChartWithHeader
                  symbol={symbol}
                  setSymbol={setSymbol}
                  price={price}
                  stat={stat}
                />
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-[26px] border border-white/10 bg-white/3 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-sm font-black text-white">
                  <CircleDollarSign className="h-4 w-4 text-amber-300" />
                  시장 스냅샷
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-200/85">
                  <div className="flex items-center justify-between">
                    <span>마켓 상태</span>
                    <span className="font-black text-white">
                      {liveSnapshot.status === "open" ? "정상" : "연결중"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Funding</span>
                    <span className="font-mono text-white">
                      {(stat.fundingRate * 100).toFixed(4)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>24h 범위</span>
                    <span className="font-mono text-white">
                      {stat.low24h.toFixed(2)} ~ {stat.high24h.toFixed(2)}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-[26px] border border-white/10 bg-linear-to-br from-amber-500/10 via-transparent to-fuchsia-500/10 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-sm font-black text-white">
                  <BarChart3 className="h-4 w-4 text-fuchsia-300" />
                  거래소급 운영
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-200/85">
                  <div className="flex items-center justify-between">
                    <span>주문북</span>
                    <span className="font-black text-white">즉시 체결</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>청산 보드</span>
                    <span className="font-black text-white">리스크 관리</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>실시간 히스토리</span>
                    <span className="font-black text-white">자동 집계</span>
                  </div>
                </div>
              </section>
            </div>

            <section className="rounded-[28px] border border-white/10 bg-white/3 p-4 backdrop-blur-xl">
              <PhonLiveSocialProof />
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-[28px] border border-white/10 bg-white/3 p-3 sm:p-4 backdrop-blur-xl">
              <MegaOrderPanel
                mode={mode}
                symbol={symbol}
                setSymbol={setSymbol}
                price={price}
                balance={balance}
                onSubmit={handleSubmit}
                busy={busy}
              />
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/3 p-4 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <WalletIcon className="h-4 w-4 text-emerald-300" />
                계정 요약
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-black/20 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    예치금
                  </div>
                  <div className="mt-2 text-lg font-black text-white">
                    {mode === "real"
                      ? formatLocked(availableBalance)
                      : `${balance.toFixed(2)} USDT`}
                  </div>
                </div>
                <div className="rounded-3xl bg-black/20 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    승률 스택
                  </div>
                  <div className="mt-2 text-lg font-black text-white">
                    {paperStore.comboWins || realStore.comboWins} 승
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-3xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-3">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-emerald-200">
                    <ArrowUpRight className="h-3 w-3" />
                    최우선 실행
                  </div>
                  <p className="mt-2 text-sm font-bold text-white">
                    실제 주문/청산 동기화
                  </p>
                </div>
                <div className="rounded-3xl border border-rose-400/25 bg-rose-500/10 px-3 py-3">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-rose-200">
                    <ArrowDownRight className="h-3 w-3" />
                    리스크 보호
                  </div>
                  <p className="mt-2 text-sm font-bold text-white">
                    Liquidation 및 TP/SL 관리
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_1fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/3 p-4 sm:p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  OPEN POSITIONS
                </p>
                <h2 className="mt-2 text-lg font-black text-white">
                  실시간 포지션 · 청산 관리
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-200">
                <Activity className="h-3.5 w-3.5" />
                {mode === "real" ? "REAL MODE" : "PAPER MODE"}
              </div>
            </div>

            <div className="mt-4">
              {mode === "real" ? (
                <OpenPositionsLive
                  positions={realStore.positions}
                  prices={liveSnapshot.prices}
                  busy={busy}
                  onClose={closeRealPosition}
                  onLiquidate={liquidateRealPosition}
                  onCloseAll={() => {
                    for (const position of realStore.positions) {
                      void closeRealPosition(
                        position.id,
                        liveSnapshot.prices[position.symbol] ?? position.entry,
                      );
                    }
                  }}
                  modeLabel="REAL"
                  unit={unit}
                />
              ) : (
                <div className="space-y-3">
                  {paperStore.positions.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-4 py-8 text-center text-sm text-muted-foreground">
                      모의 포지션이 없습니다. 주문 패널에서 첫 진입을 설정해
                      보세요.
                    </div>
                  ) : (
                    paperStore.positions.map((position) => (
                      <PaperPositionCard
                        key={position.id}
                        position={position}
                        mark={
                          liveSnapshot.prices[position.symbol] ?? position.entry
                        }
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/3 p-4 sm:p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  TRADING HISTORY
                </p>
                <h2 className="mt-2 text-lg font-black text-white">
                  최근 청산 기록
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-[11px] text-fuchsia-200">
                <Trophy className="h-3.5 w-3.5" />
                {mode === "real" ? "REAL PnL" : "PAPER PnL"}
              </div>
            </div>

            <div className="mt-4">
              {mode === "real" ? (
                <TradingHistoryGold history={realStore.history} unit={unit} />
              ) : (
                <div className="space-y-3">
                  {paperStore.history.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-black/15 px-4 py-8 text-center text-sm text-muted-foreground">
                      아직 모의 청산 기록이 없습니다. 시장에서 첫 거래를 종료해
                      보세요.
                    </div>
                  ) : (
                    paperStore.history.map((position) => (
                      <PaperHistoryCard key={position.id} position={position} />
                    ))
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </motion.div>
    </PlatformShell>
  );
}
