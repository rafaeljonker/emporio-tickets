# AGENTS.md

## Overview
Empório Tickets: the support team's ticket board for a music store. When the store's AI agent can't finish with a customer, it hands a ticket to a person. Next.js 15 App Router + tRPC v11 over an in-memory store.
Design: [docs/superpowers/specs/2026-11-07-emporio-tickets-design.md](docs/superpowers/specs/2026-11-07-emporio-tickets-design.md). Plan: [docs/superpowers/plans/2026-11-07-emporio-tickets.md](docs/superpowers/plans/2026-11-07-emporio-tickets.md).

## Commands
- `pnpm i` then `pnpm dev` (http://localhost:3000).
- `pnpm check`: route types, lint, typecheck, unit and integration tests. Green before every commit, except the `(red)` half of a TDD pair.
- `pnpm test` / `pnpm test:watch`: Vitest (`node` project for `*.test.ts`, `jsdom` for `*.test.tsx`).
- `pnpm test:e2e`: Playwright against `pnpm build && pnpm start`.
- `pnpm build`, `pnpm start`.

## Structure
| Folder | Holds | May import |
|---|---|---|
| `src/domain/` | pure rules: schemas, limits, keyset pagination, error codes | `zod`, `@/shared` only |
| `src/shared/` | cross-cutting types (`Result`) | nothing app-specific |
| `src/server/` | the backend: in-memory store, tRPC router, HTTP handler; every module imports `server-only` | domain, shared |
| `src/trpc/` | tRPC client and RSC glue | server types, domain |
| `src/client/` | UI by domain and use case; `client/shared` has the design system and `toUserMessage` | domain, shared, trpc; never `@/server` |
| `src/app/` | routes only, thin | everything |
| `src/test-support/` | test-only factories and render helpers | everything |

ESLint enforces the import column. Tests in `__tests__/` are exempt.

## UI rules
- View-model pattern: a use-case component makes exactly one hook call, its sibling `use{ComponentName}`, destructures the result and renders. No `useState`, `useEffect`, data or router hooks in component bodies. Presentational pieces in `client/<domain>/ui` have no hooks.
- `'use client'` only on files a Server Component imports (`TicketList.tsx`, `TicketForm.tsx`, `NewTicketButton.tsx`, `trpc/client.tsx`), on `app/error.tsx` and `app/global-error.tsx`, and in shadcn primitives that ship it.
- Copy: sentence case, short, blame-free, no em dashes, no emoji (the takeover easter egg is the one exception). Dates only through `formatTicketDate`.

## TDD
Red, green, refactor. Each behavior is a pair of commits: `test(<scope>): <behavior> (red)` then `feat(<scope>): <behavior>`.

## Commits and PRs
- Conventional Commits; scopes `tickets`, `ui`, `repo`, `ci`, `docs`, `e2e`. Subject at most 72 chars.
- AI-assisted commits carry the `Co-Authored-By` trailer.
- One branch per milestone, PR to `main`, merge commit, no squash. Never force-push, never rewrite `main`.

## Secrets
None are needed. Never commit `.env` files or keys.

## Language
English for code, copy, commits and docs.
