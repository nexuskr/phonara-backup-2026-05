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
  rejected_reason?: string;
  approved_at?: string;
}

// ==================== 유틸리티 ====================

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

function normalizeTransactionStatus(kind: string): ActivityStatus {
  const normalized = kind.toLowerCase();
  if (normalized.includes("deposit")) return "completed";
  if (normalized.includes("withdraw")) return "completed";
  return "completed";
}

function getTransactionKind(kind: string): WalletActivityKind {
  const normalized = kind.toLowerCase();
  if (normalized.includes("deposit")) return "deposit";
  if (normalized.includes("withdraw")) return "withdraw";
  if (
    normalized.includes("reward") ||
    normalized.includes("profit") ||
    normalized.includes("mission")
  )
    return "reward";
  return "trade";
}

// ==================== 매핑 함수 ====================

export function mapWalletActivities(
  transactions: WalletTransactionRecord[],
  withdrawals: WalletWithdrawalRecord[],
): WalletActivity[] {
  const mapped: WalletActivity[] = [];

  // transactions 매핑
  for (const item of transactions) {
    const kind = getString(item.kind || item.type);
    const createdAt = normalizeDate(item.created_at);
    const amount = Math.abs(getNumber(item.amount));
    const metadata = safeMetadata(item.metadata);

    mapped.push({
      id: `txn-${getString(item.id)}`,
      kind: getTransactionKind(kind),
      title: kind.includes("deposit")
        ? "입금 완료"
        : kind.includes("withdraw")
          ? "출금 완료"
          : "거래 내역",
      detail: `${amount.toLocaleString()}원`,
      amount,
      status: normalizeTransactionStatus(kind),
      createdAt,
    });
  }

  // withdrawals 매핑
  for (const item of withdrawals) {
    const createdAt = normalizeDate(item.created_at);
    const amount = Math.abs(getNumber(item.amount));

    mapped.push({
      id: `wd-${getString(item.id)}`,
      kind: "withdraw",
      title:
        item.status === "rejected"
          ? "출금 거절"
          : item.status === "approved"
            ? "출금 승인"
            : "출금 요청",
      detail: `${getString(item.method).toUpperCase()} · ${amount.toLocaleString()}원`,
      amount,
      status: (item.status as ActivityStatus) || "pending",
      createdAt,
    });
  }

  mapped.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return mapped;
}

