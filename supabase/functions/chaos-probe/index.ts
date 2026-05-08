// Daily chaos probe — runs same-style read-only probes the script does,
// then records to chaos_runs via service_role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type" };
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SENSITIVE = [
  "transactions","wallet_balances","withdrawal_requests","deposit_requests",
  "profiles","user_roles","admin_audit_log","security_audit_log",
  "anomaly_events","cron_settle_audit_log","account_freezes",
];

type Result = { name: string; pass: boolean; detail: string };

async function probeAnonDenied(table: string): Promise<Result> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, {
    headers: { apikey: ANON },
  });
  if (!r.ok) return { name: `RLS deny: ${table}`, pass: true, detail: `HTTP ${r.status}` };
  const body = await r.json();
  const empty = Array.isArray(body) && body.length === 0;
  return { name: `RLS deny: ${table}`, pass: empty, detail: empty ? "empty" : "LEAKED rows" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const start = Date.now();
  const results: Result[] = [];

  for (const t of SENSITIVE) results.push(await probeAnonDenied(t));

  // Trust RPC
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/public_trust_metrics`, {
      method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" }, body: "{}",
    });
    results.push({ name: "Trust RPC reachable", pass: r.ok, detail: `HTTP ${r.status}` });
  } catch (e) { results.push({ name: "Trust RPC reachable", pass: false, detail: (e as Error).message }); }

  // Public-status
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/public-status`, { headers: { apikey: ANON } });
    const j = await r.json();
    results.push({ name: "public-status OK", pass: r.ok && j.indicator === "brightgreen", detail: `${r.status} ${j.indicator}` });
  } catch (e) { results.push({ name: "public-status OK", pass: false, detail: (e as Error).message }); }

  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = total - passed;
  const duration = Date.now() - start;

  const sb = createClient(SUPABASE_URL, SERVICE, { auth: { persistSession: false } });
  await sb.rpc("record_chaos_run", {
    _total: total, _passed: passed, _failed: failed,
    _duration_ms: duration, _results: results, _source: "cron",
  });

  return new Response(JSON.stringify({ ok: true, total, passed, failed, duration_ms: duration }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
