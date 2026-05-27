// src/components/trading/v3/RiskIndicator.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RiskIndicatorProps {
  positionId: string;
  leverage: number;
}

export default function RiskIndicator({ positionId, leverage }: RiskIndicatorProps) {
  const [riskRatio, setRiskRatio] = useState(0);
  const [liqPrice, setLiqPrice] = useState(0);
  const [shouldLiquidate, setShouldLiquidate] = useState(false);

  useEffect(() => {
    const checkRisk = async () => {
      const { data, error } = await supabase
        .rpc('check_liquidation', { p_position_id: positionId });

      if (data && data.length > 0) {
        const risk = data[0];
        setRiskRatio(Number(risk.risk_ratio));
        setLiqPrice(Number(risk.liquidation_price));
        setShouldLiquidate(risk.should_liquidate);
      }
    };

    checkRisk();

    // 3초마다 Risk 체크 (실시간 느낌)
    const interval = setInterval(checkRisk, 3000);

    return () => clearInterval(interval);
  }, [positionId]);

  const riskColor = riskRatio < 0.7 
    ? 'text-emerald-500' 
    : riskRatio < 0.9 
      ? 'text-yellow-500' 
      : 'text-red-500';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Risk Status</h3>
        <span className={`font-mono text-sm ${riskColor}`}>
          { (riskRatio * 100).toFixed(1) }% RISK
        </span>
      </div>

      <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-6">
        <div 
          className={`h-full transition-all duration-300 ${riskRatio > 0.9 ? 'bg-red-500' : riskRatio > 0.7 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
          style={{ width: `${Math.min(riskRatio * 100, 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-zinc-400">Liquidation Price</div>
          <div className="font-mono font-bold text-orange-400">
            {liqPrice.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-zinc-400">Maintenance Margin</div>
          <div className="font-mono">
            {(leverage <= 10 ? 0.5 : leverage <= 25 ? 1 : 2.5)}%
          </div>
        </div>
      </div>

      {shouldLiquidate && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500 rounded-xl text-red-500 text-center font-medium">
          ⚠️ LIQUIDATION IMMINENT
        </div>
      )}
    </div>
  );
}