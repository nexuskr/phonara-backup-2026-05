import { describe, expect, it } from "vitest";
import { mapWalletActivities } from "@/lib/wallet-activity";

describe("wallet activity mapping", () => {
  it("maps deposit credit transactions into deposit activity items", () => {
    const activity = mapWalletActivities(
      [
        {
          id: "tx-1",
          created_at: "2026-05-25T09:00:00.000Z",
          kind: "deposit_credit",
          amount: 50000,
          direction: "credit",
          metadata: { source: "coin" },
        },
      ],
      [],
    );

    expect(activity).toHaveLength(1);
    expect(activity[0]).toMatchObject({
      kind: "deposit",
      title: "입금 완료",
      detail: "코인 입금 · 완료",
      amount: 50000,
      status: "completed",
    });
  });

  it("maps withdrawal requests and keeps latest activity first", () => {
    const activity = mapWalletActivities(
      [
        {
          id: "tx-2",
          created_at: "2026-05-24T09:00:00.000Z",
          kind: "withdrawal_lock",
          amount: 7000,
          direction: "debit",
          metadata: { tx_code: "WD-100", method: "coin" },
        },
      ],
      [
        {
          id: "wd-1",
          created_at: "2026-05-25T10:00:00.000Z",
          amount: 20000,
          status: "approved",
          method: "bank",
          tx_code: "WD-200",
        },
      ],
    );

    expect(activity[0]).toMatchObject({
      kind: "withdraw",
      title: "출금 승인",
      detail: "BANK · WD-200",
      amount: 20000,
      status: "approved",
    });

    expect(activity[1]).toMatchObject({
      kind: "withdraw",
      title: "출금 요청",
      detail: "COIN · WD-100",
      amount: 7000,
      status: "pending",
    });
  });
});
