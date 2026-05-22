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
import { installHiddenTabSuspension, installIdleSuspension } from "@pkg/runtime";

// ============================================
// Domain Guard: Force phonara.net as canonical domain
// ============================================
(function enforceCanonicalDomain() {
  if (typeof window === "undefined") return;

  const hostname = window.location.hostname;

  // Allow localhost and phonara.net domains
  const isAllowed =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".phonara.net") ||
    hostname === "phonara.net";

  if (!isAllowed) {
    // Redirect to canonical domain (phonara.net) while preserving path and query
    const target =
      "https://phonara.net" +
      window.location.pathname +
      window.location.search +
      window.location.hash;

    // Avoid infinite redirect loop
    if (window.location.href !== target) {
      window.location.replace(target);
      return;
    }
  }
})();

// First-visit auto locale: respect explicit ?lang=/persisted choice; otherwise detect.
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

// Lock viewport height before first paint to prevent mobile address-bar jitter.
installViewportLock();
// Apply user's reduce-motion preference as <html class="reduce-motion">.
watchMotionClass();
// Diagnose layout shifts (toasts in dev / when phonara:debug-cls=1).
installLayoutShiftMonitor();
// PR-G: pause cosmetic intervals while tab is hidden (cooperative, prod-safe).
installHiddenTabSuspension();
// PR-H: pause admin intervals after 60s idle (cooperative, prod-safe).
installIdleSuspension();

// PR-F: DEV-only RPC 3-mode (foreground/hidden/idle) baseline collector.
// Tree-shaken in production via import.meta.env.DEV guard.
if (import.meta.env.DEV) {
  import("./packages/entropy/rpc.surface").then((m) => m.installRpcSurface()).catch(() => {});
}

// P5 — wait for active locale chunk to resolve before first paint to avoid
// flash-of-keys. Fail-open: if it errors, render anyway (i18n returns keys).
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
