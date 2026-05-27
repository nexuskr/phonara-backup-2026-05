// src/app/trading/v3/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import PhonOrderPanel from '@/components/trading/v3/PhonOrderPanel';
import PositionList from '@/components/trading/v3/PositionList';
import PriceHeader from '@/components/trading/v3/PriceHeader';
import { supabase } from '@/integrations/supabase/client';

export default function PhonaraTradingV3() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };

    getCurrentUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Top Navigation */}
      <div className="border-b border-zinc-800 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-black tracking-tighter text-white">PHONARA</div>
            <div className="px-4 py-1.5 bg-emerald-500 text-black text-xs font-bold rounded-full">V2 ENDGAME</div>
          </div>
          <div className="font-mono text-sm text-zinc-500">GLOBAL PERPETUAL TRADING</div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-6xl font-bold tracking-tighter mb-2">BTCUSDT</h1>
          <p className="text-emerald-500 text-2xl">Perpetual Futures • Up to 125x</p>
        </div>

        {/* 실시간 Mark Price Header */}
        <PriceHeader symbol="BTCUSDT" />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* 주문 패널 */}
          <div className="xl:col-span-5">
            <PhonOrderPanel userId={userId} symbol="BTCUSDT" />
          </div>

          {/* 포지션 리스트 */}
          <div className="xl:col-span-7 space-y-8">
            <PositionList userId={userId} />

            {/* Market Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <div className="text-zinc-400">24h Volume</div>
                <div className="text-4xl font-mono font-bold mt-3">68.4B</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <div className="text-zinc-400">Open Interest</div>
                <div className="text-4xl font-mono font-bold mt-3">2.47B</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <div className="text-zinc-400">Funding Rate</div>
                <div className="text-4xl font-mono font-bold text-emerald-500 mt-3">0.0123%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}