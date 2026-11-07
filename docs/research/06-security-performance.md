# Research 06 — Security and performance (tRPC 11.25.0, Next 15.5.29; checked in source)

## Source findings
- CSRF: fetch adapter accepts only application/json, multipart/form-data, application/octet-stream (else UNSUPPORTED_MEDIA_TYPE); GET without content-type → JSON (http/contentType.ts L93-100, L310-327). Cross-site JSON POST needs preflight; no CORS headers → blocked. Cross-site form can send multipart → FormData reaches procedure, but Zod 4 object schema rejects FormData (local run). allowMethodOverride default false (resolveResponse.ts L293); router.ts L484 rejects type mismatch.
- Batching: allowBatching default true, maxBatchSize unlimited (http/types.ts L186-199); over limit → 400 "Batch call exceeds maximum size" (contentType.ts L105-116); client httpBatchLink({ maxItems }).
- Body size: fetch adapter no limit (maxBodySize only node-http/fastify); Next route handlers no cap (serverActions.bodySizeLimit is Server Actions only).
- Errors: stack only when isDev (NODE_ENV !== 'production'; rootConfig.ts L54, error/formatter.ts L104). Non-TRPCError → INTERNAL_SERVER_ERROR with original message even in prod (TRPCError.ts L73, L112).
- Next 15.5: no built-in analyzer (16.x) → @next/bundle-analyzer. React Compiler experimental. poweredByHeader default true. CSP nonces need middleware + dynamic everywhere; non-nonce recipe needs 'unsafe-inline'/'unsafe-eval'.

## Security
MUST
1. Zod bounds (title 1–120, description ≤2000, limit 1–50, id non-empty). Test incl. 121-char title → BAD_REQUEST.
2. Ticket cap (1,000): store full → TRPCError FORBIDDEN "Ticket limit reached." Router test with store at cap.
3. maxBatchSize: 10 (handler) + maxItems: 10 (link). Playwright 11-item batch → 400.
4. CSRF proof: Playwright multipart POST to ticket.delete → 400 and ticket still exists; text/plain → 415.
5. next.config: poweredByHeader false; headers X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, CSP "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'". Playwright asserts headers. README: nonce script-src CSP = production step (needs middleware).
6. No dangerouslySetInnerHTML (ESLint react/no-danger); server-only in trpc/server.tsx and server/*; store test round-trips "<script>" literally.
7. Supply chain: lockfile, --frozen-lockfile, actions pinned to SHA, permissions contents: read, pnpm audit --prod --audit-level=high.
NICE: mask INTERNAL messages in prod in errorFormatter; onError logs INTERNAL only.
SKIP: per-IP rate limit, CSRF tokens/Origin checks, nonce CSP/SRI, body-size middleware (README: reverse proxy), HSTS.

## Threat table
| Threat | Mitigation | Test |
|---|---|---|
| Stored XSS (A03) | React escaping, react/no-danger | store round-trip <script>; lint |
| Cross-site form POST (A01) | JSON-only types, preflight, Zod rejects FormData | Playwright multipart→400, text/plain→415 |
| Clickjacking (A05) | frame-ancestors 'none' | header assertion |
| Memory DoS (A04) | cap, max lengths, limit ≤50 | router tests |
| Batch amplification (A04) | maxBatchSize 10 | 11-item batch → 400 |
| Error leakage (A05) | isDev off in prod; optional masking | e2e on pnpm start: NOT_FOUND JSON has no stack |
| Vulnerable deps (A06) | lockfile, audit, SHA-pinned actions | CI |
| No auth (A07) | out of scope | README limitations |

## Performance
MUST
1. Server Components by default; 'use client' only on planned leaves. Record First Load JS per route from `next build` in README (optional CI budget grep).
2. Single awaited prefetch; no hydration refetch (staleTime 30s). Playwright: SSR HTML contains seed title + no /api/trpc/ticket.list request during initial load.
3. No manual useMemo/useCallback, no virtualization.
NICE: manual Lighthouse (DevTools) on pnpm build && pnpm start, numbers in README (LCP<2.5s, CLS<0.1, INP<200ms; TBT as lab proxy). @next/bundle-analyzer only if First Load JS high.
SKIP: Lighthouse CI (flaky), next/dynamic dialogs (~0 saving), React Compiler, virtualization, refetchOnWindowFocus tuning.

## Disagreements
Cap as MUST (3 lines + test, only exhaustion path). maxBatchSize borderline. Partial CSP honest with README note. Lighthouse manual.

Sources: @trpc/server 11.25.0 src (contentType.ts, types.ts, resolveResponse.ts, router.ts, rootConfig.ts, formatter.ts, TRPCError.ts, node-http/types.ts); trpc.io httpBatchLink; nextjs.org/docs/15 CSP guide, reactCompiler; next@15.5.29 dist/server/config-shared.js, dist/bin/next.
