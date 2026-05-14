/** Aggressive circuit breaker — once any of these fire, kill the RPC for the session. */
export function shouldTripCircuit(error: unknown): boolean {
  if (!error) return false;
  const e = error as { status?: number; code?: string; message?: string };
  const status = Number(e.status ?? 0);
  const code = String(e.code ?? "");
  const msg = String(e.message ?? "");
  if (status === 400 || status === 401 || status === 403 || status === 404) return true;
  if (code.startsWith("PGRST") || code === "42883" || code === "42501") return true;
  if (/permission|unauthorized|bad\s*request|not\s*found|does not exist|forbidden/i.test(msg)) return true;
  return false;
}

export function tripCircuit(key: string) {
  try { sessionStorage.setItem(key, "1"); } catch { /* noop */ }
}

export function isCircuitTripped(key: string): boolean {
  try { return sessionStorage.getItem(key) === "1"; } catch { return false; }
}
