import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import i18n from "i18next";
import { i18nReady } from "./lib/i18n";
import { detectPreferredLocale } from "./hooks/use-preferred-locale";
import { installViewportLock } from "./lib/viewport-lock";
import { installLayoutShiftMonitor } from "./lib/layout-shift-monitor";
import { watchMotionClass } from "./lib/app-settings";

// Lovable 잔재(@pkg/runtime) 제거
// import { installHiddenTabSuspension, installIdleSuspension } from "@pkg/runtime";

try {
  const url = new URL(window.location.href);
  const persisted = localStorage.getItem("phonara-lang");
  if (!persisted && !url.searchParams.get("lang")) {
    const detected = detectPreferredLocale();
    if (detected && i18n.language?.split("-")[0] !== detected) {
      i18n.changeLanguage(detected);
    }
  }
} catch {}

// Lock viewport height before first paint
installViewportLock();
// Apply user's reduce-motion preference
watchMotionClass();
// Diagnose layout shifts
installLayoutShiftMonitor();

// PR-G, PR-H: Lovable 전용 기능 주석 처리
// installHiddenTabSuspension();
// installIdleSuspension();

const boot = () => {
  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary scope="root">
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  );
};

i18nReady.then(boot, boot);