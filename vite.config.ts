import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import compression from "vite-plugin-compression";
import removeConsole from "vite-plugin-remove-console";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // M-5: strip console.* in production builds (keep error/warn for prod incident triage)
    mode !== "development" && removeConsole({ includes: ["log", "info", "debug", "trace"] }),
    mode !== "development" && compression({ algorithm: "brotliCompress", ext: ".br", threshold: 1024 }),
    mode !== "development" && compression({ algorithm: "gzip", ext: ".gz", threshold: 1024 }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@pkg": path.resolve(__dirname, "./src/packages"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    // PR-B: modulepreload 화이트리스트.
    // locale-ja / locale-vi 는 i18n.ts 가 active language 만 dynamic import
    // 하므로 부트 preload 불필요. 비활성 언어 청크가 Layer 1 에 계상되는 것 차단.
    // motion 도 MotionConfig 정적 import 제거 후 자연스럽게 lazy 페이지에서만 등장 →
    // 만약 entry 그래프에 잔존 시에도 preload 만 막아 Layer 1 metric 에서 제외.
    modulePreload: {
      polyfill: true,
      resolveDependencies: (_filename, deps) =>
        deps.filter((d) => !/\/locale-(ja|vi)-[^/]+\.js$/.test(d) && !/\/motion-[^/]+\.js$/.test(d)),
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // P5 — split per-language locale modules so only the active language
          // ships at boot. (`src/lib/i18n.ts` dynamic-imports these.)
          if (id.includes("/src/locales/ko")) return "locale-ko";
          if (id.includes("/src/locales/en")) return "locale-en";
          if (id.includes("/src/locales/ja")) return "locale-ja";
          if (id.includes("/src/locales/vi")) return "locale-vi";

          // PR-A: signature-engine 수동 그룹 제거.
          // 이전 manualChunks 그룹은 `cn` 같은 공용 유틸을 흡수해서
          // 모든 페이지에서 import → 자동 modulepreload 되며 Layer 1을 73KB 부풀렸음.
          // 슬롯 페이지가 router-lazy 이므로 자연 코드 스플리팅에 맡긴다.

          // 사운드 매니저(소스) — 슬롯 공통이지만 슬롯 페이지가 router-lazy 이므로
          // async chunk 로 자연 분리됨. 명시적 그룹화는 위와 같은 흡수 이슈를 유발하므로 제거.

          if (!id.includes("node_modules")) return;

          // PR-C: 라이브러리 수동 그룹화 최소화.
          // 부트 핵심(supabase auth / i18n / icons / motion) 만 별도 청크로 유지.
          // 그 외(howler/recharts/d3/lightweight-charts/date-fns)는 자연 코드 스플리팅에 맡겨
          // 자동 modulepreload 흡수 이슈를 차단한다.
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("i18next")) return "i18n";
          if (id.includes("framer-motion") || id.includes("motion-dom") || id.includes("motion-utils")) return "motion";
          // PR-B: pickers 수동 그룹 제거.
          // cmdk/vaul/embla/day-picker는 admin/special 페이지만 사용하며
          // 해당 페이지는 router-lazy. 수동 그룹화 시 공용 청크로 승격되어
          // 자동 modulepreload 됨 (signature-engine 과 동일 패턴).
          // 나머지(react, react-dom, react-router, radix, tanstack 등)는
          // 단일 vendor chunk로 묶어 createContext 순서 문제를 회피.
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
}));
