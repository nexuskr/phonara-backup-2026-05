# P5-C · P5-D · P5-E — Phase 5 Ultimate Endgame Final Mega Push

P5-A(Tier S+ 5종) + P5-B(Community) 완료 상태에서 남은 3 슬라이스를 한 턴에 통합 압살해 Phase 5를 종료한다. 머니플로 8경로 git diff = 0, House Edge §6 무변경, Layer 1 gz ≤ 180KB, 모든 신규 코드 `@pkg/apex/*` + `supabase/functions/apex-*` 만.

## P5-C — Apocalypse Cup ($1M PHON)

### DB (2 tables + 4 RPC)
```text
apex_cup_seasons   id, name, prize_pool_phon, entry_fee_phon,
                   start_at, end_at, status(scheduled|live|settling|done),
                   bracket_size(64|128), drand_seed_round, settled_at
apex_cup_brackets  id, season_id, round, slot_index,
                   player_a_id, player_b_id, winner_id,
                   drand_round, settled_at
apex_cup_entries   id, season_id, user_id (unique pair),
                   entry_paid_phon, eliminated_at, final_rank
```
RLS: seasons/brackets public read · admin write. entries: self read + 본인 insert.

RPC (SECURITY DEFINER):
- `apex_cup_enter(_season_id, _idem_key)` — entry_fee_phon 차감 시 `apex_place_bet_v2` 재사용(category='cup_entry') → 머니플로 wrapper-only
- `apex_cup_get_season(_season_id)` — brackets + my_status JSON
- `apex_cup_get_leaderboard(_season_id, _limit)` — 상위 entries
- `apex_admin_cup_create_season(...)` — admin only

### Edge (`apex-cup-settler`)
5분 cron. status='live' & 다음 라운드 미정산 시:
1. 최신 Drand round → seed
2. 각 매치 SHA-256(seed|slot) → winner 결정
3. final round 정산 시 `apex_place_bet_v2`(category='cup_payout', amount=prize*share) 호출 — treasury 1% slippage 자동
4. `apex_cup_brackets.winner_id/settled_at` 갱신

### Frontend (`@pkg/apex/events/`)
- `CupBracket.tsx` (P5-B `TournamentBracket` 재사용 wrapper)
- `CupLeaderboard.tsx`, `CupPrizePool.tsx`, `CupEntryModal.tsx`
- `src/pages/apex/events/Cup.tsx` → `/apex/events/cup` (lazy ≤ 25KB gz)

## P5-D — VRF v3 Threshold (tBLS 5-of-9)

### 아키텍처 (논리적, 실배포는 Phase 6)
```text
9 노드 시뮬레이션 (현재 Edge Function 내부 9 키페어로 in-process 시뮬)
  → 5-of-9 BLS partial signature aggregate
  → fallback: tBLS-fail → Drand+Ed25519 (P4) → Ephemeral (dev)
```

신규 secrets 9세트 (점진적 — 현 턴엔 schema/code만 준비):
`APEX_VRF_TBLS_NODE_{1..9}_SK` — 미설정 시 자동 ephemeral 노드 생성.

### Edge (`apex-vrf-oracle-v3`)
- 입력: `{game, round_ref, client_seed?}`
- 9 노드 partial sign → 5개 모이면 aggregate → composed_seed
- 결과 row: `apex_randomness_requests` 에 `vrf_version='v3'`, `quorum=5/9`, `participating_nodes jsonb` 컬럼 추가
- 헤더 `x-vrf-mode: tbls-v3|drand-v2|ephemeral`

### DB
```sql
ALTER TABLE apex_randomness_requests
  ADD COLUMN IF NOT EXISTS vrf_version text DEFAULT 'v2',
  ADD COLUMN IF NOT EXISTS quorum_n int,
  ADD COLUMN IF NOT EXISTS quorum_k int,
  ADD COLUMN IF NOT EXISTS participating_nodes jsonb;
```

### Frontend
- `OracleStatusCard.tsx` 패치: `VRF VERSION` chip(`tbls-v3` 골드) + `Quorum 5/9` 라인
- `useAttestOnSettle.ts` 는 v3 우선, 실패 시 자동 v2 fallback

## P5-E — Cross-Chain + AI Coach v2 + Voice

### Cross-Chain 확장
- `apex_cashout_chains` 테이블에 SOL/SUI/APT/CCTP_V2 row 추가 (insert tool)
- `apex-cashout-processor` 의 chain map 확장(라우팅만 — 실제 SDK 통합은 Phase 6)
- UI: `CashoutPanel` 의 체인 셀렉터에 신규 4종 노출 + "Native" 배지

### AI Coach v2 (`apex-coach-v2`)
- 모델: `google/gemini-3-flash-preview` (Lovable AI Gateway)
- 입력: 최근 30 rolls + tier 자격 → 출력 JSON {recommendation, risk_score 0~1, loss_protect_trigger bool}
- `risk_score > 0.85` 시 `apex_loss_protection_arm()` 자동 호출(idempotent, 기존 RPC 재사용)
- Frontend: `@pkg/apex/coach/CoachV2Panel.tsx` (Vault 페이지 카드, lazy)

### 황제 보이스
- `@pkg/apex/voice/EmperorVoicePlayer.tsx` — 12 프리셋(ko/en × 6 상황) 정적 매니페스트
- 음원 경로: `/audio/emperor/{lang}/{slot}.mp3` (R2 호스팅 — 현 턴 placeholder URL만 등록, 실제 업로드는 후속)
- 사용처: WinReels 대형 승리 + Cup 우승 알림

## 가드레일 검증

- `node scripts/check-money-flow-freeze.mjs` → **8/8 PASS** (모든 chips: cup_entry/cup_payout/loss_protect 는 `apex_place_bet_v2` wrapper)
- `apex_play_mock_game` / `apex_place_bet_v2` / `phon_balances` / `apex_game_rolls` 본문·스키마 0 변경
- Layer 1 gz ≤ 180KB (events/coach/voice 모두 lazy)
- chunk ≤ 80KB gz per: cup ≤ 25KB, coach ≤ 18KB, voice ≤ 8KB
- realtime: `useChatChannel`/`useGameChannel` only · notify 4-tier only
- operator 격리 무변경

## 실측 목표

| 지표 | 목표 |
| --- | --- |
| Cup settler tick | < 800ms / round |
| VRF v3 sync attest | p50 < 250ms |
| AI Coach 응답 | p50 < 1.2s |
| Layer 1 gz | ≤ 180KB |
| money-flow freeze | 8/8 PASS |

## 실행 순서 (한 턴 통합)

1. **migration**: cup 3 tables + RPC 4종 + randomness ALTER (단일 migration)
2. **edge functions**: `apex-cup-settler`, `apex-vrf-oracle-v3`, `apex-coach-v2` (병렬 작성)
3. **cron**: cup-settler 5m (`insert` tool — project URL/key 사용)
4. **frontend**: `@pkg/apex/events/*` + `@pkg/apex/coach/*` + `@pkg/apex/voice/*` + OracleStatusCard 패치 + CashoutPanel 체인 확장
5. **routes**: `/apex/events/cup` lazy 추가 (App.tsx)
6. **chain seed**: SOL/SUI/APT/CCTP_V2 insert
7. **검증**: freeze 스크립트 + bundle-budget 보고

## 최종 선언

모든 작업 완료 시 정확히:
> ✅ Phase 5 완전 압살 종료. ApexForge — 이제 진짜 지구상 유일무이한 베팅 플랫폼의 왕좌를 차지했다.
