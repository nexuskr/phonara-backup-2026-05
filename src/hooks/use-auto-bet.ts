import { useEffect, useRef, useState } from "react";
import { notify } from "@/lib/notify";

interface Args {
  enabled: boolean;
  onTick: () => boolean | Promise<boolean>; // return true = success, false = failure
  intervalMs?: number;
  maxFailures?: number;
}

/**
 * AUTO REPEAT — 일정 간격으로 onTick 호출.
 * 연속 실패 N회 시 자동 OFF + 안전 토스트.
 */
export function useAutoBet({ enabled, onTick, intervalMs = 3500, maxFailures = 3 }: Args) {
  const [autoOn, setAutoOn] = useState(enabled);
  const failures = useRef(0);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => { setAutoOn(enabled); }, [enabled]);

  useEffect(() => {
    if (!autoOn) return;
    failures.current = 0;
    const id = setInterval(async () => {
      try {
        const ok = await onTickRef.current();
        if (ok) failures.current = 0;
        else {
          failures.current += 1;
          if (failures.current >= maxFailures) {
            setAutoOn(false);
            notify.warning("AUTO REPEAT 자동 중지", { description: "연속 실패가 감지되어 안전 정지했습니다." });
          }
        }
      } catch {
        failures.current += 1;
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [autoOn, intervalMs, maxFailures]);

  return [autoOn, setAutoOn] as const;
}
