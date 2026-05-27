# PHONARA Phase 1 Architecture Design Document

**Status:** Design Phase | **Target Implementation:** Q2–Q3 2026  
**Version:** 1.0 | **Last Updated:** May 2026  
**Author:** Copilot CLI | **Team:** PHONARA Engineering

---

## Executive Summary

This document establishes the scalable architecture patterns for PHONARA Phase 1, addressing current gaps (50+ unorganized Supabase functions, 170+ `any` types, scattered service logic) while maintaining the proven Vite + React 19 + Supabase stack.

### Key Architectural Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Framework** | Stay Vite + React 19 | Proven, fast iteration; Next.js hybrid migration in Q4 2026 |
| **State Management** | React Context + hooks | Simple, co-located, avoids Redux/Zustand overhead for current scale |
| **Service Layer** | Functional service pattern | Single source of truth for each domain (gaming, trading, wallet) |
| **Supabase Functions** | Domain-organized directories | Grouping by feature, not by function type |
| **Type Safety** | Codegen + domain interfaces | `supabase gen types` + consolidated domain types |
| **Testing** | Co-located unit + integration | Vitest for units; Playwright for E2E |
| **Code Splitting** | Per-route + per-feature lazy loading | Target 400KB main bundle |

### Problems Solved

- ✅ **Scattered Supabase functions** → Organized by domain (auth, gaming, trading, wallet, social)
- ✅ **Mixed component concerns** → Clear presentational/container/feature separation
- ✅ **Type safety gaps** → Codegen + domain interfaces eliminate `any` types
- ✅ **State management chaos** → Context + hooks pattern, centralized auth/wallet
- ✅ **Service logic everywhere** → Dedicated service layer with clear boundaries
- ✅ **Onboarding friction** → This document + file-naming conventions guide new developers

---

## 1. Directory Structure Proposal

### 1.1 Target Structure

