# 0001. tRPC through the TanStack React Query integration

## Context
tRPC v11 ships two React integrations. The classic `@trpc/react-query` (`createTRPCReact`) is still what many templates use, including create-t3-app. The tRPC docs now mark it as bug-fix only and slated for removal in the next major version.

## Decision
Use `@trpc/tanstack-react-query`: `createTRPCContext` + `useTRPC` on the client, `createTRPCOptionsProxy` on the server, and plain TanStack Query hooks fed with `queryOptions` / `infiniteQueryOptions` / `mutationOptions`. The glue lives in `src/trpc/` (client, server, query client), as in the official `next-minimal-starter` example.

## Consequences
- Components use standard TanStack Query APIs; nothing tRPC-specific to learn beyond the options proxy.
- Server prefetch and client hooks share query keys, so hydration reuses the server's data.
- No superjson: the only non-JSON value would be a date, and `createdAt` is epoch milliseconds (see 0006).

## Alternatives
- Classic `@trpc/react-query`: works today, deprecated tomorrow.
- REST route handlers + fetch: loses end-to-end types the statement asks to demonstrate.

Sources: tRPC v11 docs (TanStack React Query integration, server components), `examples/next-minimal-starter`; research 01.
