export type ActivityStatus =
  | "pending"
  | "processing"
  | "approved"
  | "completed"
  | "rejected"
  | "manual";

export type WalletActivityKind = "deposit" | "withdraw" | "trade" | "reward";

export interface WalletActivity {
  id: string;
  kind: WalletActivityKind;
  title: string;
  detail: string;
  amount: number;
  status: ActivityStatus;
  createdAt: string;
}

export interface WalletTransactionRecord {
  id?: string;
  created_at?: string;
  kind?: string;
  type?: string;
  description?: string;
  memo?: string;
  title?: string;
  amount?: number | string;
  direction?: string;
  status?: string;
  metadata?: Record<string, unknown> | null;
  ref_id?: string;
}

export interface WalletWithdrawalRecord {
  id?: string;
  created_at?: string;
  amount?: number | string;
  status?: string;
  method?: string;
  tx_code?: string;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizeDate(value: unknown): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function safeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  if (Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function normalizeStatus(value: unknown): ActivityStatus {
  const raw = getString(value).toLowerCase();
  if (raw.includes("pend")) return "pending";
  if (raw.includes("process")) return "processing";
  if (raw.includes("approv")) return "approved";
  if (raw.includes("complet")) return "completed";
  if (raw.includes("reject")) return "rejected";
  return "manual";
}

function normalizeTransactionStatus(kind: string): ActivityStatus {
  const normalized = kind.toLowerCase();
  if (normalized.includes("deposit")) return "completed";
  if (normalized.includes("withdraw")) {
    if (normalized.includes("complete") || normalized.includes("release"))
      return "completed";
    if (normalized.includes("lock")) return "pending";
    return "approved";
  }
  if (
    normalized.includes("trade") ||
    normalized.includes("reward") ||
    normalized.includes("profit") ||
    normalized.includes("jackpot") ||
    normalized.includes("mission")
  ) {
    return "completed";
  }
  return "manual";
}

function normalizeWithdrawalStatus(value: unknown): ActivityStatus {
  return normalizeStatus(value);
}

function formatMethodLabel(value: unknown): string {
  const raw = getString(value).toLowerCase();
  if (raw === "bank") return "BANK";
  if (raw === "coin") return "COIN";
  if (raw === "voucher") return "VOUCHER";
  return raw.toUpperCase() || "BANK";
}

function getSourceLabel(metadata: Record<string, unknown>): string {
  const source = getString(metadata.source).toLowerCase();
  if (source.includes("coin")) return "코인 입금";
  if (source.includes("bank")) return "은행 입금";
  if (source.includes("voucher")) return "상품권 입금";
  return "입금";
}

function getTransactionKind(kind: string): WalletActivityKind {
  const normalized = kind.toLowerCase();
  if (normalized.includes("deposit")) return "deposit";
  if (normalized.includes("withdraw")) return "withdraw";
  if (
    normalized.includes("reward") ||
    normalized.includes("profit") ||
    normalized.includes("jackpot") ||
    normalized.includes("mission")
  )
    return "reward";
  return "trade";
}

function getTransactionTitle(
  kind: string,
  metadata: Record<string, unknown>,
): string {
  const normalized = kind.toLowerCase();
  if (normalized.includes("deposit")) return "입금 완료";
  if (normalized.includes("withdraw")) {
    if (normalized.includes("complete") || normalized.includes("release"))
      return "출금 완료";
    return "출금 요청";
  }
  if (
    normalized.includes("reward") ||
    normalized.includes("profit") ||
    normalized.includes("jackpot") ||
    normalized.includes("mission")
  ) {
    return getString(metadata.label || metadata.title || "보상 수령");
  }
  const symbol = getString(metadata.symbol);
  if (symbol) return `${symbol} 거래`;
  return "거래 내역";
}

function getTransactionDetail(
  kind: string,
  metadata: Record<string, unknown>,
  amount: number,
): string {
  const normalized = kind.toLowerCase();
  if (normalized.includes("deposit")) {
    const sourceLabel = getSourceLabel(metadata);
    return `${sourceLabel} · ${amount > 0 ? "완료" : "대기"}`;
  }
  if (normalized.includes("withdraw")) {
    const txCode = getString(metadata.tx_code);
    const method = formatMethodLabel(metadata.method);
    if (txCode) return `${method} · ${txCode}`;
    return `${method} · 요청 접수`;
  }
  if (
    normalized.includes("reward") ||
    normalized.includes("profit") ||
    normalized.includes("jackpot") ||
    normalized.includes("mission")
  ) {
    const memo = getString(
      metadata.memo || metadata.reason || metadata.description,
    );
    return memo || `${amount.toLocaleString()}원 적립`;
  }
  const symbol = getString(metadata.symbol);
  if (symbol) {
    const side = getString(metadata.side);
    const leverage = getString(metadata.leverage);
    const suffix = side ? ` · ${side}` : "";
    const leverageSuffix = leverage ? ` · ${leverage}x` : "";
    return `${symbol}${suffix}${leverageSuffix}`;
  }
  return `${amount.toLocaleString()}원`;
}

export function mapWalletActivities(
  transactions: WalletTransactionRecord[],
  withdrawals: WalletWithdrawalRecord[],
): WalletActivity[] {
  const mapped: WalletActivity[] = [];

  for (const item of transactions) {
    const kind = getString(item.kind || item.type);
    const createdAt = normalizeDate(item.created_at);
    const amount = Math.abs(getNumber(item.amount));
    const metadata = safeMetadata(item.metadata);

    mapped.push({
      id: `txn-${getString(item.id) || `${createdAt}-${Math.random()}`}`,
      kind: getTransactionKind(kind || "trade"),
      title: getTransactionTitle(kind || "trade", metadata),
      detail: getTransactionDetail(kind || "trade", metadata, amount),
      amount,
      status: normalizeTransactionStatus(kind || "trade"),
      createdAt,
    });
  }

  for (const item of withdrawals) {
    const createdAt = normalizeDate(item.created_at);
    const status = normalizeWithdrawalStatus(item.status);
    const method = formatMethodLabel(item.method);
    const txCode = getString(item.tx_code);

    mapped.push({
      id: `wd-${getString(item.id) || `${createdAt}-${Math.random()}`}`,
      kind: "withdraw",
      title:
        status === "completed"
          ? "출금 완료"
          : status === "approved"
            ? "출금 승인"
            : "출금 요청",
      detail: `${method} · ${txCode || "요청 접수"}`,
      amount: Math.abs(getNumber(item.amount)),
      status,
      createdAt,
    });
  }

  mapped.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return mapped;
}
