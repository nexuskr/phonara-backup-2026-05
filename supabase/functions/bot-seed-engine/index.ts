// P0.5 — Bot Seeding Engine
// 매분 호출되어 시뮬레이션 활동 이벤트를 생성합니다.
// 봇은 표시 전용이며, KRW/USDT 잔고에는 절대 영향을 주지 않습니다.
//
// 호출: pg_cron → net.http_post (분당 1회). 내부에서 30초 단위로 두 배치 생성.
// 인증: 본 함수는 service-role로 동작 (verify_jwt=false). cron secret 헤더로 보호.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bot-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET  = Deno.env.get("BOT_CRON_SECRET") ?? ""; // 비어있으면 검증 생략 (개발용)

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// 이벤트 텍스트 템플릿 (한국어, 디자인 토큰 친화)
const TEMPLATES: Record<string, (n: string, e: string) => { text: string; reward: number | null }> = {
  attendance:       (n, e) => ({ text: `${e} ${n}님 — 출석 체크 완료`, reward: null }),
  mission_clear:    (n, e) => ({ text: `${e} ${n}님 — AI 미션 클리어 +${pick([300, 500, 700, 1000]).toLocaleString()}원`, reward: pick([300, 500, 700, 1000]) }),
  paper_win:        (n, e) => ({ text: `${e} ${n}님 — Paper 트레이드 +${pick([5, 8, 12, 18, 25])}% 승리`, reward: null }),
  package_purchase: (n, e) => {
    const tier = pick(["Starter", "Easy 50", "Easy 150", "EMPIRE", "ELITE", "PHANTOM"]);
    return { text: `${e} ${n}님 — ${tier} 패키지 가입`, reward: null };
  },
  jackpot_contrib:  (n, e) => ({ text: `${e} ${n}님 — 잭팟 풀에 ${pick([5_000, 15_000, 50_000, 120_000]).toLocaleString()}원 기여`, reward: pick([5_000, 15_000, 50_000, 120_000]) }),
  withdrawal:       (n, e) => ({ text: `${e} ${n}님 — ${pick([100_000, 350_000, 1_200_000, 4_800_000]).toLocaleString()}원 출금 완료`, reward: pick([100_000, 350_000, 1_200_000, 4_800_000]) }),
  recovery:         (n, e) => ({ text: `${e} ${n}님 — Recovery Bonus +${pick([20, 30, 40, 50, 60])}% 획득`, reward: null }),
  guild_join:       (n, e) => ({ text: `${e} ${n}님 — 길드 가입`, reward: null }),
  new_signup:       (n, e) => ({ text: `${e} ${n}님 — 제국에 합류했습니다`, reward: null }),
};

// 이벤트 타입별 가중치 (라이브 피드의 톤을 결정)
const TYPE_WEIGHTS: [string, number][] = [
  ["mission_clear", 30],
  ["paper_win", 18],
  ["attendance", 14],
  ["package_purchase", 10],
  ["jackpot_contrib", 9],
  ["withdrawal", 7],
  ["recovery", 6],
  ["new_signup", 4],
  ["guild_join", 2],
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function weightedPickType(): string {
  const total = TYPE_WEIGHTS.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * total;
  for (const [t, w] of TYPE_WEIGHTS) { r -= w; if (r <= 0) return t; }
  return TYPE_WEIGHTS[0][0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // cron secret 검증 (설정된 경우)
  if (CRON_SECRET) {
    const provided = req.headers.get("x-bot-cron-secret") ?? "";
    if (provided !== CRON_SECRET) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    // 1) 설정 로드
    const { data: settings, error: setErr } = await sb
      .from("bot_settings").select("enabled, strength_pct").eq("id", 1).maybeSingle();
    if (setErr) throw setErr;
    if (!settings?.enabled || (settings.strength_pct ?? 0) === 0) {
      return new Response(JSON.stringify({ skipped: "disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const strength = settings.strength_pct as number;

    // 2) 페르소나 로드 (활동에 사용)
    const { data: personas, error: pErr } = await sb
      .from("bot_personas").select("id, nickname, avatar_emoji").limit(500);
    if (pErr) throw pErr;
    if (!personas || personas.length === 0) {
      return new Response(JSON.stringify({ skipped: "no_personas" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) 이벤트 N개 생성 (강도 100% = 분당 ~120건)
    const N = Math.round((strength / 100) * 120);
    const rows: Array<Record<string, unknown>> = [];
    for (let i = 0; i < N; i++) {
      const p = personas[Math.floor(Math.random() * personas.length)];
      const type = weightedPickType();
      const tpl = TEMPLATES[type](p.nickname, p.avatar_emoji);
      // occurred_at을 지난 60초 사이로 분산 → 라이브 피드 자연스러움
      const offsetMs = Math.floor(Math.random() * 60_000);
      rows.push({
        persona_id: p.id,
        event_type: type,
        event_text: tpl.text,
        reward_amount: tpl.reward,
        occurred_at: new Date(Date.now() - offsetMs).toISOString(),
      });
    }

    if (rows.length > 0) {
      const { error: insErr } = await sb.from("bot_activity_events").insert(rows);
      if (insErr) throw insErr;
    }

    // 4) 만료된 이벤트 청소 (best effort)
    await sb.from("bot_activity_events").delete().lt("expires_at", new Date().toISOString());

    return new Response(JSON.stringify({ ok: true, inserted: rows.length, strength }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[bot-seed-engine] error", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
