import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Wallet as WalletIcon,
} from "lucide-react";
import { PlatformShell } from "@/shared/ui/platform-shell";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/hooks/use-wallet";
import {
  fetchTransactions,
  fetchWithdrawals,
  fmtKRW,
  humanizeError,
} from "@/lib/wallet";
import { notify } from "@/lib/notify";
import { APP_ROUTES } from "@/shared/constants/routes";
import { type CryptoDepositIntent } from "@/lib/phonaraPay";
import {
  createPhaseADepositIntent,
  requestPhaseAWithdrawal,
  submitPhaseADeposit,
  unwrapPhaseAEnvelope,
} from "@/lib/phasea-wallet";
import {
  mapWalletActivities,
  type WalletActivity,
} from "@/lib/wallet-activity";
import {
  validateDepositForm,
  validateWithdrawForm,
} from "@/lib/wallet-form-validation";

type DepositMethod = "coin" | "bank" | "voucher";
type WithdrawMethod = "coin" | "bank";

type PendingRequest = {
  id: string;
  type: "deposit" | "withdraw";
  title: string;
  detail: string;
  status: "pending" | "approved";
  createdAt: string;
};

const BANK_INFO = {
  bankName: "KEB Hana Bank",
  account: "123-456-789012",
  owner: "PHONARA KOREA",
};

const STORAGE_KEY = "phonara-wallet-requests-v1";

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/4 px-4 py-4 backdrop-blur-sm">
      <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
        {label}
      </div>
      <div className="mt-2 text-lg font-black text-white">{value}</div>
      <div className="mt-1 text-[11px] text-emerald-200">{hint}</div>
    </div>
  );
}

function InfoBlock({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/4 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-amber-500/10 p-2 text-amber-200">
          {icon}
        </div>
        <div>
          <div className="font-black text-white">{title}</div>
          <div className="text-sm leading-6 text-white/70">{description}</div>
        </div>
      </div>
    </div>
  );
}