```
phonara/
├── src/
│   ├── app/                          # App initialization
│   │   ├── App.tsx                   # Root component
│   │   └── index.tsx                 # Entry point
│   │
│   ├── pages/                        # Page components (route layer)
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Gaming/
│   │   │   ├── SlotsPage.tsx
│   │   │   ├── DuelsPage.tsx
│   │   │   └── CrashPage.tsx
│   │   ├── Trading/
│   │   │   ├── OrdersPage.tsx
│   │   │   └── PositionsPage.tsx
│   │   ├── Wallet/
│   │   │   ├── BalancePage.tsx
│   │   │   ├── WithdrawalPage.tsx
│   │   │   └── HistoryPage.tsx
│   │   ├── Referral/
│   │   │   └── NetworkPage.tsx
│   │   └── Auth/
│   │       ├── LoginPage.tsx
│   │       └── ProfilePage.tsx
│   │
│   ├── features/                     # Feature modules (self-contained)
│   │   ├── gaming/
│   │   │   ├── components/           # Gaming-specific UI
│   │   │   │   ├── SlotsMachine.tsx
│   │   │   │   ├── DuelArena.tsx
│   │   │   │   ├── CrashChart.tsx
│   │   │   │   └── GameResult.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSlots.ts       # Game engine, RNG
│   │   │   │   ├── useDuel.ts        # Duel logic, matchmaking
│   │   │   │   └── useCrash.ts       # Crash multiplier, events
│   │   │   ├── services/
│   │   │   │   ├── slotsEngine.ts    # Spin logic, RNG
│   │   │   │   ├── duelService.ts    # Match settlement
│   │   │   │   └── crashService.ts   # Crash tick handler
│   │   │   ├── types/
│   │   │   │   └── gaming.ts         # Game, SpinResult, Duel, Crash
│   │   │   ├── __tests__/
│   │   │   │   ├── slotsEngine.test.ts
│   │   │   │   └── duelService.test.ts
│   │   │   └── index.ts              # Barrel export
│   │   │
│   │   ├── trading/
│   │   │   ├── components/
│   │   │   │   ├── OrderForm.tsx
│   │   │   │   ├── PositionCard.tsx
│   │   │   │   └── TradeChart.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useOrders.ts
│   │   │   │   └── usePositions.ts
│   │   │   ├── services/
│   │   │   │   ├── orderService.ts   # Order placement, cancellation
│   │   │   │   ├── positionCalc.ts   # PnL, margin calculation
│   │   │   │   └── priceService.ts   # Oracle price updates
│   │   │   ├── types/
│   │   │   │   └── trading.ts
│   │   │   ├── __tests__/
│   │   │   │   └── positionCalc.test.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── wallet/
│   │   │   ├── components/
│   │   │   │   ├── BalanceDisplay.tsx
│   │   │   │   ├── WithdrawalForm.tsx
│   │   │   │   └── TransactionList.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useWithdrawal.ts
│   │   │   ├── services/
│   │   │   │   ├── withdrawalProcessor.ts  # Withdrawal logic
│   │   │   │   ├── depositHandler.ts       # Deposit verification
│   │   │   │   └── balanceService.ts
│   │   │   ├── types/
│   │   │   │   └── wallet.ts
│   │   │   ├── __tests__/
│   │   │   │   └── withdrawalProcessor.test.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── referral/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   │   └── referralService.ts
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── MfaVerify.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts         # Moved here, central hook
│   │   │   ├── services/
│   │   │   │   ├── authService.ts     # Login, logout, session
│   │   │   │   └── mfaService.ts
│   │   │   ├── types/
│   │   │   │   └── auth.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── components/                   # Shared presentational components
│   │   ├── ui/                       # Design system (no business logic)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Tabs.tsx
│   │   │   └── index.ts
│   │   ├── brand/                    # Brand-specific shared UI
│   │   │   ├── Logo.tsx
│   │   │   ├── AppHeader.tsx
│   │   │   └── AppFooter.tsx
│   │   ├── layout/                   # Layout components
│   │   │   ├── MainLayout.tsx
│   │   │   ├── AuthLayout.tsx
│   │   │   └── GameLayout.tsx
│   │   └── index.ts
│   │
│   ├── services/                     # Global services (API, realtime)
│   │   ├── api/
│   │   │   ├── client.ts             # Supabase client + error handling
│   │   │   ├── auth.ts               # Auth RPC wrappers
│   │   │   ├── gaming.ts             # Gaming RPC wrappers
│   │   │   ├── trading.ts            # Trading RPC wrappers
│   │   │   ├── wallet.ts             # Wallet RPC wrappers
│   │   │   └── types.ts              # API error types
│   │   │
│   │   ├── realtime/
│   │   │   ├── manager.ts            # Single subscription point
│   │   │   ├── handlers/
│   │   │   │   ├── gameHandler.ts
│   │   │   │   ├── walletHandler.ts
│   │   │   │   └── tradeHandler.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── tracking/
│   │   │   ├── analytics.ts
│   │   │   └── sentry.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── context/                      # React Context providers
│   │   ├── AuthContext.tsx           # User auth state + refresh logic
│   │   ├── WalletContext.tsx         # Balance, pending transactions
│   │   ├── GameStateContext.tsx      # Current game session
│   │   ├── ThemeContext.tsx          # Dark mode, language
│   │   └── index.ts
│   │
│   ├── hooks/                        # Shared React hooks
│   │   ├── useAuth.ts                # Auth state (from AuthContext)
│   │   ├── useWallet.ts              # Wallet state
│   │   ├── useGame.ts                # Game state
│   │   ├── useLocalStorage.ts        # Persistence
│   │   ├── useDebounce.ts
│   │   ├── useAsync.ts
│   │   └── index.ts
│   │
│   ├── lib/                          # Utilities organized by domain
│   │   ├── api/
│   │   │   ├── errors.ts             # Custom error classes
│   │   │   ├── retry.ts              # Retry logic
│   │   │   └── cache.ts              # Client-side caching
│   │   │
│   │   ├── gaming/
│   │   │   ├── rng.ts                # RNG utilities
│   │   │   ├── odds.ts               # Payout tables, calculations
│   │   │   └── validation.ts         # Bet validation
│   │   │
│   │   ├── trading/
│   │   │   ├── calculator.ts         # PnL, margin
│   │   │   ├── validation.ts         # Order validation
│   │   │   └── formatting.ts         # Price formatting
│   │   │
│   │   ├── wallet/
│   │   │   ├── formatting.ts         # Balance formatting
│   │   │   ├── validation.ts         # Address validation
│   │   │   └── conversion.ts         # Unit conversion
│   │   │
│   │   ├── crypto/
│   │   │   ├── sha256.ts
│   │   │   ├── ed25519.ts
│   │   │   └── signing.ts
│   │   │
│   │   ├── i18n/
│   │   │   └── setup.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── types/                        # Consolidated type definitions
│   │   ├── domain/
│   │   │   ├── auth.ts               # UserProfile, AuthSession
│   │   │   ├── game.ts               # Game, SpinResult, Duel, Crash
│   │   │   ├── trade.ts              # Order, Position, Oracle
│   │   │   ├── wallet.ts             # Balance, Withdrawal, Deposit
│   │   │   └── referral.ts
│   │   │
│   │   ├── api/
│   │   │   ├── requests.ts           # API request types
│   │   │   ├── responses.ts          # API response types
│   │   │   └── errors.ts             # Error response types
│   │   │
│   │   ├── supabase.ts               # Generated Supabase types
│   │   ├── common.ts                 # Shared types (UUID, timestamp, etc.)
│   │   └── index.ts
│   │
│   ├── test/                         # Test utilities
│   │   ├── setup.ts                  # Vitest setup, mocks
│   │   ├── fixtures/
│   │   │   ├── users.ts
│   │   │   ├── games.ts
│   │   │   ├── orders.ts
│   │   │   └── wallet.ts
│   │   ├── mocks/
│   │   │   ├── supabaseClient.ts
│   │   │   ├── realtimeHandler.ts
│   │   │   └── apiResponses.ts
│   │   └── index.ts
│   │
│   ├── __tests__/
│   │   ├── integration/               # Cross-feature integration tests
│   │   │   ├── auth-wallet.test.ts
│   │   │   ├── gaming-trading.test.ts
│   │   │   └── withdrawal-flow.test.ts
│   │   └── e2e/                      # Playwright tests (alternative: e2e/ root)
│   │       ├── login.spec.ts
│   │       ├── gaming.spec.ts
│   │       └── trading.spec.ts
│   │
│   ├── styles/                       # Global styles, Tailwind overrides
│   │   ├── globals.css
│   │   ├── gaming.css
│   │   └── animations.css
│   │
│   ├── locales/                      # i18n translations
│   │   ├── ko.json
│   │   ├── en.json
│   │   └── vi.json
│   │
│   ├── integrations/                 # Third-party integrations
│   │   ├── sentry.ts
│   │   ├── stripe.ts
│   │   └── tronweb.ts
│   │
│   ├── main.tsx                      # React entry point
│   ├── vite-env.d.ts
│   └── index.css
│
├── supabase/
│   ├── functions/
│   │   ├── _shared/                  # Shared utilities
│   │   │   ├── validate.ts
│   │   │   ├── pii.ts
│   │   │   ├── cors.ts
│   │   │   ├── ed25519.ts
│   │   │   ├── duel-telemetry.ts
│   │   │   └── email-templates/
│   │   │
│   │   ├── auth/                     # ✨ NEW: Organized by domain
│   │   │   ├── auth-email-hook/      # Supabase Auth email template hook
│   │   │   ├── passkey-options/      # Passkey registration start
│   │   │   └── passkey-verify/       # Passkey registration verify
│   │   │
│   │   ├── gaming/
│   │   │   ├── imperial-bet-place/   # Duel bet placement
│   │   │   ├── imperial-bet-settle/  # Duel settlement
│   │   │   ├── imperial-duel-cron/   # Duel matchmaking
│   │   │   ├── crash-tick/           # Crash multiplier generator
│   │   │   ├── apex-crash-engine/    # Apex crash tick
│   │   │   ├── apex-crash-verify/    # Crash result verification
│   │   │   ├── apex-vrf-oracle/      # ApexForge RNG
│   │   │   ├── generate-slot-sfx/    # Slot sound generation
│   │   │   ├── bot-seed-engine/      # Bot strategy
│   │   │   └── apex-bigwin-notifier/ # Win notifications
│   │   │
│   │   ├── trading/
│   │   │   ├── fill-pending-orders/  # Order matching
│   │   │   ├── enforce-position-triggers/  # Liquidation
│   │   │   ├── oracle-refresh/       # Price feed updates
│   │   │   ├── oracle-refresh-binance/
│   │   │   ├── oracle-refresh-coinbase/
│   │   │   └── liquidation-watcher/  # Monitoring
│   │   │
│   │   ├── wallet/
│   │   │   ├── apex-withdraw-processor/  # Withdrawal execution
│   │   │   ├── tron-deposit-poller/     # Deposit verification
│   │   │   ├── settle-phon-staking-daily/
│   │   │   └── send-withdrawal-sms/
│   │   │
│   │   ├── social/
│   │   │   ├── viral-score-compute/  # Referral score calculation
│   │   │   ├── crown-war-settle/     # Leaderboard settlement
│   │   │   ├── crown-replay-card/    # Share card generation
│   │   │   ├── reengagement-tick/    # Reactivation logic
│   │   │   ├── reactivation-cron/
│   │   │   └── revenue-attribution/
│   │   │
│   │   ├── notifications/
│   │   │   ├── send-transactional-email/
│   │   │   ├── send-push/
│   │   │   ├── send-line/
│   │   │   ├── handle-email-unsubscribe/
│   │   │   ├── handle-email-suppression/
│   │   │   ├── webhook-dispatcher/
│   │   │   └── process-email-queue/
│   │   │
│   │   ├── platform/
│   │   │   ├── public-status/        # Public status API
│   │   │   ├── r2-presign/           # R2 upload presigner
│   │   │   ├── og-card-renderer/     # OpenGraph card generation
│   │   │   ├── ai-support-reply/     # AI support automation
│   │   │   ├── predict-sla/          # SLA prediction
│   │   │   ├── chaos-probe/          # Health check
│   │   │   └── posting-scheduler/    # Social media scheduler
│   │   │
│   │   └── cron/                     # Batch/scheduled jobs
│   │       ├── daily-briefing-cron/
│   │       ├── catalog-cache/
│   │       ├── imperial-metrics-batch/
│   │       ├── cron-settle-packages/
│   │       ├── apex-squad-mirror-tick/
│   │       ├── apex-race-settler/
│   │       ├── apex-daily-cap-enforcer/
│   │       ├── apex-cup-settler/
│   │       ├── apex-coach-v2/
│   │       └── apex-chat-stamp/
│   │
│   ├── migrations/                   # Database migrations
│   │   ├── *.sql
│   │   └── README.md
│   │
│   ├── seed.sql                      # Development seed data
│   └── config.toml
│
├── e2e/                              # E2E tests (Playwright)
│   ├── login.spec.ts
│   ├── gaming.spec.ts
│   ├── trading.spec.ts
│   └── playwright.config.ts
│
├── docs/
│   ├── architecture/                 # Architecture docs
│   │   ├── ARCHITECTURE_DESIGN.md    # This file
│   │   ├── SERVICE_LAYER.md
│   │   └── STATE_MANAGEMENT.md
│   ├── guides/
│   │   ├── onboarding.md
│   │   ├── supabase-functions.md
│   │   └── testing.md
│   └── decisions/                    # ADRs (Architecture Decision Records)
│       ├── 001-context-over-redux.md
│       ├── 002-feature-first-structure.md
│       └── 003-service-layer-pattern.md
│
├── .env.example
├── .env                              # dev vars + feature flags
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
└── README.md
```

