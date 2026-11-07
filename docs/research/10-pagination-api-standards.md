# Research 10 — Cursor pagination against public API standards

| # | Topic | Verdict | Basis |
|---|---|---|---|
| 1 | Keyset + unique tie-breaker | Keep | Zalando #160 prefers cursors; JSON:API cursor profile requires unique sort with server-added tie-break (age → age,id); Stripe reverse-chronological object-id cursors |
| 2 | Readable "<ts>_<id>" cursor | Change → base64url(JSON {v:1,t,id}) | AIP-158: tokens opaque, URL-safe, not user-parseable; Relay: opaque to clients; Zalando: never inspected/constructed by clients |
| 3 | Malformed cursor silently restarts | Change → BAD_REQUEST "Invalid cursor" | Slack invalid_cursor; JSON:API 400 with source; AIP-158 INVALID_ARGUMENT for bad args. A cursor whose item was deleted is VALID (keyset never looks it up) |
| 4 | limit 1–50 default 10, reject > max | Keep | AIP coerces; GitHub (1–100) and JSON:API (max-size-exceeded 400) reject; Stripe default 10 / 1–100; Shopify 250 |
| 5 | total | Keep with caveat | Zalando #254 and Microsoft discourage (cost); AIP total_size and JSON:API meta.page.total allow; ≤1,000 in memory is free; document as point-in-time |
| 6 | nextCursor null = end | Keep | TanStack v5 null/undefined from getNextPageParam = no next page; AIP empty next_page_token; Slack empty next_cursor; Microsoft omits nextLink |
| 7 | Consistency semantics | Document | Microsoft: document that resources may be skipped/duplicated |
| 8 | Tests | Add below | — |

Changes: base64url {v:1,t,id} decoded + Zod-validated; fetch limit+1 to set nextCursor only if more exist (exclusive cursor from last returned item; tRPC docs example uses inclusive extra item — fragile); createdAt immutable & server-assigned; document order, exactly-once for items present throughout, new items appear on refresh, deleted never appear, total point-in-time, opaque cursors; edge: same-ms new item with lower id may appear mid-traversal (accept or use time-ordered ids).

Tests: fast-check property test with fixed seed over random stores + interleaved create/delete/next (no dupes, strictly descending, pages ≤ limit, present-throughout exactly once, nothing after deletion); deleted cursor item; empty store; total === limit; total === k·limit (no empty trailing page); limit+1; limit 1/50; rejections (0, 51, negative, non-integer, garbage cursor, base64 non-JSON, wrong v); equal timestamps across boundary; cursor round-trip + base64url charset. Latency: drop or very loose (1,000 traversal < 1 s).

Sources: google.aip.dev/158; docs.stripe.com/api/pagination; docs.slack.dev/apis/web-api/pagination; relay.dev/graphql/connections.htm; docs.github.com GraphQL pagination; shopify.dev pagination-graphql; jsonapi.org/profiles/ethanresnick/cursor-pagination; microsoft/api-guidelines azure Guidelines.md; opensource.zalando.com/restful-api-guidelines/#pagination; trpc.io useInfiniteQuery; tanstack infinite-queries.
