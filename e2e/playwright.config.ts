import { defineConfig, devices } from "@playwright/test";

/**
 * Phonara E2E — Sovereign Defense Protocol (Phase 0)
 * 1인 운영자가 매일 5분에 점검 가능하도록 설계.
 * 모바일 우선 + Worker fallback 매트릭스 + Tier 0 첫 30초 가드.
 */

const BASE_URL =
  process.env.PHONARA_E2E_BASE_URL ||
  "https://id-preview--c7a12cd6-13f6-4ce6-bf31-cc578b215a4b.lovable.app";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : 2,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["./reporters/ko-reporter.ts"],
    ...(process.env.SLACK_WEBHOOK_E2E ? [["./reporters/slack-notify.ts" as const]] : []),
  ],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 8_000,
    navigationTimeout: 15_000,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
  },
  projects: [
    {
      name: "mobile-ios",
      use: { ...devices["iPhone 13"], hasTouch: true },
    },
    {
      name: "mobile-android",
      use: { ...devices["Pixel 7"], hasTouch: true },
    },
    {
      name: "mobile-lowend",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 360, height: 640 },
        hasTouch: true,
        // CPU throttle은 individual spec에서 CDPSession으로 적용
      },
    },
    {
      name: "mobile-reduced-motion",
      use: {
        ...devices["iPhone 13"],
        hasTouch: true,
        reducedMotion: "reduce",
      },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } },
    },
  ],
});
