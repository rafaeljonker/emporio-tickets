# Research 11 — Infinite scroll against UX/accessibility standards

| # | Point | Verdict | Notes |
|---|---|---|---|
| 1 | SSR page 1 + hydrate + useSuspenseInfiniteQuery | Keep | staleTime > 0 (30 s) or it refetches after hydration and on focus across all pages |
| 2 | IO on a real button, rootMargin 400px | Keep | TanStack load-more example (useInView on a clickable button); 200–600px usual; disconnect in cleanup (StrictMode) |
| 3 | Guard hasNextPage && !isFetchingNextPage | Change | add !isFetchNextPageError (else retry loop while button in view) and !isFetching (fetchNextPage during background refetch can overwrite) |
| 4 | End-of-list | Keep | "All N tickets loaded" style gives position |
| 5 | Inline retry | Keep | paired with #3 |
| 6 | aria-live "Loaded 10 more" | Change | WCAG 4.1.3: role="status" + aria-atomic present from first render; "Showing 30 of 1,000 tickets" |
| 7 | WAI-ARIA Feed | Don't adopt | APG Feed needs article/posinset/setsize/busy and non-standard Page Up/Down; plain list + real button meets 2.1.1. On click-triggered load, move focus to first new row; never on IO loads |
| 8 | Footer reachability | Flag | nothing essential below the list |
| 9 | Delete via setQueryData | Keep | keep {pages,pageParams}; keyset required |
| 10 | removeQueries + router.push('/') after create/edit | Keep | invalidate refetches all pages sequentially; resetQueries ≈ remove when unmounted; hydrate overwrites only newer data and applies after first render → remove first avoids flash of old data |
| 11 | Back navigation | Keep, caveat | Next router cache on back/forward keeps scroll; TanStack pages survive gcTime; forward <Link href="/"> collapses to page 1 (document) |
| 12 | No virtualization to 1,000 | Keep, document | Lighthouse DOM warn ~800 / error ~1,400 nodes at load (~80 rows); virtualization breaks Ctrl+F/SR browsing; fallback content-visibility:auto |
| 13 | No maxPages | Keep | needs bidirectional paging; breaks back-scroll/Ctrl+F |

Disagreements: APG Feed vs NN/g/Roselli → plain list + Load more (goal-oriented work tool). Auto-load vs footer → keep auto-load, nothing below list.

Sources: w3.org/WAI/ARIA/apg/patterns/feed; w3.org/WAI/WCAG22/Understanding/status-messages; nngroup.com/articles/infinite-scrolling-tips; builtin.com/ux-design/infinite-scroll; WordPress load-more focus (wp-trac 2021-05); meta.discourse.org footer a11y; tanstack infinite-queries, QueryClient, hydration reference, load-more example; nextjs staleTimes; developer.chrome.com lighthouse dom-size.