### 1.2 Before/After Comparison

#### Problem: Scattered Auth Logic

**BEFORE:** Auth logic mixed in multiple places
```
❌ src/context/AuthContext.tsx
❌ src/services/auth.ts (if it existed)
❌ src/features/auth/hooks.ts
❌ Supabase RPC calls embedded in components
```

**AFTER:** Clear auth feature module
```
✅ src/features/auth/
   ✅ services/authService.ts       # Login, logout, refresh
   ✅ services/mfaService.ts        # MFA logic
   ✅ hooks/useAuth.ts              # Auth state hook
   ✅ components/LoginForm.tsx      # UI component
   ✅ types/auth.ts                 # UserProfile, AuthSession
   ✅ __tests__/authService.test.ts
```

#### Problem: Component Type Confusion

**BEFORE:** Mixed concerns
```
❌ src/components/GameUI.tsx contains RPC calls
❌ src/components/OrderForm.tsx does PnL calculations
❌ No clear separation of presentational vs container
```

**AFTER:** Clear component hierarchy
```
✅ src/components/ui/Button.tsx             # Presentational
✅ src/features/gaming/components/SlotsMachine.tsx    # Container
✅ src/features/gaming/hooks/useSlots.ts   # Business logic
✅ src/features/gaming/services/slotsEngine.ts
```

