# 0006. Next.js 15.5, not 16, and no superjson

## Context
The statement names Next.js v15 and asks for the latest versions. Next 16 is released.

## Decision
Use the latest 15.x (15.5.29) and write code that upgrades cleanly: `await params`, typed routes, no middleware, ESLint CLI. Keep `createdAt` as epoch milliseconds so the wire format stays JSON and needs no transformer. Dates are formatted with a pinned locale and time zone (`en-US`, `America/Campo_Grande`) so server and browser render the same text.

## Consequences
- Matches the statement literally; the upgrade to 16 is mostly a version bump.
- No superjson in the four places it would need wiring.
- `next>postcss` is overridden to `^8.5.18` to clear two high advisories in the version Next 15.5 pins.

## Alternatives
- Next 16: newer, but not what the statement names.
- `Date` objects with superjson: more moving parts for one field.

Sources: npm registry, Next.js 16 upgrade guide; research 04.
