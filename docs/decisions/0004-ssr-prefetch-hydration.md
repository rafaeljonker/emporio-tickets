# 0004. SSR through an awaited prefetch and hydration

## Context
The statement asks for the list to be preloaded with SSR, and for later pages to load on scroll.

## Decision
The board page is a Server Component that awaits `prefetchInfiniteQuery` on a per-request QueryClient and renders the client list inside `HydrationBoundary`. The client reads the same query with `useSuspenseInfiniteQuery`; `staleTime` is 30 s so hydration doesn't refetch. The page has no `loading.tsx`: with one, the list would stream into a hidden boundary that only JavaScript reveals, and the store answers in milliseconds anyway.

## Consequences
- The first page is in the HTML (an e2e test checks it with JavaScript disabled) and no first-page request fires on load (another e2e test).
- Later pages, deletes and form submissions run client-side.
- Leaving a ticket opened from the board (Back, Cancel, or saving an edit) is a history step: Next's back/forward cache reuses the old page payload, hydration keeps the newer cached pages, and the scroll position returns. A forward visit to `/` would hydrate a newer first page over them, so only a create (new ticket on top) starts the board again.
- Unknown ticket ids call `notFound()` before rendering, so they return a real 404.

## Alternatives
- Fire-and-forget prefetch with streaming: faster TTFB for slow sources, but the list would not be in the initial HTML.
- Passing server data as props: no shared cache, so infinite scroll and cache updates get harder.

Sources: tRPC server-components docs, TanStack advanced SSR; research 01, 11.
