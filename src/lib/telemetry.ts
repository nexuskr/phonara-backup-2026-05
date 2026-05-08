// Conversion telemetry SDK — single entry point for all funnel events.
// Lightweight, fire-and-forget, never throws into UI.
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const ANON_KEY = "phonara_anon_id";
const QUEUE_KEY = "phonara_telemetry_queue";

export type TelemetryEvent = "view" | "cta_click" | "dismiss" | "convert";

export interface TrackPayload {
  surface: string;
  variant?: string;
  meta?: Record<string, unknown>;
}

function genAnonId(): string {
  // 16-byte random hex
  const bytes = new Uint8Array(12);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function getAnonId(): string {
  if (typeof window === "undefined") return "ssr00000000";
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = genAnonId();
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return genAnonId();
  }
}

async function flushQueue() {
  if (typeof window === "undefined") return;
  let queue: any[] = [];
  try {
    queue = JSON.parse(sessionStorage.getItem(QUEUE_KEY) || "[]");
  } catch { queue = []; }
  if (!queue.length) return;
  sessionStorage.removeItem(QUEUE_KEY);
  for (const row of queue) {
    try { await supabase.from("conversion_events").insert(row); } catch { /* drop */ }
  }
}

export async function track(event: TelemetryEvent, payload: TrackPayload): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { data: auth } = await supabase.auth.getUser();
    const row = {
      user_id: auth?.user?.id ?? null,
      anon_id: getAnonId(),
      event_type: event,
      surface: payload.surface,
      variant: payload.variant ?? "default",
      meta: payload.meta ?? {},
    };
    const { error } = await supabase.from("conversion_events").insert(row);
    if (error) {
      // queue for retry on next page
      try {
        const queue = JSON.parse(sessionStorage.getItem(QUEUE_KEY) || "[]");
        queue.push(row);
        sessionStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-50)));
      } catch { /* ignore */ }
    }
  } catch {
    // never throw into UI
  }
}

/** Fire a single `view` event when a surface mounts. */
export function useTrackView(surface: string, variant: string = "default", meta?: Record<string, unknown>) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track("view", { surface, variant, meta });
    flushQueue();
  }, [surface, variant]);
}

/** Convenience: fire & forget click. */
export function trackClick(surface: string, variant?: string, meta?: Record<string, unknown>) {
  return track("cta_click", { surface, variant, meta });
}

export function trackDismiss(surface: string, variant?: string, meta?: Record<string, unknown>) {
  return track("dismiss", { surface, variant, meta });
}

export function trackConvert(surface: string, variant?: string, meta?: Record<string, unknown>) {
  return track("convert", { surface, variant, meta });
}
