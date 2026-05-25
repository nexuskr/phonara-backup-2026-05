/**
 * Route prefetch — triggers lazy() chunk fetch ahead of navigation.
 *
 * cleanup/rebuild-v1 기준으로 대대적 정리 완료 (2026.05.25)
 * - 삭제된 bloat 라우트 전부 제거
 * - 존재하지 않는 페이지 라우트 제거
 * - TradingArenaBybit.tsx는 절대 건드리지 않음
 */

type Loader = () => Promise<unknown>;

const REGISTRY: Record<string, Loader> = {
  // === 현재 존재하는 것으로 확인된 라우트만 유지 ===
  "/trade": () => import("@/pages/TradingArenaBybit.tsx"),

  // 나머지 라우트는 실제 페이지 파일이 생기면 그때 추가
};

const fetched = new Set<string>();
const timings = new Map<
  string,
  { startedAt: number; loadedAt?: number; navAt?: number; deltaMs?: number }
>();

const isDev =
  typeof import.meta !== "undefined" && (import.meta as any).env?.DEV;

function log(label: string, payload: Record<string, unknown>) {
  if (!isDev) return;
  console.info(`%c[prefetch] ${label}`, "color:#a78bfa", payload);
}

export function prefetchRoute(path: string): void {
  if (fetched.has(path)) return;
  const loader = REGISTRY[path];
  if (!loader) return;
  fetched.add(path);
  const startedAt = performance.now();
  timings.set(path, { startedAt });
  loader()
    .then(() => {
      const t = timings.get(path);
      if (!t) return;
      t.loadedAt = performance.now();
      log("chunk-loaded", { path, ms: +(t.loadedAt - t.startedAt).toFixed(1) });
    })
    .catch(() => {
      fetched.delete(path);
      timings.delete(path);
    });
}

export function schedulePrefetch(routes: string[] = ["/trade"]): void {
  if (typeof window === "undefined") return;
  const run = () => {
    for (const r of routes) prefetchRoute(r);
  };
  // @ts-ignore
  if (typeof window.requestIdleCallback === "function") {
    // @ts-ignore
    window.requestIdleCallback(run, { timeout: 4000 });
  } else {
    setTimeout(run, 1500);
  }
}

export function prefetchHandlers(path: string) {
  return {
    onMouseEnter: () => prefetchRoute(path),
    onFocus: () => prefetchRoute(path),
    onTouchStart: () => prefetchRoute(path),
  };
}

export function recordNavigation(path: string): void {
  const t = timings.get(path);
  const navAt = performance.now();
  if (!t) {
    log("nav-cold", { path, prefetched: false });
    return;
  }
  t.navAt = navAt;
  const ready = t.loadedAt ?? navAt;
  t.deltaMs = +Math.max(0, ready - navAt).toFixed(1);
  log("nav-hit", {
    path,
    prefetchedMs: t.loadedAt ? +(t.loadedAt - t.startedAt).toFixed(1) : null,
    waitedForChunkMs: t.deltaMs,
    saved: t.loadedAt && t.loadedAt < navAt,
  });
}

export function getPrefetchTimings() {
  return Array.from(timings.entries()).map(([path, t]) => ({ path, ...t }));
}
