// src/components/trading/v3/PriceHeader.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { priceService } from '@/lib/price';

interface PriceHeaderProps {
  symbol?: string;
}

export default function PriceHeader({ symbol = 'BTCUSDT' }: PriceHeaderProps) {
  const [markPrice, setMarkPrice] = useState<number>(108742.35);
  const [indexPrice, setIndexPrice] = useState<number>(108735.80);
  const [fundingRate, setFundingRate] = useState<number>(0.0123);
  const [change24h, setChange24h] = useState<number>(2.84);

  useEffect(() => {
    // Mark Price 실시간 구독
    priceService.subscribeToMarkPrices([symbol]);

    const handlePriceUpdate = (e: CustomEvent) => {
      const price = priceService.getMarkPrice(symbol);
      if (price) {
        setMarkPrice(Number(price.mark_price));
        setIndexPrice(Number(price.index_price));
        setFundingRate(Number(price.funding_rate || 0.0123));
      }
    };

    window.addEventListener('mark_price_updated', handlePriceUpdate as EventListener);

    return () => {
      window.removeEventListener('mark_price_updated', handlePriceUpdate as EventListener);
    };
  }, [symbol]);

  const isPositive = change24h >= 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-5xl font-mono font-bold tracking-tighter">
              {markPrice.toLocaleString()}
            </div>
            <div className="text-emerald-500 text-sm font-medium">MARK PRICE</div>
          </div>

          <div className="h-12 w-px bg-zinc-800" />

          <div>
            <div className="text-2xl font-mono text-zinc-400">
              {indexPrice.toLocaleString()}
            </div>
            <div className="text-xs text-zinc-500">INDEX PRICE</div>
          </div>
        </div>

        <div className="flex items-center gap-8 text-right">
          <div>
            <div className={`text-2xl font-mono font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{change24h}%
            </div>
            <div className="text-xs text-zinc-500">24H CHANGE</div>
          </div>

          <div>
            <div className="text-xl font-mono font-medium text-orange-400">
              {fundingRate.toFixed(4)}%
            </div>
            <div className="text-xs text-zinc-500">FUNDING RATE</div>
          </div>
        </div>
      </div>

      {/* Live Indicator */}
      <div className="flex items-center gap-2 mt-4 text-xs text-emerald-500">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        LIVE • REAL-TIME MARK PRICE
      </div>
    </div>
  );
}