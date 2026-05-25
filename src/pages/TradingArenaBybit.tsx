// src/pages/TradingArenaBybit.tsx
import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { Gem, Flame, Wallet as WalletIcon} from "lucide-react";

// ==================== 최소 수정 ====================
const Layout = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const HubTabs = (props: any) => <div className="h-12 bg-white/5 flex items-center px-5">Trading Hub</div>;

const useRequireAuth = () => ({ id: "current-user" });

// useWallet stub - 인자 받을 수 있게 수정
const useWallet = (userId?: string) => ({ 
  wallet: { available_balance: 50000 } 
});

const notify = {
  success: (title: string) => console.log("[SUCCESS]", title),
  error: (title: string) => console.error("[ERROR]", title),
  info: (title: string) => console.log("[INFO]", title),
  warning: (title: string) => console.warn("[WARN]", title),
  loading: (title: string) => ({ id: Date.now() }),
};

const priceStore = { 
  subscribe: () => () => {}, 
  getSnapshot: () => ({ BTCUSDT: 65000, ETHUSDT: 3400 }) 
};

function usePriceStore() {
  return priceStore.getSnapshot();
}

const useRealStore = () => ({ positions: [], history: [], load: () => {}, open: () => ({}), close: () => ({}), liquidate: () => ({}), subscribe: () => () => {}, comboWins: 0 });
const usePaperStore = () => ({ positions: [], history: [], paperCredit: 50000, open: () => ({}), close: () => ({}), tick: () => [], comboWins: 0 });

// Stub Components
const DopamineLayer = (props: any) => null;
const ComboStreakHUD = (props: any) => null;
const BigPnLHeader = (props: any) => null;
const PhonAdvantageRibbon = (props: any) => null;
const HotCoinRail = (props: any) => null;
const LeveragePresetRail = (props: any) => null;
const MobileOrderSheet = ({ children }: any) => <>{children}</>;
const PhonBettingNudge = (props: any) => null;
const VipTradingRoom = (props: any) => null;
const PhonOrderPanel = (props: any) => null;
const PhonLiveSocialProof = (props: any) => null;
const PhonPositionsList = (props: any) => null;
const ImperialTradeFomoBar = (props: any) => null;
const CurrencyExchangeButton = (props: any) => null;

const ChartWithHeader = (props: any) => (
  <div className="h-96 bg-white/5 rounded-2xl flex items-center justify-center text-white/60">📊 Chart Area</div>
);

const MegaOrderPanel = (props: any) => (
  <div className="p-8 bg-white/5 rounded-2xl text-center">주문 패널 (준비중)</div>
);

const OpenPositionsLive = (props: any) => <div className="p-6 bg-white/5 rounded-2xl">Open Positions</div>;
const TradingHistoryGold = (props: any) => <div className="p-6 bg-white/5 rounded-2xl">Trading History</div>;
const RedDisclaimerBanner = (props: any) => null;

const ModeToggle = ({ mode, onChange }: any) => (
  <div className="flex gap-3 mb-6">
    <button onClick={() => onChange("paper")} className={`px-6 py-3 rounded-2xl ${mode === "paper" ? "bg-fuchsia-600 text-white" : "bg-white/10"}`}>Paper</button>
    <button onClick={() => onChange("real")} className={`px-6 py-3 rounded-2xl ${mode === "real" ? "bg-fuchsia-600 text-white" : "bg-white/10"}`}>Real</button>
  </div>
);

function adaptPaperToLive(positions: any) { return positions || []; }
function adaptPaperHistory(history: any) { return history || []; }

export default function TradingArenaBybit() {
  const user = useRequireAuth();
  const { wallet } = useWallet(user?.id);   // ← 이제 인자 받음
  const [mode, setMode] = useState<"paper" | "real">("paper");
  const [symbol, setSymbol] = useState<string>("BTCUSDT");
  const [busy, setBusy] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const prices = usePriceStore();
  const price = (prices as any)[symbol] ?? 0;

  const realAvailable = wallet?.available_balance ?? 0;
  const balance = mode === "paper" ? 50000 : realAvailable;

  const handleSubmit = useCallback(async () => {
    console.log("주문 제출됨");
  }, []);

  if (!user) return null;

  return (
    <Layout>
      <HubTabs hub="earn" />
      <div className="container pt-3 animate-fade-in space-y-6">
        <header>
          <h1 className="text-3xl font-black">황제의 실전 트레이딩 홀</h1>
        </header>

        <ModeToggle mode={mode} onChange={setMode} />

        <ChartWithHeader symbol={symbol} price={price} />

        <MegaOrderPanel 
          mode={mode} 
          symbol={symbol} 
          price={price} 
          balance={balance} 
          onSubmit={handleSubmit} 
          busy={busy} 
        />

        <OpenPositionsLive />

        <TradingHistoryGold />
      </div>
    </Layout>
  );
}