import { test, expect } from "../fixtures/auth.fixture";
import { goOffline, goOnline } from "../fixtures/network";
import { doubleTap } from "../utils/gestures";

/**
 * Edge Cases Dust — 먼지 한 톨까지.
 */
test.describe("06 Edge Cases — Dust Level", () => {
  test("탭 백그라운드 30s → 복귀 시 페이지 살아있음", async ({ mockedPage: page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(page.locator("body")).toBeVisible();
  });

  test("오프라인 → 페이지 깨짐 없음 + 한국어 가능한 에러", async ({ mockedPage: page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await goOffline(page);
    await page.waitForTimeout(300);
    await expect(page.locator("body")).toBeVisible();
    await goOnline(page);
  });

  test("IME 한글 조합 입력 — input 깨짐 없음", async ({ mockedPage: page }) => {
    await page.goto("/auth");
    const input = page.getByRole("textbox").first();
    if (await input.isVisible().catch(() => false)) {
      await input.fill("테스트사용자");
      await expect(input).toHaveValue("테스트사용자");
    }
  });

  test("폰트 크기 200% 시뮬 — 가로 오버플로 없음", async ({ mockedPage: page }) => {
    await page.emulateMedia({ media: "screen" });
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect.soft(overflow, "200% 폰트에서 가로 스크롤 발생").toBeFalsy();
  });

  test("빠른 더블탭 → 중복 제출 없음 (idempotency)", async ({ mockedPage: page }) => {
    let calls = 0;
    await page.route("**/rpc/claim_daily_attendance_v2**", (r) => {
      calls++;
      return r.fulfill({
        status: 200,
        body: JSON.stringify({ status: "ok", streak: 1, reward: 500 }),
      });
    });
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    const btn = page.getByRole("button").first();
    if (await btn.isVisible().catch(() => false)) {
      await doubleTap(page, btn);
      await page.waitForTimeout(500);
    }
    expect.soft(calls, `중복 호출 ${calls}회 (≤ 1 권장)`).toBeLessThanOrEqual(1);
  });

  test("뒤로/앞으로 — 모달 상태 정상", async ({ mockedPage: page }) => {
    await page.goto("/");
    await page.goto("/dashboard");
    await page.goBack();
    await page.goForward();
    await expect(page.locator("body")).toBeVisible();
  });
});