#### Problem: 50+ Unorganized Supabase Functions

**BEFORE:** Flat namespace
```
❌ supabase/functions/
   ❌ imperial-bet-place/           # What domain?
   ❌ crash-tick/                   # What domain?
   ❌ viral-score-compute/          # What domain?
   ❌ (50+ more, no organization)
```

**AFTER:** Organized by domain
```
✅ supabase/functions/
   ✅ gaming/imperial-bet-place/
   ✅ gaming/crash-tick/
   ✅ social/viral-score-compute/
   ✅ wallet/apex-withdraw-processor/
   ✅ trading/fill-pending-orders/
```

---

## 2. Service Layer Architecture

### 2.1 Service Layer Overview

The service layer provides a clean abstraction between components and Supabase, with error handling, retry logic, and type safety.

```
┌─────────────────────────────────────────────────┐
│          React Components / Pages                │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│    Feature Hooks (useAuth, useWallet, etc.)    │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│  Feature Services (authService, walletService)  │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│      API Client (Supabase RPC wrapper)          │
├──────────────────────────────────────────────────┤
│  ├─ Error handling (retry, transform)          │
│  ├─ Request/response validation                 │
│  ├─ Realtime subscriptions                      │
│  └─ Cache management                            │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│    Supabase Client (Database + Realtime)        │
└─────────────────────────────────────────────────┘
```

