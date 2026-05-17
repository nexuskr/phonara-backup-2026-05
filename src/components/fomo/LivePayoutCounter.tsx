import { motion } from "framer-motion";
import { ArrowDownToLine } from "lucide-react";
import { useLiveFomoCounters } from "@/hooks/use-live-fomo-counters";
import { FOMO } from "@/lib/glossary";

/**
 * LivePayoutCounter — Dashboard 상단 라이브 출금 인원 카운터 (15s 폴링).
 * Phase E Slice 4: Imperial Card + imperial-pulse-dot + FOMO.withdrawingNow.
 */
export default function LivePayoutCounter() {
  const c = useLiveFomoCounters();
  if (!c) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ contain: "layout paint" }}
      className="imperial-card px-3 py-2 flex items-center gap-2 text-[12px] will-change-transform"
      aria-live="polite"
    >
      <span className="imperial-pulse-dot shrink-0" aria-hidden />
      <ArrowDownToLine className="w-3.5 h-3.5 text-amber-300 shrink-0" />
      <span className="text-foreground/90 leading-snug">
        {FOMO.withdrawingNow(c.withdrawing_now)}
      </span>
    </motion.div>
  );
}
