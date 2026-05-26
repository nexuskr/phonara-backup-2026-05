import { useMemo } from "react";
import { fallbackHotSymbols, symbolHotFloor } from "@/lib/fakeTradingFloor";

export interface HotSymbol {
  sym: string;
  open_positions: number;
  traders_24h: number;
}

export function useHotSymbols(count = 8): HotSymbol[] {
  return useMemo(() => {
    const topSymbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
    const extras = fallbackHotSymbols(Math.max(0, count - topSymbols.length));
    const syms = [...topSymbols, ...extras].slice(0, count);

    return syms.map((sym) => {
      const floor = symbolHotFloor(sym);
      return {
        sym,
        open_positions: floor.open_positions,
        traders_24h: floor.traders_24h,
      };
    });
  }, [count]);
}
