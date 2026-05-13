import { useEffect, useState } from "react";
import { useDB } from "@/lib/store";

const KEY = "phonara_session_start_balance_v1";

/**
 * 세션 시작 시점 잔고 대비 수익을 계산.
 * 임계점 도달 시 한 번만 출금 nudge 트리거 (sessionStorage 가드).
 */
export function useSessionProfit() {
  const [db] = useDB();
  const balance = db.user?.balance ?? 0;

  const [start, setStart] = useState<number>(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) return Number(raw) || balance;
    } catch {}
    return balance;
  });

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY) == null) {
        sessionStorage.setItem(KEY, String(balance));
        setStart(balance);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const profit = balance - start;
  return { profit, start, current: balance };
}
