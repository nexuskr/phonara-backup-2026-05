import { supabase } from "@/integrations/supabase/client";
import { submitDeposit } from "@/lib/deposits-rpc";
import {
  createDepositIntent as createCryptoDepositIntent,
  type CryptoDepositIntent,
} from "@/lib/phonaraPay";
import { requestWithdrawal, type WithdrawalInput } from "@/lib/wallet";

export const PHASE_A_COIN_NETWORKS = ["TRC20"] as const;
export type PhaseACoinNetwork = (typeof PHASE_A_COIN_NETWORKS)[number];

export type PhaseAErrorCode =
  | "ERR_INVALID_INPUT"
  | "ERR_DEPOSIT_METHOD_UNSUPPORTED"
  | "ERR_DUPLICATE_REQUEST"
  | "ERR_INSUFFICIENT_BALANCE"
  | "ERR_UNAUTHORIZED"
  | "ERR_FORBIDDEN"
  | "ERR_NETWORK_UNSUPPORTED"
  | "ERR_INTERNAL_SERVER";

export type PhaseAEnvelope<T> =
  | {
      success: true;
      error_code: null;
      message: string;
      data: T;
      trace_id: string;
    }
  | {
      success: false;
      error_code: PhaseAErrorCode;
      message: string;
      data: null;
      trace_id: string;
    };

export type PhaseAWithdrawalRequest = Omit<WithdrawalInput, "coinNetwork"> & {
  coinNetwork?: string;
};

export type PhaseASubmitDepositResult = Awaited<
  ReturnType<typeof submitDeposit>
>;

export class PhaseAClientError extends Error {
  constructor(
    public readonly code: PhaseAErrorCode,
    public readonly traceId: string,
    public readonly details?: unknown,
  ) {
    super(getPhaseAErrorMessage(code));
    this.name = "PhaseAClientError";
  }
}

function getTraceId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getPhaseAErrorMessage(code: PhaseAErrorCode) {
  switch (code) {
    case "ERR_INVALID_INPUT":
      return "입력값이 올바르지 않습니다.";
    case "ERR_DEPOSIT_METHOD_UNSUPPORTED":
      return "지원하지 않는 입금 방식입니다.";
    case "ERR_DUPLICATE_REQUEST":
      return "이미 처리 중인 요청이 있습니다.";
    case "ERR_INSUFFICIENT_BALANCE":
      return "잔액이 부족합니다.";
    case "ERR_UNAUTHORIZED":
      return "로그인이 필요합니다.";
    case "ERR_FORBIDDEN":
      return "접근 권한이 없습니다.";
    case "ERR_NETWORK_UNSUPPORTED":
      return "현재 Phase A 기준으로 TRC20만 지원합니다.";
    case "ERR_INTERNAL_SERVER":
    default:
      return "요청을 처리하는 중 오류가 발생했습니다.";
  }
}

export function createPhaseAEnvelope<T>(
  data: T,
  message: string,
): PhaseAEnvelope<T> {
  return {
    success: true,
    error_code: null,
    message,
    data,
    trace_id: getTraceId(),
  };
}

export function createPhaseAErrorEnvelope(
  code: PhaseAErrorCode,
  message?: string,
): PhaseAEnvelope<never> {
  return {
    success: false,
    error_code: code,
    message: message ?? getPhaseAErrorMessage(code),
    data: null,
    trace_id: getTraceId(),
  };
}