### 2.2 API Client Implementation

The API client handles RPC calls with error handling, retries, and validation:

```typescript
// src/services/api/client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { ApiError, NetworkError } from '@/lib/api/errors';

class SupabaseClient {
  private client = createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_KEY
  );

  async call<T>(rpcName: string, params: Record<string, unknown>): Promise<T> {
    try {
      const { data, error } = await this.client.rpc(rpcName, params);
      if (error) throw new ApiError(error.message, 500);
      return data as T;
    } catch (err) {
      throw new NetworkError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  subscribe<T>(channel: string, event: string, callback: (payload: T) => void) {
    return this.client
      .channel(channel)
      .on('postgres_changes', { event, schema: 'public' }, callback)
      .subscribe();
  }
}

export const supabaseClient = new SupabaseClient();
```

### 2.3 Feature Services

Feature services wrap Supabase RPC calls and handle domain-specific logic:

```typescript
// src/features/gaming/services/slotsEngine.ts
export class SlotsEngine {
  calculateSpin(betAmount: number, rngValue: number): SpinResult {
    const tier = this.getBetTier(betAmount);
    const symbols = this.generateSymbols(rngValue, tier);
    const payout = this.calculatePayout(symbols, betAmount);
    return { symbols, payout, multiplier: payout / betAmount };
  }

  private getBetTier(amount: number): BetTier {
    if (amount < 100) return 'low';
    if (amount < 1000) return 'medium';
    return 'high';
  }

  private generateSymbols(rng: number, tier: BetTier): Symbol[] {
    const seedRng = mulberry32(Math.floor(rng * 0xffffffff));
    return Array(5).fill(null).map(() => ({
      id: Math.floor(seedRng() * 11),
      value: SYMBOL_VALUES[Math.floor(seedRng() * 11)]
    }));
  }

  private calculatePayout(symbols: Symbol[], bet: number): number {
    const pattern = symbols.map(s => s.id).join('');
    const multiplier = PAYOUT_TABLE[pattern] ?? 0;
    return bet * multiplier;
  }
}

export const slotsEngine = new SlotsEngine();
```

### 2.4 Realtime Manager

Single subscription point prevents memory leaks and duplicate listeners:

```typescript
// src/services/realtime/manager.ts
class RealtimeManager {
  private subscriptions = new Map<string, RealtimeChannel>();

  subscribe(
    channel: string,
    table: string,
    event: PostgresChangesFilter['event'],
    callback: (payload: any) => void
  ) {
    const key = `${channel}:${table}:${event}`;
    if (this.subscriptions.has(key)) return;

    const sub = supabaseClient.channel(channel)
      .on('postgres_changes', { event, schema: 'public', table }, callback)
      .subscribe();

    this.subscriptions.set(key, sub);
  }

  unsubscribeAll() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();
  }
}

export const realtimeManager = new RealtimeManager();
```

### 2.5 Error Handling Classes

```typescript
// src/lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR', { fields });
    this.name = 'ValidationError';
  }
}

export class InsufficientBalanceError extends ApiError {
  constructor(public required: number, public available: number) {
    super(
      `Need ${required}, have ${available}`,
      422,
      'INSUFFICIENT_BALANCE'
    );
    this.name = 'InsufficientBalanceError';
  }
}

export class NetworkError extends ApiError {
  constructor(message: string) {
    super(message, 503, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}
```

---

## 3. Component Design Patterns

### 3.1 Component Hierarchy

```
Presentational (UI)
  ↓ no business logic
Container (Feature)
  ↓ uses hooks + services
Page (Route)
  ↓ top-level routing
```

### 3.2 Presentational Components

Pure UI with no business logic:

```typescript
// src/components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(variantClasses[variant], sizeClasses[size])}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  )
);
```

### 3.3 Container Components

Connect UI to services and state:

