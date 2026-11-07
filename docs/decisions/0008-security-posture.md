# 0008. Security posture

## Context
No auth, no database, local run. The question is which guarantees are cheap and provable at this size.

## Decision
| Threat | Mitigation | Proof |
|---|---|---|
| Stored XSS | React escaping; `react/no-danger` | store test round-trips `<script>`; lint |
| Cross-site form POST | tRPC accepts JSON/multipart/octet-stream only; JSON needs a CORS preflight the app never grants; object inputs reject `FormData` | HTTP tests: multipart → 400 (ticket intact), `text/plain` → 415 |
| Clickjacking | `frame-ancestors 'none'` | e2e header check |
| Memory exhaustion | Zod length limits, `limit ≤ 50`, cap of 1,000 tickets | router and HTTP tests |
| Batch amplification | `maxBatchSize: 10` on the handler, `maxItems: 10` on the link | HTTP test: 11 calls → 400 |
| Error leakage | stacks only in development; the formatter masks internal messages in production | formatter test; e2e |
| Vulnerable dependencies | lockfile, `--frozen-lockfile`, SHA-pinned actions, `pnpm audit` gate | CI |

Also: `poweredByHeader: false`, `X-Content-Type-Options`, `Referrer-Policy`, `server-only` on every backend module.

## Consequences
Skipped on purpose: auth (out of scope), rate limiting, CSRF tokens, nonce-based `script-src` (needs middleware and dynamic rendering everywhere; the production step), body-size middleware (a reverse proxy's job), HSTS (localhost).

Sources: tRPC 11.25 source (content types, batching, error formatting), Next.js 15 CSP guide, OWASP Top 10; research 06.
