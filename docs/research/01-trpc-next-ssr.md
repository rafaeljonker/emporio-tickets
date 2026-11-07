# Research 01 — tRPC v11 + Next.js 15 App Router (SSR + hydration)

Sources: trpc/trpc @ 83aafd7 (2026-11-07, @trpc/server 11.25.0) — www/v11/docs/client/nextjs/app-router-setup.md, client/tanstack-react-query/{setup,usage,server-components}.md, client/react/setup.md (deprecation banner), server/error-formatting.md, client/links/httpBatchStreamLink.md, examples/next-minimal-starter (Next ^15.5, zod ^4). create-t3-app @ 4709861 (cli 7.40.0) — cli/template/extras/src/trpc/*, server/api/*, app/api/trpc/[trpc]/route.ts.

## Decision
- Use `@trpc/tanstack-react-query` (createTRPCContext / useTRPC / createTRPCOptionsProxy / queryOptions / infiniteQueryOptions). Classic `@trpc/react-query` is bug-fix only, removed next major (banner in docs).
- Disagreement: create-t3-app still ships classic integration + httpBatchStreamLink + zod 3. Follow tRPC docs + next-minimal-starter; keep T3's errorFormatter and "context takes headers" idea.

## Files
- `trpc/init.ts`: createTRPCContext({ headers }); initTRPC.context().create({ transformer: superjson, errorFormatter }); exports createTRPCRouter, createCallerFactory, baseProcedure.
- `trpc/routers/_app.ts`: appRouter + `type AppRouter`.
- `app/api/trpc/[trpc]/route.ts`: fetchRequestHandler; export handler as GET and POST (queries are GET → 405 otherwise). Dev-only onError log (T3).
- `trpc/query-client.ts`: makeQueryClient — staleTime 30s; dehydrate { serializeData: superjson.serialize, shouldDehydrateQuery: default || status==='pending' }; hydrate { deserializeData: superjson.deserialize }.
- `trpc/client.tsx` ('use client'): TRPCProvider/useTRPC from createTRPCContext<AppRouter>(); browser QueryClient singleton, new per server call; httpBatchLink({ url: getBaseUrl()+'/api/trpc', transformer: superjson }); provider mounted in layout.
- `trpc/server.tsx`: `import 'server-only'`; getQueryClient = cache(makeQueryClient); trpc = createTRPCOptionsProxy({ ctx, router, queryClient: getQueryClient }); HydrateClient (HydrationBoundary + dehydrate); prefetch helper (infinite branch); caller.

## SSR list
- RSC page: `await getQueryClient().prefetchInfiniteQuery(trpc.ticket.list.infiniteQueryOptions({ limit }))` then `<HydrateClient><TicketList/></HydrateClient>`.
- Rule: fire-and-forget prefetch requires useSuspense* + <Suspense>; with plain useInfiniteQuery you must `await` (else hydration mismatch). Pick `await` + useInfiniteQuery.
- `caller` is detached from query client (no hydration) — fits edit page (props + notFound()). Prefetch+HydrateClient when a client component owns data afterwards.

## Links / errors
- httpBatchLink (stream link can't set headers after start; no gain here). loggerLink optional.
- TRPCError({ code: 'NOT_FOUND' }); Zod input failure → BAD_REQUEST with cause ZodError.
- errorFormatter exposes `zodError: cause instanceof ZodError ? flatten : null`; client reads `error.data.zodError.fieldErrors.title`. Zod 4: `z.flattenError(err)` preferred over deprecated `.flatten()` (unverified in source).

## Pitfalls
1. headers() in context ⇒ dynamic; set `export const dynamic = 'force-dynamic'` explicitly (starter does).
2. Never share a server QueryClient across requests — cache(makeQueryClient).
3. Prefetch inside an already-rendered HydrateClient needs its own boundary.
4. Prefetch input must equal client input (query key) or client refetches.
5. superjson in all 4 places (init, link, serialize, deserialize).
6. Two different `createTRPCContext` (server ctx vs react factory) — name clash.
7. server-only guards trpc/server.tsx from client imports.
8. (inference) In-memory store on globalThis so RSC and route handler share it in dev/HMR.
