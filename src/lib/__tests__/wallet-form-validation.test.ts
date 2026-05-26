import { describe, expect, it } from "vitest";
import {
  validateDepositForm,
  validateWithdrawForm,
} from "@/lib/wallet-form-validation";

describe("wallet form validation", () => {
  it("rejects insufficient coin deposit amount", () => {
    const result = validateDepositForm({
      method: "coin",
      amount: "5000",
      network: "TRC20",
      sender: "",
      memo: "",
      voucherPin: "",
      giftBrand: "culture",
    });

    expect(result.ok).toBe(false);
    expect(result.message).toContain("10,000원");
  });

  it("accepts a valid bank deposit form", () => {
    const result = validateDepositForm({
      method: "bank",
      amount: "50000",
      network: "TRC20",
      sender: "홍길동",
      memo: "실전 자금 충전",
      voucherPin: "",
      giftBrand: "culture",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects withdraw forms without a PIN or address", () => {
    const result = validateWithdrawForm({
      method: "coin",
      amount: "10000",
      pin: "12345",
      bankName: "",
      bankAccount: "",
      coinAddress: "",
      network: "TRC20",
      availableBalance: 200000,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toContain("출금 PIN");
  });
});
