import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

/**
 * 한국어 1인 운영자용 5분 요약 reporter.
 * 실패는 가장 위에, screenshot/trace 경로 포함.
 */
export default class KoReporter implements Reporter {
  private failures: { title: string; error: string; attachments: string[] }[] = [];
  private passed = 0;
  private skipped = 0;

  onBegin(_config: FullConfig, suite: Suite) {
    const total = suite.allTests().length;
    console.log(`\n📋 Phonara E2E — 총 ${total}개 테스트 시작\n`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === "passed") this.passed++;
    else if (result.status === "skipped") this.skipped++;
    else if (result.status === "failed" || result.status === "timedOut") {
      const error = result.error?.message?.split("\n")[0] || "unknown";
      const attachments = result.attachments
        .filter((a) => a.path)
        .map((a) => a.path!)
        .slice(0, 3);
      this.failures.push({
        title: `${test.parent.title} > ${test.title}`,
        error,
        attachments,
      });
    }
  }

  onEnd(_result: FullResult) {
    console.log("\n" + "═".repeat(60));
    console.log("📊 Phonara E2E — 5분 요약");
    console.log("═".repeat(60));
    console.log(`✅ 통과: ${this.passed}`);
    console.log(`⏭️  스킵: ${this.skipped}`);
    console.log(`❌ 실패: ${this.failures.length}`);
    if (this.failures.length > 0) {
      console.log("\n💀 실패 목록 (오늘 모바일에서 죽은 곳):");
      this.failures.forEach((f, i) => {
        console.log(`\n  ${i + 1}. ${f.title}`);
        console.log(`     원인: ${f.error}`);
        if (f.attachments.length > 0) {
          console.log(`     첨부: ${f.attachments.join(", ")}`);
        }
      });
      console.log("\n👉 HTML 리포트: bunx playwright show-report");
    } else {
      console.log("\n🎉 오늘 모바일에서 죽은 곳 없음. 안심하고 자세요.");
    }
    console.log("═".repeat(60) + "\n");
  }
}
