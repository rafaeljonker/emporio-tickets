# Research 02 — Project structure validated in real repos

## Recommended tree (single app)
```
src/
  app/
    layout.tsx                 mounts TRPCReactProvider
    page.tsx                   list (or redirect)
    tasks/new/page.tsx         create form
    tasks/[id]/edit/page.tsx   edit form (caller byId, notFound())
    _components/               ticket-list.tsx, ticket-form.tsx (shared)
    api/trpc/[trpc]/route.ts
  server/
    trpc.ts                    initTRPC, context, publicProcedure, createCallerFactory
    root.ts                    appRouter, type AppRouter
    tickets/router.ts          thin procedures; missing → TRPCError NOT_FOUND
    tickets/store.ts           in-memory Map on globalThis; pure, unit-tested
  lib/ticket-schema.ts         shared Zod schemas + inferred types (no server imports)
  trpc/query-client.ts, client.tsx ('use client'), server.tsx ('server-only')
```
Root: README, .github/workflows/ci.yml (pnpm lint/typecheck/test/build), create-next-app configs, `@/*` alias, `src/`.

## Leave out
features/ folder, repository interface/DI, service layer, per-procedure handler/schema files (cal.com scale), t3-env/auth, (optional) superjson — ISO string avoids it.

## Layering evidence
- Tiny examples keep data in router (t3 post/base.ts mock array; trpc next-prisma-starter inline Prisma).
- Production: thin router over query module (midday routers → @midday/db/queries; schemas in apps/api/src/schemas).
- Pick: thin router + store module (logic testable without tRPC).

## Shared schema
`src/lib/*-schema.ts`, imported by router and form (trpc experimental next-app-dir colocates `_data.schema.ts`). Server always validates; client validation = UX.

## globalThis store
t3 `db-prisma.ts` pattern (`globalForX.x ?? create()`). Limits: per-process copy (instances/lambdas diverge), lost on restart, no concurrency control beyond single thread.

## Cursor
- next-prisma-starter: `{limit, cursor: z.string().nullish()}` → `{items, nextCursor}`, fetch limit+1, createdAt desc without tie-breaker + `reverse()` quirk (don't copy).
- Pick: sort (createdAt desc, id desc); cursor = last item's {createdAt,id} (opaque string); compare by key, not findIndex(id) — survives deletion of the cursor item.
- Input field must be named `cursor` for infiniteQueryOptions.

## Evidence
| Repo | Pattern |
|---|---|
| create-t3-app | src/, ~/ alias, server/api/{trpc,root,routers}, trpc/{react,server,query-client}, globalThis Prisma |
| tRPC v11 docs | trpc/{init,routers/_app,query-client,client,server}; server-only + client-only |
| tRPC next-prisma-starter | cursor list + caller test (Pages Router) |
| tRPC next-app-dir (experimental) | app/_components, colocated mock db, _data.schema.ts |
| midday (Next 16, tRPC 11.16) | routers call db/queries; dashboard trpc/server.tsx with server-only + createTRPCOptionsProxy |
| unkey | no src/; lib/trpc/{trpc,context,client,server}, routers/<domain>/ |
| openstatus | src/lib/trpc/{client,server,query-client}; route groups; has ADRs |
| cal.com | per-procedure x.handler/x.schema; app/_trpc private folder |
| documenso | moved to Remix/Hono — not an App Router example |

## Disagreements → picks
1. Classic vs TanStack integration → TanStack.
2. trpc/ only vs server/ + trpc/ → split: backend in server/ (server-only), glue in trpc/.
3. `~/` vs `@/` → `@/` (Next default).
4. src/ or not → src/.
5. ADRs/AGENTS.md → agent suggests a README "Decisions" section only; the project keeps short ADRs as well.