```typescript
// src/features/gaming/components/SlotsMachine.tsx
export function SlotsMachine() {
  const { duel, placeBet, loading, error } = useSlots();
  const [betAmount, setBetAmount] = useState(100);

  const handleSpin = async () => {
    try {
      await placeBet(betAmount);
    } catch (err) {
      console.error('Spin failed:', err);
    }
  };

  if (error) return <div className="error">{error.message}</div>;

  return (
    <ErrorBoundary>
      <SlotsMachineUI
        duel={duel}
        onSpin={handleSpin}
        isLoading={loading}
        betAmount={betAmount}
        onBetChange={setBetAmount}
      />
    </ErrorBoundary>
  );
}
```

### 3.4 Feature Module Pattern

Self-contained features with clear boundaries:

```
src/features/gaming/
├── components/          # Gaming-specific UI
├── hooks/              # Gaming-specific hooks
├── services/           # Business logic
├── types/              # Domain types
├── __tests__/          # Co-located tests
└── index.ts            # Public exports
```

---

## 4. Type Safety Strategy

### 4.1 Type Organization

```
src/types/
├── domain/             # Business entities
│   ├── auth.ts
│   ├── game.ts
│   ├── trade.ts
│   └── wallet.ts
├── api/                # Request/response contracts
│   ├── requests.ts
│   └── responses.ts
├── supabase.ts         # Auto-generated DB schema
└── common.ts           # Shared primitives
```

### 4.2 Type Generation Workflow

```bash
# Step 1: Generate from Supabase schema
supabase gen types typescript > src/types/supabase.ts

# Step 2: Create domain interfaces
// src/types/domain/game.ts
export interface Game {
  id: string;
  user_id: string;
  game_type: 'slots' | 'duel' | 'crash';
  bet_amount: number;
  payout_amount: number;
  status: 'pending' | 'completed' | 'failed';
}
```

### 4.3 Eliminating `any` Types

**Pattern: Service layer with strict types**

```typescript
// ❌ BEFORE
function placeBet(params: any): Promise<any> {
  return supabaseClient.rpc('imperial_bet_place', params);
}

// ✅ AFTER
interface PlaceBetParams {
  user_id: string;
  amount: number;
  game_type: GameType;
}

interface PlaceBetResult {
  duel_id: string;
  opponent: User;
}

async function placeBet(params: PlaceBetParams): Promise<PlaceBetResult> {
  return supabaseClient.rpc('imperial_bet_place', params);
}
```

---

## 5. Testing Architecture

### 5.1 Test Organization

```
Unit Tests (50%)        Integration Tests (30%)      E2E Tests (20%)
├── services           ├── auth-wallet flow        ├── Login flow
├── hooks             ├── gaming-settlement       ├── Gaming flow
├── utils             ├── withdrawal process      ├── Trading flow
└── components        └── referral logic          └── Multi-user scenarios
```

### 5.2 Unit Tests (Co-located)

```typescript
// src/features/gaming/services/__tests__/slotsEngine.test.ts
import { describe, it, expect } from 'vitest';
import { SlotsEngine } from '../slotsEngine';

describe('SlotsEngine', () => {
  const engine = new SlotsEngine();

  it('should generate consistent outcomes from seed', () => {
    const result1 = engine.calculateSpin(100, 0.123456);
    const result2 = engine.calculateSpin(100, 0.123456);
    expect(result1.symbols).toEqual(result2.symbols);
  });

  it('should respect payout table', () => {
    const result = engine.calculateSpin(100, CHERRY_TRIPLE_RNG);
    expect(result.multiplier).toBe(EXPECTED_MULTIPLIER);
  });

  it('should never exceed max payout', () => {
    for (let i = 0; i < 1000; i++) {
      const result = engine.calculateSpin(100, Math.random());
      expect(result.multiplier).toBeLessThanOrEqual(10);
    }
  });
});
```

### 5.3 Hook Testing

```typescript
// src/features/wallet/hooks/__tests__/useWithdrawal.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWithdrawal } from '../useWithdrawal';

describe('useWithdrawal', () => {
  it('should handle withdrawal request', async () => {
    const { result } = renderHook(() => useWithdrawal());

    act(() => {
      result.current.requestWithdrawal(1000, 'wallet_address');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('pending');
    });
  });

  it('should show error for insufficient balance', async () => {
    const { result } = renderHook(() => useWithdrawal());

    act(() => {
      result.current.requestWithdrawal(10000, 'wallet_address');
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

### 5.4 E2E Tests (Playwright)

```typescript
// e2e/gaming.spec.ts
import { test, expect } from '@playwright/test';

