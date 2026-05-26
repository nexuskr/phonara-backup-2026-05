# Phonara V2 Cleanup & Migration Plan

## Current state

- The app already has a large React/Vite codebase with many feature-specific components and hooks.
- The root entry currently duplicates `AuthProvider`, which makes the app tree harder to reason about.
- The codebase contains a mix of production UI, experimentation, and feature-specific legacy modules.

## Phase 1 — Stabilize the root app

1. Keep a single `AuthProvider` in `src/main.tsx`.
2. Keep `App.tsx` focused on routing only.
3. Verify build and lint after cleanup.

## Phase 2 — Consolidate the architecture

1. Separate reusable primitives from feature-specific UI.
2. Move shared UX helpers into `src/shared` or `packages/ui`.
3. Keep one source of truth for auth, routing, and toast providers.

## Phase 3 — Remove dead code safely

1. Identify files with no import references.
2. Remove only files that are not used by current routes, hooks, tests, or assets.
3. Keep test fixtures and fallback components until the migration is complete.

## Phase 4 — Monorepo foundation

1. Create `apps/web` and `apps/admin`.
2. Move reusable UI and shared types into `packages/`.
3. Add Supabase schema and Edge Function contracts.

## Phase 5 — Production-grade rebuild

1. Rebuild onboarding, reward loop, viral loops, trading, slots, and admin.
2. Add realtime, RLS, automation, and monitoring.
3. Re-run build, lint, and targeted tests.

## Architecture & naming policy

- Keep the root app shell in `src/app/`.
- Compose providers through `src/app/providers.tsx`.
- Register routes in `src/app/router.tsx`.
- Store cross-feature constants in `src/shared/constants/`.
- Use shared route constants from `src/shared/constants/routes.ts`.
- Add new feature directories under `src/features/` only after the route and provider boundaries are stable.