function loadRequests(): PendingRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRequests(items: PendingRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function formatAmountString(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function formatRelativeTime(value: string) {
  const diff = Date.now() - Date.parse(value);
  if (!Number.isFinite(diff)) return "방금";
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.round(hours / 24);
  return `${days}일 전`;
}

function statusTone(status: WalletActivity["status"]) {
  if (status === "completed" || status === "approved")
    return "bg-emerald-500/10 text-emerald-100";
  if (status === "processing" || status === "pending")
    return "bg-amber-500/10 text-amber-100";
  return "bg-rose-500/10 text-rose-100";
}

function getActivitySummary(activity: WalletActivity[]) {
  return activity.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    {
      pending: 0,
      processing: 0,
      approved: 0,
      completed: 0,
      rejected: 0,
      manual: 0,
    } satisfies Record<WalletActivity["status"], number>,
  );
}

function useWalletRequests() {
  const [requests, setRequests] = useState<PendingRequest[]>([]);

  useEffect(() => {
    setRequests(loadRequests());
  }, []);

  const appendRequest = (next: PendingRequest) => {
    setRequests((prev) => {
      const merged = [next, ...prev].slice(0, 6);
      saveRequests(merged);
      return merged;
    });
  };

  return { requests, appendRequest };
}

export default function Wallet() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wallet, loading, reload } = useWallet(user?.id);
  const [tab, setTab] = useState<"summary" | "deposit" | "withdraw">("summary");
  const { requests, appendRequest } = useWalletRequests();
  const [activity, setActivity] = useState<WalletActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  const [depositMethod, setDepositMethod] = useState<DepositMethod>("coin");
  const [depositAmount, setDepositAmount] = useState("50000");
  const [depositSender, setDepositSender] = useState("");
  const [depositMemo, setDepositMemo] = useState("");
  const [giftBrand, setGiftBrand] = useState("culture");
  const [giftPin, setGiftPin] = useState("");
  const [coinNetwork, setCoinNetwork] = useState("TRC20");
  const [coinIntent, setCoinIntent] = useState<CryptoDepositIntent | null>(
    null,
  );
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawMethod>("bank");
  const [withdrawAmount, setWithdrawAmount] = useState("50000");
  const [withdrawPin, setWithdrawPin] = useState("");
  const [bankName, setBankName] = useState(BANK_INFO.bankName);
  const [bankAccount, setBankAccount] = useState(BANK_INFO.account);
  const [coinAddress, setCoinAddress] = useState("");
  const [coinNetworkWithdraw, setCoinNetworkWithdraw] = useState("TRC20");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [depositFeedback, setDepositFeedback] = useState<string | null>(null);
  const [withdrawFeedback, setWithdrawFeedback] = useState<string | null>(null);

  const walletData = useMemo(
    () => ({
      total_balance: wallet?.total_balance ?? 0,
      available_balance: wallet?.available_balance ?? 0,
      pending_balance: wallet?.pending_balance ?? 0,
      locked_balance: wallet?.locked_balance ?? 0,
      profit_share_balance: wallet?.profit_share_balance ?? 0,
      today_earned: wallet?.today_earned ?? 0,
      monthly_earned: wallet?.monthly_earned ?? 0,
      last_reset_date: wallet?.last_reset_date ?? "",
    }),
    [wallet],
  );

  const activitySummary = useMemo(
    () => getActivitySummary(activity),
    [activity],
  );

  useEffect(() => {
    setCoinIntent(null);
    setDepositFeedback(null);
  }, [
    depositMethod,
    depositAmount,
    coinNetwork,
    depositSender,
    depositMemo,
    giftBrand,
    giftPin,
  ]);

  useEffect(() => {
    setWithdrawFeedback(null);
  }, [
    withdrawMethod,
    withdrawAmount,
    withdrawPin,
    bankName,
    bankAccount,
    coinAddress,
    coinNetworkWithdraw,
  ]);

  const loadActivity = useCallback(async (userId: string) => {
    setActivityLoading(true);
    setActivityError(null);

    try {
      const [transactions, withdrawals] = await Promise.all([
        fetchTransactions(userId, 6),
        fetchWithdrawals(userId),
      ]);

      setActivity(mapWalletActivities(transactions, withdrawals).slice(0, 6));
    } catch {
      setActivityError("최근 활동을 불러오지 못했습니다.");
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const refreshWalletState = useCallback(async () => {
    if (!user?.id) return;

    setIsRefreshing(true);
    try {
      await reload();
      await loadActivity(user.id);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadActivity, reload, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setActivity([]);
      return;
    }

    void loadActivity(user.id);
  }, [loadActivity, user?.id]);

  const handleCopyId = async () => {
    if (!user?.id) return;

    try {
      await navigator.clipboard.writeText(user.id);
      notify.success("유저 ID 복사 완료", {
        description: "입금/검증 안내에 바로 붙여넣기할 수 있어요.",
      });
    } catch {
      notify.error("복사 실패");
    }
  };

  const addPendingRequest = (
    type: PendingRequest["type"],
    title: string,
    detail: string,
  ) => {
    appendRequest({
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      detail,
      status: "pending",
      createdAt: new Date().toLocaleString("ko-KR"),
    });
  };

  const handleCoinDeposit = async () => {
    if (!user?.id) {
      notify.error("로그인이 필요합니다");
      return;
    }

    const validation = validateDepositForm({
      method: "coin",
      amount: depositAmount,
      network: coinNetwork,
      sender: depositSender,
      memo: depositMemo,
      voucherPin: giftPin,
      giftBrand,
    });

    if (!validation.ok) {
      setDepositFeedback(validation.message);
      notify.warning(validation.message);
      return;
    }

    setDepositFeedback(null);

    const amount = formatAmountString(depositAmount);

    setIsProcessing(true);
    try {
      const intentEnvelope = await createPhaseADepositIntent(
        amount,
        coinNetwork,
      );
      const intent = unwrapPhaseAEnvelope(intentEnvelope);
      setCoinIntent(intent);
      addPendingRequest(
        "deposit",
        "코인 입금 인텐트 생성",
        `${intent.unique_amount.toLocaleString()} USDT · ${intent.receive_address}`,
      );
      notify.success("코인 입금 안내 생성 완료", {
        description: `${intent.unique_amount.toLocaleString()} USDT를 ${intent.receive_address}로 송금하면 자동 매칭됩니다.`,
      });
      await reload();
      await loadActivity(user.id);
    } catch (error) {
      notify.fail("코인 입금 요청 실패", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBankDeposit = async () => {
    if (!user?.id) {
      notify.error("로그인이 필요합니다");
      return;
    }

    const validation = validateDepositForm({
      method: "bank",
      amount: depositAmount,
      network: coinNetwork,
      sender: depositSender,
      memo: depositMemo,
      voucherPin: giftPin,
      giftBrand,
    });

    if (!validation.ok) {
      setDepositFeedback(validation.message);
      notify.warning(validation.message);
      return;
    }

    setDepositFeedback(null);

    const amount = formatAmountString(depositAmount);

    setIsProcessing(true);
    try {
      const memo = [
        depositSender || user.id,
        depositMemo || `KRW transfer ${amount}`,
      ]
        .filter(Boolean)
        .join(" · ");
      const resultEnvelope = await submitPhaseADeposit({
        amount,
        method: "bank",
        memo,
        receiptUrl: null,
        packageId: null,
        packageName: null,
      });
      const result = unwrapPhaseAEnvelope(resultEnvelope);
      addPendingRequest(
        "deposit",
        "은행 입금 요청 접수",
        `${amount.toLocaleString()}원 · ${memo}`,
      );
      notify.success("은행 입금 요청이 접수되었습니다", {
        description: result.ok
          ? `요청 ID ${result.id}`
          : "관리자 확인 후 자동으로 반영됩니다.",
      });
      await reload();
      await loadActivity(user.id);
    } catch (error) {
      notify.fail("은행 입금 요청 실패", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoucherDeposit = async () => {
    if (!user?.id) {
      notify.error("로그인이 필요합니다");
      return;
    }

    const validation = validateDepositForm({
      method: "voucher",
      amount: depositAmount,
      network: coinNetwork,
      sender: depositSender,
      memo: depositMemo,
      voucherPin: giftPin,
      giftBrand,
    });

    if (!validation.ok) {
      setDepositFeedback(validation.message);
      notify.warning(validation.message);
      return;
    }

    setDepositFeedback(null);

    const amount = formatAmountString(depositAmount);

    setIsProcessing(true);
    try {
      const resultEnvelope = await submitPhaseADeposit({
        amount,
        method: "voucher",
        memo: `${giftBrand} voucher manual`,
        voucherBrand: giftBrand as "culture" | "happy" | "cultureland",
        voucherPin: giftPin,
        receiptUrl: null,
        packageId: null,
        packageName: null,
      });
      const result = unwrapPhaseAEnvelope(resultEnvelope);
      addPendingRequest(
        "deposit",
        "상품권 입금 요청 접수",
        `${amount.toLocaleString()}원 · ${giftBrand}`,
      );
      notify.success("상품권 입금 요청이 접수되었습니다", {
        description: result.ok
          ? `요청 ID ${result.id}`
          : "수동 검토 후 반영됩니다.",
      });
      await reload();
      await loadActivity(user.id);
    } catch (error) {
      notify.fail("상품권 입금 요청 실패", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user?.id) {
      notify.error("로그인이 필요합니다");
      return;
    }

    const validation = validateWithdrawForm({
      method: withdrawMethod,
      amount: withdrawAmount,
      pin: withdrawPin,
      bankName,
      bankAccount,
      coinAddress,
      network: coinNetworkWithdraw,
      availableBalance: walletData.available_balance,
    });

    if (!validation.ok) {
      setWithdrawFeedback(validation.message);
      notify.warning(validation.message);
      return;
    }

    setWithdrawFeedback(null);

    const amount = formatAmountString(withdrawAmount);

    setIsProcessing(true);
    try {
      if (withdrawMethod === "bank") {
        const resultEnvelope = await requestPhaseAWithdrawal({
          amount,
          method: "bank",
          bankName,
          bankAccount,
          pin: withdrawPin,
        });
        const result = unwrapPhaseAEnvelope(resultEnvelope);
        addPendingRequest(
          "withdraw",
          "은행 출금 요청 접수",
          `${amount.toLocaleString()}원 · ${bankName}`,
        );
        notify.success("은행 출금 요청 접수 완료", {
          description: `거래코드 ${result.tx_code} · ${result.process_by}`,
        });
      } else {
        const resultEnvelope = await requestPhaseAWithdrawal({
          amount,
          method: "coin",
          coinAddress,
          coinNetwork: coinNetworkWithdraw,
          pin: withdrawPin,
        });
        const result = unwrapPhaseAEnvelope(resultEnvelope);
        addPendingRequest(
          "withdraw",
          "코인 출금 요청 접수",
          `${amount.toLocaleString()}원 · ${coinNetworkWithdraw}`,
        );
        notify.success("코인 출금 요청 접수 완료", {
          description: `거래코드 ${result.tx_code} · ${result.process_by}`,
        });
      }

      await reload();
      await loadActivity(user.id);
    } catch (error) {
      notify.fail("출금 요청 실패", error);
      if (error) {
        notify.error(humanizeError(error));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyCoinAddress = async () => {
    if (!coinIntent?.receive_address) return;

    try {
      await navigator.clipboard.writeText(coinIntent.receive_address);
      notify.success("주소 복사 완료", {
        description: "코인 입금 주소를 바로 붙여넣기할 수 있습니다.",
      });
    } catch {
      notify.error("주소 복사 실패");
    }
  };

  const resetDepositForm = () => {
    setDepositAmount("50000");
    setDepositSender("");
    setDepositMemo("");
    setGiftBrand("culture");
    setGiftPin("");
    setCoinIntent(null);
    setDepositFeedback(null);
  };

  const resetWithdrawForm = () => {
    setWithdrawAmount("50000");
    setWithdrawPin("");
    setBankName(BANK_INFO.bankName);
    setBankAccount(BANK_INFO.account);
    setCoinAddress("");
    setWithdrawFeedback(null);
  };

  return (
    <PlatformShell>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-5 pb-4"
      >
        <section className="rounded-[30px] border border-white/10 bg-white/4 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-amber-100">
                <Sparkles className="h-3.5 w-3.5" />
                PHONARA WALLET
              </div>
              <h1 className="mt-3 text-[2.25rem] font-black tracking-[-0.06em] text-white sm:text-[2.8rem]">
                입금·출금 흐름을
                <span className="block bg-linear-to-r from-amber-100 via-fuchsia-100 to-cyan-100 bg-clip-text text-transparent">
                  거래소급으로 정리합니다.
                </span>
              </h1>
              <p className="mt-3 text-sm leading-7 text-white/75 sm:text-base">
                코인 인텐트, 원화 계좌이체, 상품권 수동 등록과 코인/한국 계좌
                출금을 하나의 화면에서 관리할 수 있습니다.
              </p>
            </div>

            <div className="w-full max-w-md rounded-[26px] border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                    총 잔액
                  </div>
                  <div className="mt-2 text-3xl font-black text-white">
                    {loading ? "—" : fmtKRW(walletData.total_balance)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void refreshWalletState()}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-white disabled:opacity-60"
                >
                  <RefreshCcw
                    className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  {isRefreshing ? "syncing" : "refresh"}
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-[22px] bg-white/4 px-3 py-2 text-sm">
                <span className="text-white/70">유저 ID</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-2 text-white"
                >
                  <Copy className="h-3.5 w-3.5" />
                  copy
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-[22px] border border-emerald-300/30 bg-emerald-500/10 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-emerald-100">
                    실시간 처리
                  </div>
                  <div className="mt-2 text-sm font-black text-white">
                    자동 매칭 / 관리자 검토
                  </div>
                </div>
                <div className="rounded-[22px] border border-fuchsia-300/30 bg-fuchsia-500/10 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-fuchsia-100">
                    보안
                  </div>
                  <div className="mt-2 text-sm font-black text-white">
                    PIN + 계좌 검증
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[22px] border border-white/10 bg-white/4 px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                  현재 상태
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-100">
                    대기{" "}
                    {requests.length +
                      activitySummary.pending +
                      activitySummary.processing}
                    건
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-100">
                    완료 {activitySummary.completed + activitySummary.approved}
                    건
                  </span>
                  <span className="rounded-full bg-white/5 px-2 py-1 text-white/80">
                    최근: {activity[0]?.title ?? "내역 없음"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(["summary", "deposit", "withdraw"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  tab === item
                    ? "bg-amber-400 text-black"
                    : "bg-white/5 text-white"
                }`}
              >
                {item === "summary"
                  ? "요약"
                  : item === "deposit"
                    ? "입금 안내"
                    : "출금 안내"}
              </button>
            ))}
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[30px] border border-white/10 bg-white/4 p-5 backdrop-blur-xl sm:p-6">
            {tab === "summary" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white font-black">
                  <WalletIcon className="h-4 w-4 text-emerald-200" />
                  자금 구성
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SummaryCard
                    label="가용 잔액"
                    value={fmtKRW(walletData.available_balance)}
                    hint="즉시 사용 가능"
                  />
                  <SummaryCard
                    label="잠김 금액"
                    value={fmtKRW(walletData.locked_balance)}
                    hint="거래/청산 보전"
                  />
                  <SummaryCard
                    label="대기 중"
                    value={fmtKRW(walletData.pending_balance)}
                    hint="입출금 대기"
                  />
                  <SummaryCard
                    label="수익 분배"
                    value={fmtKRW(walletData.profit_share_balance)}
                    hint="리워드 누적"
                  />
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
                  <div className="flex items-center justify-between">
                    <span>오늘 수익</span>
                    <span className="font-black text-white">
                      {fmtKRW(walletData.today_earned)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>이번 달</span>
                    <span className="font-black text-white">
                      {fmtKRW(walletData.monthly_earned)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>마지막 리셋</span>
                    <span className="font-black text-white">
                      {walletData.last_reset_date || "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {tab === "deposit" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white font-black">
                  <ArrowDownToLine className="h-4 w-4 text-emerald-200" />
                  입금 워크플로우
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  {(
                    [
                      { key: "coin", label: "코인", hint: "자동 매칭" },
                      {
                        key: "bank",
                        label: "원화 이체",
                        hint: "계좌 수동 확인",
                      },
                      { key: "voucher", label: "상품권", hint: "수동 검토" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setDepositMethod(item.key)}
                      className={`rounded-[22px] border px-4 py-3 text-left transition ${
                        depositMethod === item.key
                          ? "border-amber-300/60 bg-amber-500/10 text-white"
                          : "border-white/10 bg-white/5 text-white/75"
                      }`}
                    >
                      <div className="text-sm font-black">{item.label}</div>
                      <div className="mt-1 text-[11px] text-white/70">
                        {item.hint}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm text-white/80">
                      금액
                      <input
                        type="number"
                        inputMode="numeric"
                        min={10000}
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                      />
                    </label>
                    {depositMethod === "coin" && (
                      <label className="text-sm text-white/80">
                        네트워크
                        <select
                          value={coinNetwork}
                          onChange={(e) => setCoinNetwork(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                        >
                          <option value="TRC20">TRC20</option>
                          <option value="ERC20">ERC20</option>
                          <option value="BEP20">BEP20</option>
                        </select>
                      </label>
                    )}
                    {depositMethod === "bank" && (
                      <label className="text-sm text-white/80">
                        보내는 분 이름
                        <input
                          value={depositSender}
                          onChange={(e) => setDepositSender(e.target.value)}
                          placeholder="예: 홍길동"
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                        />
                      </label>
                    )}
                    {depositMethod === "voucher" && (
                      <label className="text-sm text-white/80">
                        상품권 종류
                        <select
                          value={giftBrand}
                          onChange={(e) => setGiftBrand(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                        >
                          <option value="culture">문화상품권</option>
                          <option value="happy">해피머니</option>
                          <option value="cultureland">컬쳐랜드</option>
                        </select>
                      </label>
                    )}
                  </div>

                  {depositMethod === "bank" && (
                    <label className="mt-3 block text-sm text-white/80">
                      입금 메모
                      <input
                        value={depositMemo}
                        onChange={(e) => setDepositMemo(e.target.value)}
                        placeholder="예: 실전 자금 충전"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                      />
                    </label>
                  )}

                  {depositMethod === "voucher" && (
                    <label className="mt-3 block text-sm text-white/80">
                      상품권 PIN
                      <input
                        value={giftPin}
                        onChange={(e) => setGiftPin(e.target.value)}
                        placeholder="16~18자리 숫자"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                      />
                    </label>
                  )}

                  {depositFeedback && (
                    <div className="mt-3 rounded-2xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-50">
                      {depositFeedback}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        if (depositMethod === "coin") void handleCoinDeposit();
                        if (depositMethod === "bank") void handleBankDeposit();
                        if (depositMethod === "voucher")
                          void handleVoucherDeposit();
                      }}
                      className="rounded-[20px] bg-emerald-400 px-4 py-2 text-sm font-black text-black"
                    >
                      {isProcessing ? "처리 중..." : "입금 요청 생성"}
                    </button>
                    <button
                      type="button"
                      onClick={resetDepositForm}
                      className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white"
                    >
                      입력 초기화
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab("withdraw")}
                      className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white"
                    >
                      출금으로 바로가기
                    </button>
                  </div>
                </div>

                {coinIntent && (
                  <div className="rounded-[26px] border border-emerald-300/40 bg-emerald-500/10 p-4 text-sm text-emerald-50">
                    <div className="font-black">코인 입금 안내</div>
                    <div className="mt-2 break-all">
                      주소: {coinIntent.receive_address}
                    </div>
                    <div className="mt-1">
                      요청 금액: {coinIntent.unique_amount.toLocaleString()}{" "}
                      USDT
                    </div>
                    <div className="mt-1">
                      만료:{" "}
                      {new Date(coinIntent.expires_at).toLocaleString("ko-KR")}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleCopyCoinAddress()}
                      className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-white/10 px-3 py-1.5 text-[11px] font-black text-emerald-50"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      주소 복사
                    </button>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-3">
                  <InfoBlock
                    title="코인 입금"
                    description="서버가 생성한 코인 인텐트를 기준으로 자동 매칭되며, 30분 내 정확 금액 송금이 필요합니다."
                    icon={<ShieldCheck className="h-4 w-4" />}
                  />
                  <InfoBlock
                    title="원화 이체"
                    description="은행 계좌 정보와 입금 메모를 함께 작성하면 관리자 확인 라인이 빠르게 이어집니다."
                    icon={<ArrowDownToLine className="h-4 w-4" />}
                  />
                  <InfoBlock
                    title="상품권"
                    description="PIN을 입력하면 수동 검토 대상으로 등록되고, 승인 이후 즉시 자금이 연결됩니다."
                    icon={<Sparkles className="h-4 w-4" />}
                  />
                </div>
              </div>
            )}

            {tab === "withdraw" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white font-black">
                  <ArrowUpFromLine className="h-4 w-4 text-amber-200" />
                  출금 워크플로우
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {(
                    [
                      {
                        key: "bank",
                        label: "한국 계좌 출금",
                        hint: "은행/계좌 입력",
                      },
                      {
                        key: "coin",
                        label: "코인 출금",
                        hint: "주소/네트워크 입력",
                      },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setWithdrawMethod(item.key)}
                      className={`rounded-[22px] border px-4 py-3 text-left transition ${
                        withdrawMethod === item.key
                          ? "border-fuchsia-300/60 bg-fuchsia-500/10 text-white"
                          : "border-white/10 bg-white/5 text-white/75"
                      }`}
                    >
                      <div className="text-sm font-black">{item.label}</div>
                      <div className="mt-1 text-[11px] text-white/70">
                        {item.hint}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="rounded-[26px] border border-white/10 bg-black/20 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm text-white/80">
                      출금 금액
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1000}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                      />
                    </label>
                    <label className="text-sm text-white/80">
                      출금 PIN
                      <input
                        value={withdrawPin}
                        onChange={(e) => setWithdrawPin(e.target.value)}
                        placeholder="6자리"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                      />
                    </label>
                  </div>

                  {withdrawMethod === "bank" && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-sm text-white/80">
                        은행명
                        <input
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                        />
                      </label>
                      <label className="text-sm text-white/80">
                        계좌번호
                        <input
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                        />
                      </label>
                    </div>
                  )}

                  {withdrawMethod === "coin" && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-sm text-white/80">
                        코인 주소
                        <input
                          value={coinAddress}
                          onChange={(e) => setCoinAddress(e.target.value)}
                          placeholder="TRC20 주소"
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                        />
                      </label>
                      <label className="text-sm text-white/80">
                        네트워크
                        <select
                          value={coinNetworkWithdraw}
                          onChange={(e) =>
                            setCoinNetworkWithdraw(e.target.value)
                          }
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                        >
                          <option value="TRC20">TRC20</option>
                          <option value="ERC20">ERC20</option>
                          <option value="BEP20">BEP20</option>
                        </select>
                      </label>
                    </div>
                  )}

                  {withdrawFeedback && (
                    <div className="mt-3 rounded-2xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-50">
                      {withdrawFeedback}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => void handleWithdraw()}
                      className="rounded-[20px] bg-amber-400 px-4 py-2 text-sm font-black text-black"
                    >
                      {isProcessing ? "처리 중..." : "출금 요청"}
                    </button>
                    <button
                      type="button"
                      onClick={resetWithdrawForm}
                      className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white"
                    >
                      입력 초기화
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab("deposit")}
                      className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white"
                    >
                      입금으로 돌아가기
                    </button>
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-black/20 p-4 text-sm text-white/80">
                  <div className="font-black text-white">실행 가이드</div>
                  <ul className="mt-3 space-y-2">
                    <li>
                      • 이체/출금 요청은 즉시 접수되며, 거래·출금 보안 단계가
                      함께 적용됩니다.
                    </li>
                    <li>
                      • 코인 입금은 주소와 정확한 금액을 맞춰 송금하면 자동
                      정산됩니다.
                    </li>
                    <li>
                      • 한국 계좌 출금은 계좌 인증과 PIN 확인이 완료된 후
                      처리됩니다.
                    </li>
                  </ul>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-white/4 p-4">
                  <div className="font-black text-white">은행 입금 정보</div>
                  <div className="mt-3 grid gap-2 text-sm text-white/80 sm:grid-cols-3">
                    <div>은행: {BANK_INFO.bankName}</div>
                    <div>계좌: {BANK_INFO.account}</div>
                    <div>예금주: {BANK_INFO.owner}</div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[30px] border border-white/10 bg-white/4 p-5 backdrop-blur-xl sm:p-6">
            <div className="flex items-center gap-2 text-white font-black">
              <Sparkles className="h-4 w-4 text-fuchsia-200" />
              빠른 액션
            </div>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => navigate(APP_ROUTES.trading)}
                className="w-full rounded-[22px] bg-amber-400 px-4 py-3 text-sm font-black text-black"
              >
                트레이딩 바로가기
              </button>
              <button
                type="button"
                onClick={() => navigate(APP_ROUTES.referral)}
                className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"
              >
                추천 보상 보기
              </button>
              <button
                type="button"
                onClick={() => void refreshWalletState()}
                disabled={isRefreshing}
                className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {isRefreshing ? "동기화 중..." : "자금 상태 다시 불러오기"}
              </button>
            </div>

            <div className="mt-5 rounded-[26px] border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                    최근 활동
                  </div>
                  <div className="mt-1 text-sm text-white/75">
                    실제 거래/출금 내역을 바로 확인합니다.
                  </div>
                </div>
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-white/80">
                  {activityLoading ? "로딩" : `${activity.length}건`}
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {activityError ? (
                  <div className="rounded-2xl border border-dashed border-rose-300/40 bg-rose-500/10 px-3 py-4 text-sm text-rose-100">
                    {activityError}
                  </div>
                ) : activityLoading ? (
                  <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm text-white/70">
                    최근 활동을 불러오는 중입니다...
                  </div>
                ) : activity.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm text-white/70">
                    아직 표시할 활동이 없습니다.
                  </div>
                ) : (
                  activity.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-black text-white">
                            {item.title}
                          </div>
                          <div className="mt-1 text-[11px] leading-5 text-white/70">
                            {item.detail}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${statusTone(item.status)}`}
                          >
                            {item.status}
                          </div>
                          <div className="mt-2 text-sm font-black text-white">
                            {item.amount ? fmtKRW(item.amount) : "—"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-white/55">
                        {formatRelativeTime(item.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-5 rounded-[26px] border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                최근 요청
              </div>
              <div className="mt-3 space-y-2">
                {requests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm text-white/70">
                    아직 처리 중인 요청이 없습니다.
                  </div>
                ) : (
                  requests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-black text-white">
                          {request.title}
                        </div>
                        <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] text-amber-100">
                          {request.status}
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] leading-6 text-white/75">
                        {request.detail}
                      </div>
                      <div className="mt-2 text-[10px] text-white/55">
                        {request.createdAt}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </PlatformShell>
  );
}
