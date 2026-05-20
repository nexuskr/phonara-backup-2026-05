// useCrashTick — server-authoritative Crash V2 state via broadcast on `market:apex_crash`.
// Money flow 0 touch (bets/cashout via apex_crash_* RPCs only).
// Note: @pkg/realtime wrapper covers postgres_changes only. Broadcast subscription uses
// supabase.channel directly here — this is NOT a money-flow path.
/* eslint-disable @lovable/no-raw-channel -- broadcast-only, non-money-flow (apex crash V2) */
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CrashPhase = "idle" | "pending" | "running" | "busted";

export interface CrashRoundState {
  roundId: string | null;
  roundNo: number | null;
  phase: CrashPhase;
  multiplier: number;
  crashX: number | null;
  serverSeedHash: string | null;
  publicSeed: string | null;
  nonce: number | null;
  serverSeed: string | null;
  signature: string | null;
  jitterMs: number;
}

const INITIAL: CrashRoundState = {
  roundId: null, roundNo: null, phase: "idle", multiplier: 1, crashX: null,
  serverSeedHash: null, publicSeed: null, nonce: null, serverSeed: null,
  signature: null, jitterMs: 0,
};

export function useCrashTick(): CrashRoundState {
  const [state, setState] = useState<CrashRoundState>(INITIAL);
  const lastTickAt = useRef<number>(0);

  useEffect(() => {
    const ch = supabase.channel("market:apex_crash", { config: { broadcast: { self: false } } });
    ch.on("broadcast", { event: "round_pending" }, ({ payload }: any) => {
      setState((s) => ({
        ...s, phase: "pending", roundId: payload.round_id, roundNo: payload.round_no,
        serverSeedHash: payload.server_seed_hash, publicSeed: payload.public_seed,
        nonce: payload.nonce, serverSeed: null, signature: null, multiplier: 1, crashX: null,
      }));
    });
    ch.on("broadcast", { event: "round_running" }, ({ payload }: any) => {
      setState((s) => ({ ...s, phase: "running", roundId: payload.round_id, roundNo: payload.round_no, multiplier: 1 }));
    });
    ch.on("broadcast", { event: "tick" }, ({ payload }: any) => {
      const now = performance.now();
      const dt = lastTickAt.current ? now - lastTickAt.current : 0;
      lastTickAt.current = now;
      setState((s) => ({ ...s, multiplier: Number(payload.m), jitterMs: Math.abs(dt - 200) }));
    });
    ch.on("broadcast", { event: "round_busted" }, ({ payload }: any) => {
      setState((s) => ({
        ...s, phase: "busted", crashX: Number(payload.crash_x), multiplier: Number(payload.crash_x),
        serverSeed: payload.server_seed ?? null, signature: payload.signature ?? null,
      }));
    });
    ch.subscribe();
    return () => { void supabase.removeChannel(ch); lastTickAt.current = 0; };
  }, []);

  return state;
}
