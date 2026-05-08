import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function isAuthorizedCron(req: Request): boolean {
  const expected = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!expected) return false;
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  return timingSafeEqual(token, expected);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!isAuthorizedCron(req)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const startedAt = Date.now();
  const caller =
    req.headers.get("x-caller") ??
    req.headers.get("user-agent") ??
    "unknown";

  try {
    const { data, error } = await supabase.rpc("_cron_settle_package_daily");
    if (error) throw error;

    const duration = Date.now() - startedAt;
    const settled =
      typeof data === "object" && data !== null && "settled" in (data as any)
        ? Number((data as any).settled ?? 0)
        : 0;

    await supabase.rpc("log_cron_settle", {
      _ok: true,
      _settled_count: settled,
      _duration_ms: duration,
      _caller: caller,
      _error: null,
      _metadata: { result: data ?? null },
    });

    return new Response(JSON.stringify({ ok: true, result: data, duration_ms: duration }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const duration = Date.now() - startedAt;
    const message = e instanceof Error ? e.message : String(e);

    try {
      await supabase.rpc("log_cron_settle", {
        _ok: false,
        _settled_count: 0,
        _duration_ms: duration,
        _caller: caller,
        _error: message,
        _metadata: {},
      });
    } catch (_) {
      // best-effort: don't mask the original failure
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
