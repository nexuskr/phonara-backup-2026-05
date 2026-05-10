import { useEffect, useState } from "react";
import { getFeed, type TickerStat } from "@/lib/paper-trading/bybit-feed";

export type FeedStatus = "connecting" | "open" | "reconnecting" | "rest-fallback";

export function useBybitTicker() {
  const [prices, setPrices] = useState<Record<string, number>>(() => getFeed().getPrices());
  const [stats, setStats] = useState<Record<string, TickerStat>>(() => getFeed().getStats());
  const [status, setStatus] = useState<FeedStatus>("connecting");

  useEffect(() => {
    const feed = getFeed();
    feed.start();
    const offP = feed.onPrices((p) => setPrices(p));
    const offT = feed.onStats((s) => setStats(s));
    const offS = feed.onStatus((s) => setStatus(s));
    setPrices(feed.getPrices());
    setStats(feed.getStats());
    return () => { offP(); offT(); offS(); };
  }, []);

  return { prices, stats, status };
}
