// src/hooks/useWallet.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePositions } from './usePositions';

export function useWallet(userId: string | null) {
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { positions, totalUnrealizedPnl, loading: positionsLoading } = usePositions(userId);

  useEffect(() => {
    if (!userId) {
      setBalances([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchBalances = async () => {
      const { data, error } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', userId);
      
      if (error) console.error('Balances fetch error:', error);
      setBalances(data || []);
      setLoading(false);
    };

    fetchBalances();

    // Realtime Subscription
    const channel = supabase
      .channel(`wallet_changes_${userId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'wallet_balances', 
          filter: `user_id=eq.${userId}` 
        },
        fetchBalances
      )
      .subscribe();

    // Cleanup - Promise 제거
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // RPC Functions
  const openPosition = async (params: any) => {
    const { data, error } = await supabase.rpc('open_position', params);
    if (error) throw error;
    return data;
  };

  const closePosition = async (positionId: string, closePrice: number) => {
    const { data, error } = await supabase.rpc('close_position', {
      p_user_id: userId,
      p_position_id: positionId,
      p_close_price: closePrice,
    });
    if (error) throw error;
    return data;
  };

  return {
    balances,
    positions,
    totalUnrealizedPnl,
    loading: loading || positionsLoading,
    openPosition,
    closePosition,
  };
}