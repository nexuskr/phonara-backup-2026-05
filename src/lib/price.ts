// src/lib/price.ts
// =============================================
// PHONARA V2 - Mark Price + Real-time PnL Service
// =============================================

import { supabase } from '@/integrations/supabase/client';  // ← 올바른 경로

export interface MarkPrice {
  symbol: string;
  mark_price: number;
  index_price: number;
  funding_rate: number;
  last_updated: string;
}

class PriceService {
  private markPrices = new Map<string, MarkPrice>();
  private subscriptions: any[] = [];

  /** Mark Price 실시간 구독 시작 */
  async subscribeToMarkPrices(symbols: string[] = ['BTCUSDT', 'ETHUSDT']) {
    // 초기 데이터 로드
    const { data, error } = await supabase
      .from('mark_prices')
      .select('*')
      .in('symbol', symbols);

    if (error) console.error('Mark price load error:', error);
    
    data?.forEach((p: any) => {
      this.markPrices.set(p.symbol, p);
    });

    // Realtime Subscription
    const channel = supabase
      .channel('mark_prices_realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'mark_prices' 
        },
        (payload) => {
          const newPrice = payload.new as MarkPrice;
          this.markPrices.set(newPrice.symbol, newPrice);
          
          // 전역 이벤트 발생 (usePositions 등에서 수신)
          window.dispatchEvent(new CustomEvent('mark_price_updated', { 
            detail: { symbol: newPrice.symbol } 
          }));
        }
      )
      .subscribe();

    this.subscriptions.push(channel);
    console.log('✅ Mark Price Realtime Subscription Started');
  }

  getMarkPrice(symbol: string): MarkPrice | null {
    return this.markPrices.get(symbol) || null;
  }

  /** Unrealized PnL 계산 (실시간) */
  calculateUnrealizedPnL(position: any): number {
    const mark = this.getMarkPrice(position.symbol);
    if (!mark) return 0;

    const entryPrice = Number(position.entry_price);
    const amount = Number(position.amount);
    const side = position.side?.toLowerCase();

    let pnl = 0;
    if (side === 'long') {
      pnl = (Number(mark.mark_price) - entryPrice) * amount;
    } else if (side === 'short') {
      pnl = (entryPrice - Number(mark.mark_price)) * amount;
    }

    return Math.floor(pnl * 100) / 100; // 소수점 2자리
  }

  unsubscribeAll() {
    this.subscriptions.forEach(ch => ch.unsubscribe());
    this.subscriptions = [];
  }
}

export const priceService = new PriceService();