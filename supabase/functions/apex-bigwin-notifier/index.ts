// apex-bigwin-notifier — POST { rollId } → broadcasts BigWin on wallet:apex_bigwins partition.
// money-flow safe: read-only on apex_game_rolls.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const DEDUPE_MS = 5 * 60 * 1000;
const lastBroadcast = new Map<string, number>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const rollId = typeof body?.rollId === "string" ? body.rollId : null;
    if (!rollId) {
      return new Response(JSON.stringify({ error: "rollId_required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const last = lastBroadcast.get(rollId);
    if (last && Date.now() - last < DEDUPE_MS) {
      return new Response(JSON.stringify({ ok: true, deduped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: roll, error } = await supabase
      .from("apex_game_rolls")
      .select("id,user_id,game_code,multiplier,payout_phon,payout_usdt,created_at")
      .eq("id", rollId)
      .maybeSingle();
    if (error || !roll) {
      return new Response(JSON.stringify({ error: "roll_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const mult = Number((roll as any).multiplier ?? 0);
    if (mult < 10) {
      return new Response(JSON.stringify({ ok: true, ignored: true, multiplier: mult }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const channel = supabase.channel("wallet:apex_bigwins");
    await channel.subscribe();
    await channel.send({
      type: "broadcast",
      event: "apex_bigwin",
      payload: {
        roll_id: (roll as any).id,
        game_code: (roll as any).game_code,
        multiplier: mult,
        payout_phon: Number((roll as any).payout_phon ?? 0),
        payout_usdt: Number((roll as any).payout_usdt ?? 0),
        created_at: (roll as any).created_at,
      },
    });
    await supabase.removeChannel(channel);
    lastBroadcast.set(rollId, Date.now());

    return new Response(JSON.stringify({ ok: true, broadcasted: true, multiplier: mult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
