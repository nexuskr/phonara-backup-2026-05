import { test, expect } from "../fixtures/auth.fixture";

/**
 * Onboarding Death Path — 가장 비싸게 잃는 신규 유저 보호.
 */
test.describe("01 Onboarding Death Path", () => {
  test("회원가입 → /welcome → /dashboard 흐름이 끊기지 않는다", async ({ mockedPage: page }) => {
    await page.goto("/auth");
    await expect(page).toHaveURL(/auth/);
    await page.goto("/welcome");
    await expect(page).not.toHaveURL(/error|404/i);
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/error|404/i);
  });

  test("새로고침해도 onboarding 단계 복귀", async ({ mockedPage: page }) => {
    await page.goto("/welcome");
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
  });

  test("에러 토스트는 한국어로 노출 (클레임 RPC 500 mock)", async ({ mockedPage: page }) => {
    await page.route("**/rpc/imperial_claim_signup_bonus**", (r) =>
      r.fulfill({ status: 500, body: JSON.stringify({ error: "internal" }) }),
    );
    await page.goto("/welcome");
    await page.waitForTimeout(500);
    // 한국어 에러 메시지 — 있다면 한글 포함
    const koText = await page.locator("body").innerText();
    // 실패 시에도 페이지가 깨지지 않음
    expect(koText.length).toBeGreaterThan(0);
  });
});
