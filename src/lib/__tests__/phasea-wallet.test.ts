import { describe, expect, it } from "vitest";
import {
  createPhaseAEnvelope,
  normalizePhaseAError,
} from "@/lib/phasea-wallet";

describe("phasea-wallet helpers", () => {
  it("creates a standardized success envelope", () => {
    const envelope = createPhaseAEnvelope(
      { ok: true, id: "dep_123" },
      "입금 요청이 생성되었습니다.",
    );

    expect(envelope.success).toBe(true);
    expect(envelope.error_code).toBeNull();
    expect(envelope.message).toBe("입금 요청이 생성되었습니다.");
    expect(envelope.data).toEqual({ ok: true, id: "dep_123" });
    expect(envelope.trace_id).toMatch(/^[a-z0-9-]+$/i);
  });

  it("maps invalid input errors to a Phase A error code", () => {
    const error = normalizePhaseAError(new Error("invalid_amount"));

    expect(error.code).toBe("ERR_INVALID_INPUT");
    expect(error.message).toContain("입력값이 올바르지 않습니다");
  });
});
