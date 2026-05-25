// src/pages/Wallet.tsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, Clock, Coins, Banknote, Copy, ShieldCheck } from "lucide-react";

// ==================== 최소 import 수정 ====================
const Layout = ({ children }: any) => <>{children}</>;
const HubTabs = (props: any) => <div className="h-12 bg-white/5 flex items-center px-5">Wallet Hub</div>;

const useDB = () => ({
  balance: 1234567,
  transactions: [],
  loading: false,
  user: { tier: 1, withdrawPw: "123456", balance: 1234567, coinBalance: 5000 }
});

const formatKRW = (num: number) => num.toLocaleString() + "원";
const uid = () => "temp-uid-" + Date.now();
const gen6 = () => Math.floor(100000 + Math.random() * 900000).toString();
const WITHDRAW_LIMITS = { 1: 5000000, 2: 10000000, 3: -1 }; // -1 = unlimited

const useRequireAuth = () => ({ id: "current-user" });
const supabase = { rpc: async () => ({ data: {}, error: null }) };
const refreshWallet = async () => console.log("Wallet refreshed");

// Lazy Components Stub
const ServerTxList = () => <div className="p-6 bg-white/5 rounded-2xl">Server Transaction List</div>;
const WithdrawalHistoryList = () => <div className="p-6 bg-white/5 rounded-2xl">Withdrawal History</div>;
const DepositHistoryList = () => <div className="p-6 bg-white/5 rounded-2xl">Deposit History</div>;
const NotificationPreferencesPanel = () => <div className="p-6 bg-white/5 rounded-2xl">Notification Settings</div>;
const RiskLimitsPanel = () => <div className="p-6 bg-white/5 rounded-2xl">Risk Limits</div>;
const InsuranceFundDashboard = () => <div className="p-6 bg-white/5 rounded-2xl">Insurance Fund</div>;
const WithdrawIntentInterceptor = ({ children }: any) => <>{children}</>;
const AMLGate = (props: any) => null;
const WithdrawQueueStatus = () => null;
const WithdrawSimpleStatus = () => null;
const WithdrawReceiptUpload = (props: any) => null;
const DepositReceiptUpload = (props: any) => null;
const WithdrawETABadge = (props: any) => null;
const MultiCurrencyBalance = (props: any) => null;
const Disclaimer = (props: any) => null;
const StepUpGate = (props: any) => null;
const useStepUp = () => ({ requireStepUp: async () => true, dialogProps: {} });
const AdultOnlyBanner = () => null;
const BankAppDeeplinks = (props: any) => null;
const AmountPresetChips = (props: any) => null;
const PhonSpendPanel = () => null;
const PhonFeeDiscountToggle = (props: any) => null;
const WalletTopSection = () => null;

const toast = { success: console.log, error: console.error, info: console.log };

export default function Wallet() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { t: tw } = useTranslation();
  const db = useDB();
  const user = useRequireAuth() ?? db.user;

  const [tab, setTab] = useState(searchParams.get("tab") || "balance");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  return (
    <Layout>
      <HubTabs />
      <div className="min-h-screen bg-[#02030a] text-white p-5">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-black mb-8">지갑</h1>

          {/* Balance */}
          <div className="bg-gradient-to-br from-fuchsia-500/10 to-white/5 border border-white/10 rounded-3xl p-8 mb-8">
            <div className="text-white/60 text-sm">현재 잔액</div>
            <div className="text-5xl font-black mt-3 tabular-nums">
              {formatKRW(db.balance)}
            </div>
            <div className="text-fuchsia-400 text-xl">PHON</div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button 
              onClick={() => setTab("balance")}
              className={`flex-1 py-3 rounded-2xl font-medium ${tab === "balance" ? "bg-white text-black" : "bg-white/10"}`}
            >
              잔액
            </button>
            <button 
              onClick={() => setTab("deposit")}
              className={`flex-1 py-3 rounded-2xl font-medium ${tab === "deposit" ? "bg-white text-black" : "bg-white/10"}`}
            >
              입금
            </button>
            <button 
              onClick={() => setTab("withdraw")}
              className={`flex-1 py-3 rounded-2xl font-medium ${tab === "withdraw" ? "bg-white text-black" : "bg-white/10"}`}
            >
              출금
            </button>
          </div>

          {/* Content */}
          <div className="bg-white/5 rounded-3xl p-6">
            {tab === "balance" && (
              <div className="text-center py-12">
                <p className="text-white/70">잔액 및 거래 내역</p>
                <p className="text-sm text-white/50 mt-4">현재 {formatKRW(db.balance)} PHON</p>
              </div>
            )}

            {tab === "deposit" && (
              <div className="text-center py-12">
                <p className="text-white/70">입금 기능 준비중입니다</p>
              </div>
            )}

            {tab === "withdraw" && (
              <div className="text-center py-12">
                <p className="text-white/70">출금 기능 준비중입니다</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}