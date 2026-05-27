/**
 * Phonara V2 — Service Worker 등록 관리
 *
 * Production 환경에서만 PWA Service Worker를 등록한다.
 * Lovable Preview, Development, iframe 환경에서는 등록하지 않고 기존 등록도 해제한다.
 */

function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function isPreviewHost(): boolean {
  const hostname = window.location.hostname;
  const previewHints = [
    "id-preview--",
    ".lovableproject.com",
    ".lovable.app",
    "localhost",
    "127.0.0.1",
  ];
  return previewHints.some((hint) => hostname.includes(hint));
}

async function unregisterAllSW() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((reg) => reg.unregister().catch(() => false)),
    );
    console.log("[SW] All previous service workers unregistered");
  } catch (err) {
    console.warn("[SW] Failed to unregister", err);
  }
}

export function registerSW() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const isProd = import.meta.env.PROD && !isInIframe() && !isPreviewHost();

  if (!isProd) {
    void unregisterAllSW();
    return;
  }

  // Production 환경에서만 등록
  const register = () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log(
          "[SW] Service Worker registered successfully:",
          registration.scope,
        );
      })
      .catch((err) => {
        console.warn("[SW] Service Worker registration failed:", err);
      });
  };

  // Idle callback이 있으면 사용, 없으면 setTimeout
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(register, { timeout: 3000 });
  } else {
    setTimeout(register, 2000);
  }
}
