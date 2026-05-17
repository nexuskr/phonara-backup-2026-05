import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * AnimatedCounter — framer-motion 카운트업.
 */
export default function AnimatedCounter({
  value,
  duration = 0.9,
  className = "",
  suffix = "",
}: { value: number; duration?: number; className?: string; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display;
    const delta = value - start;
    if (delta === 0) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + delta * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);
  return (
    <motion.span
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      className={`tabular-nums ${className}`}
    >
      {display.toLocaleString("ko-KR")}{suffix}
    </motion.span>
  );
}
