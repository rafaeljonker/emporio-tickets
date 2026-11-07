# 0003. Keyset pagination with opaque cursors

## Context
The list scrolls infinitely while tickets are created and deleted. Offset pagination skips or repeats rows when the list changes between pages.

## Decision
- Order by `createdAt desc, id desc` (`id` breaks ties, so the order is total).
- The next page is everything strictly after the last returned key. A cursor whose ticket was deleted stays valid.
- Cursors are `base64url(JSON.stringify({ v: 1, t, id }))`, validated with Zod on the way in. Malformed cursors are rejected with `BAD_REQUEST` rather than silently restarting the list.
- The store fetches `limit + 1` to know whether another page exists, so a total that is a multiple of the limit never ends with an empty page. `nextCursor: null` is the only end signal. `total` is a point-in-time count.

## Consequences
- Every ticket present for a whole traversal appears exactly once; deleting rows from the client cache is safe.
- A fast-check property test over up to 1,000 tickets with interleaved creates and deletes pins these invariants.
- Known edge: a ticket created in the same millisecond as the cursor with a lower id can appear mid-traversal.

## Alternatives
- Offset/limit: simple, wrong under concurrent changes.
- Readable cursors: invite clients to build or parse them.

Sources: Google AIP-158, Stripe, Slack, Relay Cursor Connections, JSON:API cursor profile, Zalando and Microsoft API guidelines; research 10.
