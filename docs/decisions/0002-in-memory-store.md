# 0002. In-memory store on globalThis with an injected factory

## Context
The statement asks for tickets kept in memory, no database. Next.js runs route handlers and server components in separate module graphs and reloads modules in development, so a module-level `Map` can split or reset.

## Decision
`createTicketStore({ seed, now, newId })` returns an adapter over a `Map` whose methods return `Result` values. Production code gets one seeded instance from `getTicketStore()`, kept on `globalThis` (the same pattern Prisma uses for its client). The tRPC context carries the store, so tests pass a fresh one per test and never touch the singleton.

## Consequences
- RSC prefetches and API calls see the same data; dev reloads don't re-seed or duplicate.
- Clock and ids are injectable, so tests are deterministic.
- Data resets on restart and is not shared across instances or serverless invocations. That is why there is no deploy; swapping in a database means replacing `store.ts` only.
- A cap of 1,000 tickets guards memory (`TICKET_LIMIT_REACHED`).

## Alternatives
- A plain module-level `Map`: breaks across Next's bundles and reloads.
- SQLite or a JSON file: not what the statement asks for.

Sources: research 01, 02.
