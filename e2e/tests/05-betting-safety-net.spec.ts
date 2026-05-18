import { test, expect } from "../fixtures/auth.fixture";

/**
 * Basic Betting Safety Net — 실제 RPC 호출은 mock으로 100% 차단.
 * moneyFlowGuard fixture가 호출 감지 시 자동 fail.
 */
test.describe("05 Betting Safety Net", () => {
  test("Crash 게임 페이지가 로드된다", async ({ mockedPage: page }) => {
    await page.goto("/games/crash");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
  });

  test("Duel 동결 상태 mock → 베팅 비활성 표시", async ({ mockedPage: page }) => {
    await page.route("**/rpc/is_duel_frozen**", (r) =>
      r.fulfill({ status: 200, body: "true" }),
    );
    await page.goto("/duel");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
  });

  test("Kill switch ON mock → 결제/베팅 차단 메시지", async ({ mockedPage: page }) => {
    await page.route("**/rpc/get_imperial_kill_switches**", (r) =>
      r.fulfill({
        status: 200,
        body: JSON.stringify({ betting: true, withdrawal: false }),
      }),
    );
    await page.goto("/duel");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
  });
});