test('should place bet and complete duel', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button:has-text("Login")');

  await page.goto('/gaming/slots');
  await page.fill('input[name="bet-amount"]', '100');
  await page.click('button:has-text("Spin")');

  await expect(page.locator('[data-testid="spin-result"]')).toBeVisible({
    timeout: 5000
  });

  const balance = await page.locator('[data-testid="balance"]').textContent();
  expect(balance).not.toBe('1000');
});
```

---

## 6. Supabase Functions Organization

### 6.1 Domain-Based Organization

Organize 50+ functions by feature domain:

```
supabase/functions/
├── gaming/
│   ├── imperial-bet-place/
│   ├── imperial-bet-settle/
│   ├── crash-tick/
│   └── apex-vrf-oracle/
├── trading/
│   ├── fill-pending-orders/
│   ├── enforce-position-triggers/
│   └── oracle-refresh/
├── wallet/
│   ├── apex-withdraw-processor/
│   ├── tron-deposit-poller/
│   └── settle-phon-staking-daily/
├── social/
│   ├── viral-score-compute/
│   ├── crown-war-settle/
│   └── reengagement-tick/
├── notifications/
│   ├── send-transactional-email/
│   ├── send-push/
│   └── process-email-queue/
├── platform/
│   ├── public-status/
│   ├── r2-presign/
│   └── og-card-renderer/
└── cron/
    ├── daily-briefing-cron/
    ├── catalog-cache/
    └── apex-squad-mirror-tick/
