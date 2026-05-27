// src/components/trading/v3/PositionList.tsx
'use client';

import React from 'react';
import { useWallet } from '@/hooks/use-wallet';
import RiskIndicator from './RiskIndicator';

interface PositionListProps {
  userId: string | null;
}

export default function PositionList({ userId }: PositionListProps) {
  const { positions, totalUnrealizedPnl, loading } = useWallet(userId);

  const formatPnL = (pnl: number) => {
    const isPositive = pnl >= 0;
    return (
      <span className={`font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
        {isPositive ? '+' : ''}{pnl.toLocaleString()} USDT
      </span>
    );
  };

  if (loading) {
    return <div className="p-10 text-center text-zinc-400">Loading positions...</div>;
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Open Positions</h2>
        <div className="text-right">
          <div className="text-sm text-zinc-400">Total Unrealized PnL</div>
          <div className="text-2xl font-bold">
            {formatPnL(totalUnrealizedPnl)}
          </div>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          현재 오픈된 포지션이 없습니다.<br />
          Order Panel에서 포지션을 열어보세요.
        </div>
      ) : (
        <div className="space-y-6">
          {positions.map((pos: any) => (
            <div key={pos.id} className="border border-zinc-700 rounded-2xl p-6 hover:border-zinc-600 transition-colors">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-mono font-bold tracking-tight">{pos.symbol}</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      pos.side === 'long' 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {pos.side.toUpperCase()} ×{pos.leverage}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-400 mt-2">
                    Entry {Number(pos.entry_price).toLocaleString()} • 
                    Amount {Number(pos.amount)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-semibold">
                    {formatPnL(pos.unrealized_pnl || 0)}
                  </div>
                </div>
              </div>

              {/* Risk Engine */}
              <RiskIndicator 
                positionId={pos.id} 
                leverage={pos.leverage} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}