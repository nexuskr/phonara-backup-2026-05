# Top-Tier Security Hardening Plan

목표: 보안 스캔의 모든 Medium/Low 항목을 해소하고, money-flow 8경로 / Operator Isolation / `imperial_*` 함수는 **0바이트** 유지한 상태로 Top-Tier 거래소 수준 보안 자세를 확립한다.

## 불변 제약 (반드시 준수)

- Money-flow 8경로: `imperial_place_phon_bet`, `imperial_settle_*`, `_apply_house_edge_split`, `credit_crypto_deposit`, `request_withdrawal`, `grant_phon_for_deposit`, `grant_nft_for_deposit`, `award_crown` → git diff = 0.
- Operator Isolation: `manualChunks` operator 청크, `check-operator-isolation.mjs`, `dependency-cruiser` 규칙 변경 금지.
- `imperial_*` SECURITY DEFINER 함수 본문 변경 금지.
- 기존 RLS 정책 약화 금지 (강화만 허용).

## Phase 0 — Pre-flight Snapshot

- `scripts/check-operator-isolation.mjs`, money-flow guard 스크립트 dry-run.
- 현재 `pg_publication_tables`, `verify_jwt` 매트릭스, 외부 노출 edge function 목록 스냅샷 → `reports/security-baseline-2026-05-18.json`.

## Phase 1 — Edge Function Hardening (M1 + M2)

대상: 외부 노출되고 user input을 받는 함수만 선별 (money-flow / cron 함수는 제외).

1순위 (zod 입력 검증 + Origin 화이트리스트):
- `sim-api`, `og-card-renderer`, `attribute-click`, `send-push`, `send-email`, `auth-email-hook`, `receipt-ocr`, `webhook-dispatcher` (외부 trigger 한정).

조치:
- `supabase/functions/_shared/validate.ts` 신설: `parseBody(schema, req)` 헬퍼 + 400 표준 응답.
- `supabase/functions/_shared/cors.ts` 신설: `buildCors(origin)` — `https://phonara.world`, `https://www.phonara.world`, `https://*.lovable.app` 만 허용, 외 origin은 `null` 반환 (preflight 403).
- 각 함수 상단에서 zod schema 정의 + `parseBody` 호출. 실패 시 `{ error: "invalid_input", fields }` 반환 (DB raw 노출 금지).
- `verify_jwt`를 켤 수 있는 함수(`receipt-ocr` 등)는 `getClaims` 가드 추가. webhook류는 HMAC 또는 `X-Internal-Secret` + `timingSafeEqual` 비교.
- 요청 로깅: `console.info({ fn, origin, ip: req.headers.get("x-forwarded-for"), trace_id })` 1줄만 (개인정보 X).
- Rate limit: 인프라 미비로 backend rate limit은 추가하지 않음 (no-backend-rate-limiting directive). 대신 zod로 payload size·loop count 상한만 강제.

## Phase 2 — Realtime Surface Reduction (M3)

- `notifications`, `support_messages`, `support_threads` 를 `supabase_realtime` publication에서 **제외**하고, 서버 측에서 `realtime.send(topic := 'user:'||user_id, ...)` 로 owner-scoped broadcast 트리거 작성.
- 클라이언트는 `useRealtimeChannel('user:'+uid, ...)` 구독으로 변경 (래퍼만 손대고 money-flow 8경로 미터치).
- 마이그레이션: `ALTER PUBLICATION supabase_realtime DROP TABLE ...` + 3개 트리거 신설(`AFTER INSERT/UPDATE ... EXECUTE FUNCTION broadcast_to_owner()`).
- 검증: 일반 사용자 토큰으로 다른 user_id 채널 구독 시 0 row 수신.

## Phase 3 — CORS Whitelist (L1)

- Phase 1의 `_shared/cors.ts` 를 **모든 45개 edge function**에 일괄 적용 (money-flow path 함수도 헤더만 교체, 본문 로직 변경 0).
- `Access-Control-Allow-Origin: *` 제거. 화이트리스트 미일치 시 `Vary: Origin` + 403.
- `credentials: true` 는 필요한 함수(인증 cookie 사용)에만 명시.

## Phase 4 — HIBP 활성화 (L2)

- `supabase--configure_auth` 로 `password_hibp_enabled: true` (다른 옵션 동일 유지).
- 기존 사용자에는 영향 없음, 신규 가입/비밀번호 변경 시 차단.

## Phase 5 — SECURITY DEFINER 표면 축소 (L3)

- 즉시 함수 삭제/이동은 위험 → 다음 2단계만 수행:
  1. `function_permissions_baseline` 에서 user-callable allowlist 49개 외 함수의 `EXECUTE` GRANT 를 `authenticated`/`anon` 에서 회수 (`REVOKE EXECUTE ... FROM authenticated, anon`). `service_role` 만 유지.
  2. `check_permission_drift()` 가 신규 함수에 대해 baseline 미등록 시 fail 하도록 강화 + CI `.github/workflows/db-permissions.yml` 에 PR comment.
- `imperial_*` 함수는 baseline에 이미 등록 → 변경 0.

## Phase 6 — Verification Gates

- `npm run build` (Operator Isolation 가드 자동 실행).
- money-flow diff check: `git diff --stat -- supabase/migrations/*imperial_place_phon_bet* ...` = 0.
- 보안 스캔 재실행 → Medium/Low = 0 확인.
- 60초 preview 모니터링: console error = 0, ImperialActivationPanel 정상.

## 기술 메모 (개발자 전용)

- 마이그레이션 파일 1개로 통합: publication 변경 + REVOKE EXECUTE + 3개 broadcast 트리거 + `check_permission_drift` 강화.
- Edge function 변경은 함수당 ≤20 LOC. 비즈니스 로직 미변경.
- `auth-email-hook` 은 Supabase Auth webhook 이므로 `verify_jwt=false` 유지 + HMAC 검증 추가.
- `sim-api` 는 API key 기반 → 기존 `api_keys` 테이블 조회 유지, zod schema 만 추가.

## Roadmap (이번 작업 범위 밖)

- WAF / 인프라 rate limit (Cloudflare 도입 시).
- 4-eyes 출금 승인 워크플로우.
- SOC2 audit trail 외부 export.