export function normalizePhaseAError(err: unknown): PhaseAClientError {
  const message =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : String(err);
  const traceId = getTraceId();

  if (
    message.includes("auth_required") ||
    message.includes("unauthenticated") ||
    message.includes("not authenticated")
  ) {
    return new PhaseAClientError("ERR_UNAUTHORIZED", traceId, err);
  }

  if (message.includes("forbidden") || message.includes("permission denied")) {
    return new PhaseAClientError("ERR_FORBIDDEN", traceId, err);
  }

  if (
    message.includes("insufficient") ||
    message.includes("insufficient_funds") ||
    message.includes("available_balance")
  ) {
    return new PhaseAClientError("ERR_INSUFFICIENT_BALANCE", traceId, err);
  }

  if (
    message.includes("duplicate") ||
    message.includes("already") ||
    message.includes("unique_violation") ||
    message.includes("duplicate request")
  ) {
    return new PhaseAClientError("ERR_DUPLICATE_REQUEST", traceId, err);
  }

  if (
    message.includes("invalid_amount") ||
    message.includes("invalid_address") ||
    message.includes("invalid pin") ||
    message.includes("invalid amount") ||
    message.includes("pin mismatch") ||
    message.includes("bank_account")
  ) {
    return new PhaseAClientError("ERR_INVALID_INPUT", traceId, err);
  }

  if (message.includes("unsupported") || message.includes("not supported")) {
    return new PhaseAClientError(
      "ERR_DEPOSIT_METHOD_UNSUPPORTED",
      traceId,
      err,
    );
  }

  if (message.includes("TRC20") || message.includes("network")) {
    return new PhaseAClientError("ERR_NETWORK_UNSUPPORTED", traceId, err);
  }

  return new PhaseAClientError("ERR_INTERNAL_SERVER", traceId, err);
}

export function unwrapPhaseAEnvelope<T>(result: PhaseAEnvelope<T>): T {
  if (!result.success) {
    throw new PhaseAClientError(result.error_code, result.trace_id);
  }
  return result.data;
}

export function validatePhaseACoinNetwork(
  network: string,
): asserts network is PhaseACoinNetwork {
  if (network !== "TRC20") {
    throw new PhaseAClientError("ERR_NETWORK_UNSUPPORTED", getTraceId());
  }
}

export async function getPhaseAReceiveAddress(): Promise<string> {
  const { data, error } = await supabase.rpc("get_pay_receive_address");
  if (error) throw error;
  if (!data) {
    throw new PhaseAClientError(
      "ERR_INTERNAL_SERVER",
      getTraceId(),
      "코인 수신 주소를 불러오지 못했습니다.",
    );
  }
  return String(data);
}

export async function createPhaseADepositIntent(
  amount: number,
  network: string,
): Promise<PhaseAEnvelope<CryptoDepositIntent>> {
  try {
    validatePhaseACoinNetwork(network);
    const receiveAddress = await getPhaseAReceiveAddress();
    const intent = await createCryptoDepositIntent(amount, receiveAddress);
    return createPhaseAEnvelope(intent, "코인 입금 안내가 생성되었습니다.");
  } catch (error) {
    const phaseAError = normalizePhaseAError(error);
    return createPhaseAErrorEnvelope(phaseAError.code, phaseAError.message);
  }
}

export async function submitPhaseADeposit(
  args: Parameters<typeof submitDeposit>[0],
): Promise<PhaseAEnvelope<PhaseASubmitDepositResult>> {
  try {
    const data = await submitDeposit(args);
    return createPhaseAEnvelope(data, "입금 요청이 생성되었습니다.");
  } catch (error) {
    const phaseAError = normalizePhaseAError(error);
    return createPhaseAErrorEnvelope(phaseAError.code, phaseAError.message);
  }
}

export async function requestPhaseAWithdrawal(
  args: PhaseAWithdrawalRequest,
): Promise<
  PhaseAEnvelope<{ tx_code: string; process_by: string; amount: number }>
> {
  try {
    if (args.method === "coin") {
      validatePhaseACoinNetwork(args.coinNetwork ?? "TRC20");
    }

    const data = await requestWithdrawal({
      amount: args.amount,
      method: args.method,
      bankName: args.bankName,
      bankAccount: args.bankAccount,
      coinAddress: args.coinAddress,
      coinNetwork: args.coinNetwork,
      pin: args.pin,
    });

    return createPhaseAEnvelope(
      {
        tx_code: data.tx_code,
        process_by: data.process_by,
        amount: data.amount,
      },
      "출금 요청이 생성되었습니다.",
    );
  } catch (error) {
    const phaseAError = normalizePhaseAError(error);
    return createPhaseAErrorEnvelope(phaseAError.code, phaseAError.message);
  }
}
