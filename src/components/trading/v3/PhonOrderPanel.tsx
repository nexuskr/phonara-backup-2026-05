// src/components/trading/v3/PhonOrderPanel.tsx
'use client';

import React, { useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';

interface PhonOrderPanelProps {
  userId: string | null;
  symbol?: string;
  defaultSide?: 'long' | 'short';
}

export default function PhonOrderPanel({ 
  userId, 
  symbol = 'BTCUSDT', 
  defaultSide = 'long' 
}: PhonOrderPanelProps) {
  const { openPosition } = useWallet(userId); // useWallet에서 openPosition 사용

  const [side, setSide] = useState<'long' | 'short'>(defaultSide);
  const [leverage, setLeverage] = useState(10);
  const [amount, setAmount] = useState(100); // USDT
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  const isLong = side === 'long';

  const estimatedMargin = Math.floor(amount / leverage);
  const liqPriceApprox = isLong 
    ? (limitPrice || 105000) * 0.95 
    : (limitPrice || 105000) * 1.05;

  const handleSubmit = async () => {
    if (!userId || amount <= 0) return;

    setLoading(true);
    try {
      const entryPrice = orderType === 'market' ? 0 : limitPrice; // market은 0으로 처리

      await openPosition({
        p_user_id: userId,
        p_symbol: symbol,
        p_side: side,
        p_amount: amount / 105000, // 대략적인 contracts (실제로는 조정 필요)
        p_leverage: leverage,
        p_entry_price: entryPrice || 105000,
        p_margin: estimatedMargin,
        p_meta: { orderType }
      });

      alert(`${side.toUpperCase()} 포지션 오픈 성공!`);
      setAmount(100);
    } catch (err: any) {
      alert('포지션 오픈 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6">Order Panel</h2>

      {/* Long / Short Toggle */}
      <div className="flex bg-zinc-800 rounded-xl p-1 mb-6">
        <button
          onClick={() => setSide('long')}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
            isLong 
              ? 'bg-emerald-500 text-black' 
              : 'hover:bg-zinc-700'
          }`}
        >
          LONG
        </button>
        <button
          onClick={() => setSide('short')}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
            !isLong 
              ? 'bg-rose-500 text-black' 
              : 'hover:bg-zinc-700'
          }`}
        >
          SHORT
        </button>
      </div>

      {/* Leverage */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Leverage</span>
          <span className="font-mono font-bold">{leverage}x</span>
        </div>
        <input
          type="range"
          min={1}
          max={125}
          value={leverage}
          onChange={(e) => setLeverage(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-1">
          <span>1x</span>
          <span>125x</span>
        </div>
      </div>

      {/* Amount */}
      <div className="mb-6">
        <label className="block text-sm mb-2">Amount (USDT)</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-5 py-4 text-2xl font-mono focus:outline-none focus:border-emerald-500"
          />
          <span className="absolute right-5 top-5 text-zinc-400">USDT</span>
        </div>
      </div>

      {/* Order Type */}
      <div className="mb-6">
        <label className="block text-sm mb-2">Order Type</label>
        <div className="flex gap-2">
          <button
            onClick={() => setOrderType('market')}
            className={`flex-1 py-3 rounded-xl ${orderType === 'market' ? 'bg-white text-black' : 'bg-zinc-800'}`}
          >
            Market
          </button>
          <button
            onClick={() => setOrderType('limit')}
            className={`flex-1 py-3 rounded-xl ${orderType === 'limit' ? 'bg-white text-black' : 'bg-zinc-800'}`}
          >
            Limit
          </button>
        </div>
      </div>

      {/* Preview Info */}
      <div className="bg-zinc-950 rounded-xl p-4 mb-6 text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-zinc-400">Margin</span>
          <span className="font-mono">{estimatedMargin} USDT</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Est. Liq. Price</span>
          <span className="font-mono text-orange-400">{liqPriceApprox.toFixed(2)}</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || amount <= 0}
        className={`w-full py-5 rounded-2xl text-lg font-bold transition-all ${
          isLong 
            ? 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700' 
            : 'bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-700'
        }`}
      >
        {loading ? 'Processing...' : `${side.toUpperCase()} ${amount} USDT`}
      </button>
    </div>
  );
}