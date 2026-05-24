import { supabase } from "@/integrations/supabase/client";

let lastSent = 0;
let sentCount = 0;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

export async function logClientError(
  message: string,
  opts: { stack?: string; context?: Record<string, unknown>; level?: "error" | "warn" | "info" } = {}
) {
  const now = Date.now();
  if (now - lastSent > WINDOW_MS) { 
    sentCount = 0; 
    lastSent = now; 
  }
  if (sentCount >= MAX_PER_WINDOW) return;
  sentCount++;

  try {
    await supabase.rpc("log_client_error", {
      _message: message,
      _stack: opts.stack ?? null,
      _url: typeof window !== "undefined" ? window.location.href : null,
      _user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      _context: (opts.context ?? {}) as never,
      _level: opts.level ?? "error",
    });
  } catch {
    // Swallow — never let the logger crash the app
  }
}

// ErrorBoundary.tsx 호환을 위한 별칭
export { logClientError as logError };