import { useEffect, useRef } from "react";
import type { LivePosition } from "@/lib/trading/types";
import { computeRoi } from "@/lib/trading/engine";
import { useTriggerStore } from "@/lib/trading/triggers-store";

interface CloseFn {
  (id: string, mark: number, reason?: "tp" | "sl" | "trailing"): Promise<unknown> | unknown;
}

/**
 * Watches all open positions and triggers `onClose` when any position
 * crosses its TP / SL / Trailing-Stop threshold (ROI-based).
 * Runs in the browser — works for both Paper and Real modes.
 */
export function usePositionTriggerWatcher(opts: {
  positions: LivePosition[];
  prices: Record<string, number>;
  onClose: CloseFn;
}) {
  const { positions, prices, onClose } = opts;
  const triggers = useTriggerStore((s) => s.triggers);
  const updateTrigger = useTriggerStore((s) => s.update);
  const removeTrigger = useTriggerStore((s) => s.remove);
  const fired = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const p of positions) {
      const t = triggers[p.id];
      if (!t) continue;
      if (fired.current.has(p.id)) continue;
      const mark = prices[p.symbol];
      if (!mark) continue;
      const roiPct = computeRoi(p.side, p.entry, mark, p.leverage) * 100;

      // Update trailing peak.
      if (t.trailingPct && t.trailingPct > 0) {
        const peak = t.peakRoiPct ?? 0;
        if (roiPct > peak) {
          updateTrigger(p.id, { peakRoiPct: roiPct });
        } else if (peak > 0 && roiPct <= peak - t.trailingPct) {
          // Trailing stop hit.
          fired.current.add(p.id);
          Promise.resolve(onClose(p.id, mark, "trailing")).finally(() => removeTrigger(p.id));
          continue;
        }
      }

      if (t.tpPct && t.tpPct > 0 && roiPct >= t.tpPct) {
        fired.current.add(p.id);
        Promise.resolve(onClose(p.id, mark, "tp")).finally(() => removeTrigger(p.id));
        continue;
      }
      if (t.slPct && t.slPct > 0 && roiPct <= -t.slPct) {
        fired.current.add(p.id);
        Promise.resolve(onClose(p.id, mark, "sl")).finally(() => removeTrigger(p.id));
        continue;
      }
    }

    // Clean up fired-set when position no longer open.
    const ids = new Set(positions.map((p) => p.id));
    for (const id of fired.current) if (!ids.has(id)) fired.current.delete(id);
  }, [positions, prices, triggers, onClose, updateTrigger, removeTrigger]);
}
