# Phonara Architecture & Naming Standards

## 1. Core principles

- Keep the root app thin and declarative.
- Separate providers, routing, and page composition into dedicated app layers.
- Prefer stable shared contracts over ad-hoc component wiring.
- Tighten naming so every folder communicates its ownership clearly.

## 2. Folder conventions

- `src/app/` : application shell, providers, router, and global composition
- `src/features/` : domain-owned screens, flows, and feature-level state
- `src/shared/` : cross-feature primitives, constants, and reusable utilities
- `src/pages/` : legacy route wrappers only during migration
- `src/components/` : UI atoms/molecules that are still being migrated

## 3. Naming conventions

- Use `camelCase` for functions and variables.
- Use `PascalCase` for React components, types, and route wrappers.
- Use `kebab-case` only for physical asset filenames.
- Use `APP_ROUTES` for shared route definitions.
- Prefer `*.provider.tsx`, `*.router.tsx`, and `*.shell.tsx` for app-layer files.

## 4. Migration targets

- Reduce direct route logic inside `App.tsx`.
- Move provider composition into `src/app/providers.tsx`.
- Move route registration into `src/app/router.tsx`.
- Gradually shift page-level logic into `src/features/*`.

## 5. Quality gates

- Every new file must follow the naming conventions above.
- Every new route must live in a shared route constant.
- Every new provider must be composed through `src/app/providers.tsx`.
- Every build must be verified after architecture changes.
