/**
 * scripts/rpc.surface.baseline.mjs — RPC Surface 3-mode collector.
 *
 * USAGE (manual, in a browser DevTools console on the running app):
 *   1) Open the app, log in.
 *   2) Paste this entire file into the DevTools console and press Enter.
 *   3) Follow scenario:
 *        - Stay on /dashboard active 5 min.
 *        - Switch to another tab for 5 min.
 *        - Come back, leave idle (no input) 5 min.
 *   4) Run:  __phonaraSurface.report()
 *      → copy printed JSON into  reports/rpc.surface.<YYYY-MM-DD>.json
 *   5) Run:  __phonaraSurface.entropy()
 *      → copy printed JSON into  reports/entropy.surface.<YYYY-MM-DD>.json
 *
 * This file is NOT bundled. Zero impact on production.
 */
(() => {
  if (typeof window === "undefined") return;
  if (window.__phonaraSurface) {
    console.warn("[surface] collector already installed");
    return;
  }

  const surface = {
    startedAt: new Date().toISOString(),
    foreground: { count: 0, byRpc: {} },
    hidden:     { count: 0, byRpc: {} },
    idle:       { count: 0, byRpc: {} },
  };

  let mode = document.hidden ? "hidden" : "foreground";
  let lastInteraction = Date.now();
  const IDLE_MS = 60_000;

  document.addEventListener("visibilitychange", () => {
    mode = document.hidden ? "hidden" : "foreground";
  });
  ["pointerdown", "keydown", "scroll", "touchstart"].forEach((ev) =>
    window.addEventListener(ev, () => { lastInteraction = Date.now(); }, { passive: true })
  );
  setInterval(() => {
    if (!document.hidden && Date.now() - lastInteraction > IDLE_MS) mode = "idle";
  }, 1000);

  function bump(url) {
    try {
      const u = String(url || "");
      const m = u.match(/\/rest\/v1\/rpc\/([A-Za-z0-9_-]+)/);
      const key = m ? m[1] : (u.match(/\/rest\/v1\/([A-Za-z0-9_-]+)/) || [, "non-rpc"])[1];
      const bucket = surface[mode];
      bucket.count += 1;
      bucket.byRpc[key] = (bucket.byRpc[key] || 0) + 1;
    } catch { /* noop */ }
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    const url = typeof input === "string" ? input : (input && input.url) || "";
    if (url.includes("/rest/v1/")) bump(url);
    return nativeFetch(input, init);
  };

  const NativeXHR = window.XMLHttpRequest;
  const origOpen = NativeXHR.prototype.open;
  NativeXHR.prototype.open = function (method, url, ...rest) {
    if (typeof url === "string" && url.includes("/rest/v1/")) bump(url);
    return origOpen.call(this, method, url, ...rest);
  };

  window.__phonaraSurface = {
    report() {
      const payload = { ...surface, capturedAt: new Date().toISOString(), currentMode: mode };
      console.log(JSON.stringify(payload, null, 2));
      return payload;
    },
    entropy() {
      const reg = window.__entropyExport;
      if (typeof reg === "function") {
        const r = reg();
        console.log(JSON.stringify(r, null, 2));
        return r;
      }
      console.warn("[surface] entropy export unavailable — make sure DEV build is running and EntropyChip mounted.");
      return null;
    },
  };

  console.info("[surface] installed. After ~15 min run __phonaraSurface.report() and __phonaraSurface.entropy().");
})();
