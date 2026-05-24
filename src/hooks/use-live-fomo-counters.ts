import { useEffect, useRef, useState } from "react";

/* =========================================================
 * FORMAT NUMBER
 * =======================================================*/

export function formatNumber(
  value: number = 0,
) {
  return new Intl.NumberFormat("ko-KR").format(
    Math.floor(value),
  );
}

/* =========================================================
 * ULTRA SMOOTH COUNTER
 * =======================================================*/

type LiveCounterOptions = {
  minIncrease?: number;
  maxIncrease?: number;
  interval?: number;
  smoothness?: number;
};

export function useLiveCounter(
  initialValue: number = 0,
  {
    minIncrease = 1,
    maxIncrease = 25,
    interval = 2000,
    smoothness = 0.08,
  }: LiveCounterOptions = {},
) {
  const [displayValue, setDisplayValue] =
    useState<number>(initialValue);

  const targetValue =
    useRef<number>(initialValue);

  const animationFrame =
    useRef<number | null>(null);

  /* =====================================================
   * RANDOM TARGET UPDATE
   * ===================================================*/

  useEffect(() => {
    const timer = setInterval(() => {
      const increase =
        Math.floor(
          Math.random() *
            (maxIncrease - minIncrease + 1),
        ) + minIncrease;

      targetValue.current += increase;
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [
    interval,
    minIncrease,
    maxIncrease,
  ]);

  /* =====================================================
   * ULTRA SMOOTH LOOP
   * ===================================================*/

  useEffect(() => {
    const animate = () => {
      setDisplayValue((prev) => {
        const diff =
          targetValue.current - prev;

        if (Math.abs(diff) < 0.01) {
          return targetValue.current;
        }

        return (
          prev +
          diff * smoothness
        );
      });

      animationFrame.current =
        requestAnimationFrame(animate);
    };

    animationFrame.current =
      requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(
          animationFrame.current,
        );
      }
    };
  }, [smoothness]);

  return Math.floor(displayValue);
}