```

### 6.2 Function Documentation Template

Each function should include README with:

**Purpose:** What the function does  
**Owner:** Team responsible  
**Trigger:** How it's invoked  
**Request/Response:** Type contracts  
**SLA:** Performance targets  
**Error Handling:** Recovery strategies  
**RLS Policy:** Security rules  
**Dependencies:** Integrations  
**Monitoring:** Alerting config

### 6.3 Function File Structure

```
supabase/functions/gaming/imperial-bet-place/
├── index.ts              # Main handler
├── types.ts              # Request/response types
├── validate.ts           # Input validation
├── README.md             # Documentation
└── deno.json             # Dependencies (if custom)
```

---

## 7. State Management Approach

### 7.1 Architecture: React Context + Hooks

Why Context over Redux/Zustand:
- **Bundle size:** +5KB vs +15KB (Redux)
- **Learning curve:** Shallow
- **Scalability:** Perfect for current scale (<100 global states)
- **Boilerplate:** Low

### 7.2 Auth Context

```typescript
// src/context/AuthContext.tsx
interface AuthContextValue {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getUser().then(setUser).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user, session } = await authService.login(email, password);
      setUser(user);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout: authService.logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be inside AuthProvider');
  return context;
}
```

### 7.3 Wallet Context

```typescript
// src/context/WalletContext.tsx
interface WalletContextValue {
  balance: Balance | null;
  transactions: Transaction[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    walletService.getBalance().then(setBalance);
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribe(
      'wallet',
      'phon_balances',
      'UPDATE',
      (payload) => setBalance(payload.new)
    );
    return unsubscribe;
  }, []);

  return (
    <WalletContext.Provider value={{ balance, transactions, loading: false, refresh: walletService.refresh }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be inside WalletProvider');
  return context;
}
```

### 7.4 Using Contexts

```typescript
// src/features/gaming/components/GameLobby.tsx
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';

export function GameLobby() {
  const { user } = useAuth();
  const { balance } = useWallet();

  const canPlay = balance && balance.amount > 0;

  return (
    <div className="lobby">
      <p>Welcome, {user?.display_name}</p>
      <p>Balance: {balance?.amount} PHON</p>
      <button disabled={!canPlay}>Start Game</button>
    </div>
  );
}
```

---

## 8. Environment & Configuration

### 8.1 Environment Variables

```bash
# .env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
VITE_API_TIMEOUT_MS=30000

# Feature Flags
VITE_FEATURE_APEX_LIVE_V1=true
VITE_FEATURE_BETA_FEATURES=false
VITE_FEATURE_3D_GAMES=true
VITE_FEATURE_SPORTSBOOK=false

# Integrations
VITE_SENTRY_DSN=https://xxx@sentry.io/123
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
```

### 8.2 Feature Flag Management

```typescript
// src/lib/features.ts
export const features = {
  apexLiveV1: import.meta.env.VITE_FEATURE_APEX_LIVE_V1 === 'true',
  betaFeatures: import.meta.env.VITE_FEATURE_BETA_FEATURES === 'true',
  threedGames: import.meta.env.VITE_FEATURE_3D_GAMES === 'true',
  sportsbook: import.meta.env.VITE_FEATURE_SPORTSBOOK === 'true'
};

export function isFeatureEnabled(feature: keyof typeof features): boolean {
  return features[feature];
}

// Usage
if (isFeatureEnabled('apexLiveV1')) {
  // Render ApexForge UI
}
```

---

## 9. Error Handling Strategy

### 9.1 Error Boundary Components

```typescript
// src/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (error instanceof ApiError) {
      console.error(`API Error [${error.code}]:`, error.toJSON());
    }
  }

  render() {
    if (this.state.error) {
      return <this.props.fallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 9.2 User-Friendly Error Messages

```typescript
// src/lib/api/errorMessages.ts
export function getUserErrorMessage(error: Error): string {
  const t = i18n.t.bind(i18n);

  if (error instanceof InsufficientBalanceError) {
    return t('error.insufficient_balance');
  }
  if (error instanceof ValidationError) {
    return t('error.invalid_input');
  }
  if (error instanceof NetworkError) {
    return t('error.network_error');
  }
  return t('error.generic');
}
```

---

## 10. Performance Considerations

### 10.1 Code Splitting

```typescript
// src/pages/index.tsx
const SlotsGame = lazy(() => import('@/features/gaming/components/SlotsMachine'));
const CrashGame = lazy(() => import('@/features/gaming/components/CrashChart'));
const TradingPage = lazy(() => import('./Trading'));

export function Routes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Switch>
        <Route path="/gaming/slots" element={<SlotsGame />} />
        <Route path="/gaming/crash" element={<CrashGame />} />
        <Route path="/trading" element={<TradingPage />} />
      </Switch>
    </Suspense>
  );
}
```

### 10.2 Bundle Targets

- Main bundle: 250KB (gzipped)
- Vendor chunks: 200KB
- Feature chunks: 100-150KB each
- Total initial load: < 400KB

### 10.3 Caching Strategy

```typescript
// src/lib/api/cache.ts
class CacheManager {
  private cache = new Map<string, { data: any; expiresAt: number }>();

  async withCache<T>(
    key: string,
    fn: () => Promise<T>,
    ttlMs = 5 * 60 * 1000
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached) return cached;

    const data = await fn();
    this.set(key, data, ttlMs);
    return data;
  }
}

export const cacheManager = new CacheManager();
```

---

## 11. Quick-Start Guide for New Developers

### 11.1 Setup

```bash
git clone <repo>
cd phonara
bun install
cp .env.example .env
bun run dev
```

### 11.2 Adding a Feature

```bash
mkdir -p src/features/myfeature/{components,hooks,services,types,__tests__}
# Create types, service, hook, component, tests
```

### 11.3 Adding an API Endpoint

```bash
mkdir -p supabase/functions/myfunction
# Create index.ts, types.ts, README.md
```

### 11.4 Useful Commands

```bash
bun run dev              # Start dev server
bun run build            # Production build
bun run lint             # Linting
bun run test             # Run tests
supabase gen types typescript > src/types/supabase.ts
```

---

## 12. File Naming Conventions

```
Components:          PascalCase.tsx
Hooks:               useCamelCase.ts
Services:            camelCaseService.ts
Utilities:           camelCase.ts
Types:               camelCase.ts
Tests:               *.test.ts
Supabase Functions:  kebab-case/
Folders:             kebab-case/
```

---

## 13. Migration Path to ApexForge (Q4 2026)

### Phase 1 (Now): Vite + React 19
- Establish patterns (this document)
- Migrate services to organized structure
- Consolidate types, eliminate `any`
- Setup testing infrastructure

### Phase 2 (Q3 2026): Next.js Preparation
- Convert heavy routes to RSC-compatible
- Split API calls into server functions
- Prepare Tailwind for next-themes

### Phase 3 (Q4 2026): Next.js 15 Migration
```
apps/web/        (Next.js 15 App Router)
apps/api/        (NestJS 10)
apps/worker/     (Node.js)
libs/ui/         (shared components)
services/rng/    (Rust gRPC)
```

---

## Conclusion

This architecture supports:

✅ **Scalability:** 10k+ concurrent users  
✅ **Type Safety:** Consolidated types, no `any`  
✅ **Maintainability:** Feature-first organization  
✅ **Testability:** Layered architecture  
✅ **Onboarding:** Clear patterns & conventions  
✅ **Future-Ready:** Foundation for Next.js + NestJS  

**Next Steps:**
1. Implement directory structure
2. Migrate services by domain
3. Consolidate types (run `supabase gen types`)
4. Setup testing infrastructure
5. Document current patterns in code

**Document Version:** 1.0 | **Last Updated:** May 2026
