// apex-daily-cap-enforcer — telemetry-only. Reports yesterday cap usage + 24h rolls.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: rolls24h, error: e1 } = await supabase
      .from("apex_game_rolls")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);

    const { data: capRows, error: e2 } = await supabase
      .from("apex_daily_cap")
      .select("user_id,roll_count,ymd")
      .gte("ymd", new Date(Date.now() - 2 * 86400 * 1000).toISOString().slice(0, 10))
      .order("roll_count", { ascending: false })
      .limit(20);

    return new Response(JSON.stringify({
      ok: true,
      since,
      rolls_24h: rolls24h ?? 0,
      cap_top: capRows ?? [],
      errors: [e1?.message, e2?.message].filter(Boolean),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
