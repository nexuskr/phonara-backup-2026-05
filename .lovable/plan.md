# 실시간 차트 부활 + 60fps Zero-Lag

UI 1픽셀 변경 없음. 외과적 성능 수술만.

## A. 실시간 차트 (핵심 버그 수정)

**`src/lib/paper-trading/bybit-feed.ts`**
- 25개 심볼 `tickers.{sym}` + `kline.1.{sym}` 동시 subscribe
- `KlineBar { time, open, high, low, close, volume, confirm }` 타입
- `klines` 맵 + `klineListeners: Map<string, Set<fn>>`, `onKline(sym, fn)` 메서드
- WS kline 메시지 → 해당 심볼 listeners 즉시 호출 (RafScheduler 동기화)
- 재연결 후 subscribe 재전송 검증
- emit `setTimeout(120ms)` → `rafScheduler.schedule(...)`

**`src/components/trading/LightweightChartPanel.tsx`**
- 마운트/심볼 변경 시 REST `/v5/market/kline?category=linear&symbol=&interval=1&limit=300` → `series.setData(history)`
- `feed.onKline(symbol, bar => series.update(...))` 우선 사용
- 기존 틱 빌더는 fallback (kline 도착 시 비활성)
- symbol 변경 시 unsubscribe + setData([]) + 새 history + 새 subscribe
- update 후 `chart.timeScale().scrollToRealTime()`
- DEV 모드 `console.debug('[KLINE]', symbol, bar.close)` 1초 스로틀

## B. 60fps Zero-Lag

- 신규 `src/lib/util/raf-scheduler.ts` — 싱글톤. 1프레임 1 emit, 탭 hidden idle
- 신규 `src/hooks/use-symbol-price.ts` + `use-bybit-ticker.ts` 리팩터 — `useSyncExternalStore`, 심볼별 selector
- `React.memo` + Row 분리: `OpenPositionsLive`(PositionRow), `TradingHistoryGold`(HistoryRow), `MegaOrderPanel`, `ChartWithHeader`, `ComboStreakHUD`
- Chart overlays `price+side+title` 해시 비교 → 동일 시 priceLine 재생성 skip
- `DopamineLayer`: fx 큐잉, `prefers-reduced-motion` + `localStorage('phonara_reduced_motion')`, `body.animate` shake → CSS `@keyframes`, DEV FPS HUD
- 신규 `src/components/util/LazyMount.tsx` (IntersectionObserver)
- `GlobalIntelligence.tsx`: `EquityCurveCard`/`AchievementShowcase`/`WeeklyLeaderboard`/`PersonalMemoryPanel`/`GlobalContributionBar` LazyMount 래핑, `submit/closePos/closeAll/liquidatePos` useCallback, `userId` ref 이동

## 파일 변경
```
신규: raf-scheduler.ts, use-symbol-price.ts, LazyMount.tsx
수정: bybit-feed.ts, use-bybit-ticker.ts, LightweightChartPanel.tsx,
      ChartWithHeader.tsx, OpenPositionsLive.tsx, TradingHistoryGold.tsx,
      MegaOrderPanel.tsx, ComboStreakHUD.tsx, DopamineLayer.tsx,
      GlobalIntelligence.tsx
```

## Out of Scope
WS Worker, react-window, framer-motion LazyMotion, 거래 로직/RPC/RLS, UI 색상/레이아웃.

## 검증
- 빌드 통과
- DEV `[KLINE] BTCUSDT ...` 1초마다
- F5 없이 캔들 매초 변동, 1분마다 신규 봉
- 심볼 전환 즉시 반영
- Big Win 중 60fps (DEV FPS HUD)
- reduced-motion 정상