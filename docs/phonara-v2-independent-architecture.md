# Phonara V2 Independent Architecture Blueprint

## Objective

Build an independent, clean, mobile-first platform that removes legacy Lovable and slot-specific surface layers and progresses toward a production-grade architecture.

## Non-negotiables

1. Single source of truth for auth and routing.
2. No user-facing slot/game surface unless explicitly reintroduced in a dedicated feature module.
3. Shared primitives must live in a dedicated shared layer.
4. Feature ownership must stay isolated.
5. Supabase contracts must be explicit, typed, and versioned.
6. Every feature must be operationally controllable by admin tooling.

## Target structure

- apps/web
- apps/admin
- packages/ui
- packages/shared
- packages/analytics
- packages/types
- supabase/migrations
- supabase/functions

## Migration rules

1. Keep only the current route shell and auth shell in the root app during phase 1.
2. Move reusable UI primitives out of `src/components` into `packages/ui` only after they are stable.
3. Move typing and shared business logic into `packages/shared`.
4. Keep feature code under `src/features/*` until the monorepo cutover is complete.
5. Remove any user-facing slot marketing language from root surfaces before expanding new features.

## Feature scope for phase 1

- auth
- onboarding
- reward loop
- live activity feed
- trading shell
- admin shell
- analytics/events

## Platform invariants

- Zero legacy slot UI in the public surface.
- No implicit route aliases for removed features.
- No mixed concerns inside shared UI primitives.
- No direct feature ownership in root app files.
- Every mutation must go through an explicit service boundary.

## Execution order

1. Stabilize root app and route surface.
2. Remove obsolete user-facing gaming references.
3. Create explicit feature boundaries.
4. Introduce shared packages.
5. Migrate auth, reward, social, trading, admin.
6. Add Supabase functions and event pipelines.
7. Rebuild admin and observability.
