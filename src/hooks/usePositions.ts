// src/hooks/usePositions.ts
// =============================================
// PHONARA V2 - Real-time Positions + Unrealized PnL
// =============================================

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { priceService } from '@/lib/price';

export interface Position {
  id: string;
  user_id: string;
  symbol: string;
  side: 'long' | 'short';
  entry_price: number;
  amount: number;
  leverage: number;
  margin: number;
  unrealized_pnl: number;
  status: 'open' | 'closed' | 'liquidated';
  opened_at: string;
  closed_at?: string;
  meta?: any;
}

export function usePositions(userId: string | null) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [totalUnrealizedPnl, setTotalUnrealizedPnl] = useState(0);
  const [loading, setLoading] = useState(true);

  // Mark Price 구독 시작
  useEffect(() => {
    if (!userId) return;

    priceService.subscribeToMarkPrices(['BTCUSDT', 'ETHUSDT']);

    return () => {
      priceService.unsubscribeAll();
    };
  }, [userId]);

  // 포지션 데이터 실시간 구독
  useEffect(() => {
    if (!userId) {
      setPositions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 초기 데이터 로드
    const fetchPositions = async () => {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'open')
        .order('opened_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch positions:', error);
      } else {
        const enhancedPositions = (data || []).map((pos: any) => ({
          ...pos,
          unrealized_pnl: priceService.calculateUnrealizedPnL(pos)
        }));
        setPositions(enhancedPositions);
        updateTotalPnL(enhancedPositions);
      }
      setLoading(false);
    };

    fetchPositions();

    // Realtime Positions 변경 구독
    const positionsChannel = supabase
      .channel('positions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'positions',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchPositions(); // 변경 시 전체 리로드 (간단하고 안전한 방식)
        }
      )
      .subscribe();

    // Mark Price 업데이트 시 PnL 실시간 재계산
    const handlePriceUpdate = () => {
      const updatedPositions = positions.map(pos => ({
        ...pos,
        unrealized_pnl: priceService.calculateUnrealizedPnL(pos)
      }));
      setPositions(updatedPositions);
      updateTotalPnL(updatedPositions);
    };

    window.addEventListener('mark_price_updated', handlePriceUpdate);

    return () => {
      positionsChannel.unsubscribe();
      window.removeEventListener('mark_price_updated', handlePriceUpdate);
    };
  }, [userId]);

  const updateTotalPnL = (currentPositions: Position[]) => {
    const total = currentPositions.reduce((sum, pos) => {
      return sum + (pos.unrealized_pnl || 0);
    }, 0);
    setTotalUnrealizedPnl(total);
  };

  return {
    positions,
    totalUnrealizedPnl,
    loading,
    refresh: () => {} // 필요 시 확장
  };
}