export type DepositMethod = "coin" | "bank" | "voucher";
export type WithdrawMethod = "coin" | "bank";

export type DepositFormInput = {
  method: DepositMethod;
  amount: string;
  network: string;
  sender: string;
  memo: string;
  voucherPin: string;
  giftBrand: string;
};

export type WithdrawFormInput = {
  method: WithdrawMethod;
  amount: string;
  pin: string;
  bankName: string;
  bankAccount: string;
  coinAddress: string;
  network: string;
  availableBalance: number;
};

export type ValidationResult = {
  ok: boolean;
  message: string;
};

function parseAmount(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

function isValidPin(pin: string): boolean {
  return /^[0-9]{6}$/.test(pin);
}

function isValidVoucherPin(pin: string): boolean {
  return /^[0-9]{16,18}$/.test(pin);
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

export function validateDepositForm(input: DepositFormInput): ValidationResult {
  const amount = parseAmount(input.amount);

  if (amount < 10000) {
    return { ok: false, message: "최소 입금 금액은 10,000원 이상입니다." };
  }

  if (input.method === "coin") {
    if (!hasText(input.network)) {
      return { ok: false, message: "코인 네트워크를 선택해주세요." };
    }

    return { ok: true, message: "코인 입금 요청을 생성할 수 있습니다." };
  }

  if (input.method === "bank") {
    if (!hasText(input.sender)) {
      return { ok: false, message: "보내는 분 이름을 입력해주세요." };
    }
    if (!hasText(input.memo)) {
      return { ok: false, message: "입금 메모를 입력해주세요." };
    }

    return { ok: true, message: "은행 입금 요청을 생성할 수 있습니다." };
  }

  if (!hasText(input.giftBrand)) {
    return { ok: false, message: "상품권 종류를 선택해주세요." };
  }

  if (!isValidVoucherPin(input.voucherPin)) {
    return {
      ok: false,
      message: "상품권 PIN은 숫자 16~18자리로 입력해주세요.",
    };
  }

  return { ok: true, message: "상품권 입금 요청을 생성할 수 있습니다." };
}

export function validateWithdrawForm(
  input: WithdrawFormInput,
): ValidationResult {
  const amount = parseAmount(input.amount);

  if (amount < 1000) {
    return { ok: false, message: "최소 출금 금액은 1,000원 이상입니다." };
  }

  if (amount > input.availableBalance) {
    return {
      ok: false,
      message: "출금 가능 잔액보다 큰 금액은 출금할 수 없습니다.",
    };
  }

  if (!isValidPin(input.pin)) {
    return { ok: false, message: "출금 PIN은 6자리 숫자로 입력해주세요." };
  }

  if (input.method === "bank") {
    if (!hasText(input.bankName) || !hasText(input.bankAccount)) {
      return { ok: false, message: "은행명과 계좌번호를 모두 입력해주세요." };
    }

    return { ok: true, message: "은행 출금 요청을 생성할 수 있습니다." };
  }

  if (!hasText(input.coinAddress)) {
    return { ok: false, message: "코인 주소를 입력해주세요." };
  }

  return { ok: true, message: "코인 출금 요청을 생성할 수 있습니다." };
}
