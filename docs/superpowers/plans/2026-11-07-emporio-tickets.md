# Empório Tickets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A support-ticket board for the Empório da Música team: Next.js 15 + tRPC v11 CRUD over an in-memory store, SSR list with infinite scroll, create/edit form, every loading/success/error state, in the Empório design system.

**Architecture:** Domain-oriented folders: pure rules in `src/domain` (schemas, keyset pagination, error codes as values), the backend in `src/server` (in-memory store adapter, tRPC router, HTTP handler), UI in `src/client` (use cases as component + `use{Name}` view model), tRPC glue in `src/trpc`, thin routes in `src/app`. The list page awaits a server prefetch and hydrates TanStack Query; later pages and mutations run client-side.

**Tech Stack:** Next.js 15.5.29 (App Router), React 19.3.1, tRPC 11.25.0 (`@trpc/tanstack-react-query`), TanStack Query 5.107.1, Zod 4.6.7, React Hook Form 7.91.0 + @hookform/resolvers 7.0.3, Tailwind CSS 4.3.5 + shadcn (radix-nova), sonner, Vitest 5.1.0 + Testing Library 16.3.3 + jsdom 31.0.0 + fast-check, Playwright 1.65.0, pnpm, Node 22.

**Spec:** `docs/superpowers/specs/2026-11-07-emporio-tickets-design.md` (read it with this plan; section numbers below refer to it). Approved mockups: `docs/design/mockups/screens-a.html`.

## Global Constraints

- Versions exactly as in **Tech Stack**; `next@15.5.29`, never 16. Code is Next-16-ready: `await params`, no `middleware.ts`, ESLint CLI (not `next lint`).
- English everywhere (code, copy, commits, docs). Conventional Commits, subject ≤ 72 chars, scope `tickets`, `ui`, `repo`, `ci`, `docs`. AI-assisted commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- TDD pairs: `test(<scope>): <behavior> (red)` then `feat(<scope>): <behavior>`. `pnpm check` green before every commit except the red half.
- One branch per milestone (`feat/scaffold`, `feat/domain`, `feat/server`, `feat/ui`, `feat/e2e-docs`), PR to `main`, merge commit, never squash, never force-push.
- No personal traces in the repo: no personal names, other projects, local paths, job-search wording (the owner-approved easter-egg line in §6.8 is the only exception), no secrets, no `.env` with values.
- Copy rules: sentence case, short, blame-free, no em dashes, no emoji outside the easter egg. Dates via `formatTicketDate` only (pinned `en-US` + `America/Campo_Grande`).
- Import rules (ESLint `no-restricted-imports`): `src/domain/**` imports only `zod` and `@/shared/*`; `src/client/**` never imports `@/server/*`; `src/server/**` never imports `@/client/*`; `**/__tests__/**` and `src/test-support/**` are exempt.
- `'use client'` only on `TicketList.tsx`, `TicketForm.tsx`, `NewTicketButton.tsx`, `trpc/client.tsx`, `app/error.tsx`, `app/global-error.tsx` and shadcn primitives that ship it. Every `src/server/**` module and `src/trpc/server.tsx` start with `import 'server-only'`.
- View-model rule (§6.10): each use-case component makes exactly one hook call, its sibling `use{Name}`, and only renders. Hookless presentational pieces live in `src/client/tickets/ui`.
- `$DS_SRC` = the Empório design-system source folder (a Vite app), supplied by the owner at execution time; never written into the repo.

## Review Focus

- **Double submit** (Enter twice or double-click "Create ticket"): exactly one ticket is created. Pinned in Task 12 (`useTicketForm` test).
- **Double confirm on delete** (double-click "Delete ticket"): one delete call, one success toast, no "not found" error toast. Pinned in Task 11 (`useTicketRow` test).
- **Deleting every visible row while more pages exist:** the list must not show the empty state; it loads the next page. Empty state only when `total === 0`. Pinned in Task 10 (`useTicketList` test).
- **The `N` shortcut while typing:** pressing `n` inside an input/textarea or with a modifier key must not navigate. Pinned in Task 10 (`useNewTicketButton` test).
- **A 120-character title with no spaces** (pasted URL, SKU): the row wraps instead of overflowing horizontally. Pinned in Task 14 (e2e).

---

## Milestone 1 — `feat/scaffold`

### Task 1: Project scaffold, tooling and CI

**Files:**
- Create: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.mts`, `src/test-support/empty-module.ts`, `src/app/layout.tsx`, `src/app/(board)/page.tsx` (placeholder), `.gitignore`, `.nvmrc`, `.github/workflows/ci.yml`, `AGENTS.md`, `CLAUDE.md`
- Test: none yet (Vitest runs with `passWithNoTests`)

**Interfaces:**
- Produces: scripts `dev` (`next dev --turbopack`), `build`, `start`, `lint` (`eslint .`), `typecheck` (`next typegen && tsc --noEmit`), `test` (`vitest run`), `test:watch`, `test:e2e` (`playwright test`), `check` (`next typegen && eslint . && tsc --noEmit && vitest run`); alias `@/*` → `src/*`.

- [ ] **Step 1:** Ask the owner to create the GitHub repo `emporio-tickets` as **private** (it goes public in Task 16) or confirm you may run `gh repo create emporio-tickets --private --source . --remote origin`. Do not proceed to push without that answer.
- [ ] **Step 2:** Branch `feat/scaffold`. Scaffold with `pnpm dlx create-next-app@15.5.29 . --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-pnpm --turbopack --no-git` (keep the existing `docs/`), then pin every dependency in Tech Stack to the exact versions (`pnpm add -E`), add dev deps `vitest@5.1.0 @vitejs/plugin-react vite-tsconfig-paths@6.1.1 jsdom@31.0.0 @testing-library/react@16.3.3 @testing-library/dom fast-check @playwright/test@1.65.0 server-only typescript-eslint`.
- [ ] **Step 3:** `tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `isolatedModules`, `moduleDetection: "force"`, `moduleResolution: "Bundler"`; no `exactOptionalPropertyTypes`.
- [ ] **Step 4:** `next.config.ts`: `typedRoutes: true`, `poweredByHeader: false`, `headers()` for `/(.*)` with exactly `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`.
- [ ] **Step 5:** `eslint.config.mjs` (flat): `next/core-web-vitals`, typescript-eslint `recommendedTypeChecked` + `stylisticTypeChecked`, `consistent-type-imports` (inline), `no-misused-promises` with `checksVoidReturn: { attributes: false }`, errors on `no-explicit-any`, `no-non-null-assertion`, `no-floating-promises`, `react/no-danger`, and the import rules from Global Constraints.
- [ ] **Step 6:** `vitest.config.mts`: `plugins: [tsconfigPaths(), react()]`, `resolve.alias: { 'server-only': './src/test-support/empty-module.ts' }`, `test.passWithNoTests: true`, two projects: `node` (`include: ['src/{domain,server,shared}/**/*.test.ts', 'src/client/shared/**/*.test.ts']`) and `jsdom` (`include: ['src/client/**/*.test.tsx']`).
- [ ] **Step 7:** `AGENTS.md` (commands, folder map from §6.1, import and `'use client'` rules, view-model rule, TDD pairs, branch/PR rules, language policy, "never commit secrets") and `CLAUDE.md` containing only `@AGENTS.md`.
- [ ] **Step 8:** `.github/workflows/ci.yml`: on `push` and `pull_request`, one job, `permissions: contents: read`, actions pinned to full commit SHAs (checkout, pnpm/action-setup, setup-node with Node 22 and `cache: pnpm`), steps: `pnpm install --frozen-lockfile` → `pnpm check` → `pnpm audit --prod --audit-level=high` → `pnpm build` → `pnpm exec playwright install --with-deps chromium` → `pnpm test:e2e` (add the e2e steps now; they pass trivially until Task 14 adds specs, via `passWithNoTests` in the Playwright config created then — until then guard the two e2e steps with `if: hashFiles('e2e/**/*.spec.ts') != ''`).
- [ ] **Step 9:** Verify: `pnpm check` → exits 0; `pnpm build` → exits 0; `curl -sI localhost:3000` after `pnpm start` shows the three headers and no `X-Powered-By`.
- [ ] **Step 10:** Commit `chore(repo): scaffold Next.js 15 app with tooling and CI`, push, open PR, wait for CI green, merge.

---

## Milestone 2 — `feat/domain`

### Task 2: Result, ticket schema and error codes

**Files:**
- Create: `src/shared/result.ts`, `src/domain/tickets/ticket.ts`, `src/domain/tickets/errors.ts`
- Test: `src/domain/tickets/__tests__/ticket.test.ts`

**Interfaces:**
- Produces:
  - `type Result<T, E extends string> = { ok: true; data: T } | { ok: false; error: E }`; `ok<T>(data: T)`, `err<E extends string>(error: E)`.
  - Constants: `MAX_TICKETS = 1000`, `TITLE_MAX = 120`, `DESCRIPTION_MAX = 2000`, `PAGE_SIZE = 10`, `LIMIT_MAX = 50`.
  - Schemas exactly as §6.2: `ticketSchema` (`id`, `title`, `description?`, `createdAt: number`), `ticketInput`, `idInput`, `updateInput`, `listInput`; types `Ticket = z.infer<typeof ticketSchema>`, `TicketInput = z.output<typeof ticketInput>`, `TicketFormValues = z.input<typeof ticketInput>`, `ListInput = z.output<typeof listInput>`.
  - `TICKET_ERROR = { NOT_FOUND: 'TICKET_NOT_FOUND', LIMIT_REACHED: 'TICKET_LIMIT_REACHED', INVALID_CURSOR: 'TICKET_INVALID_CURSOR' } as const`; `type TicketErrorCode`; `class TicketDomainError extends Error { constructor(readonly code: TicketErrorCode) }`; `isTicketErrorCode(v: unknown): v is TicketErrorCode`.

- [ ] **Step 1: Write the failing test** `ticket.test.ts`, `describe('ticketInput')`:
  - `it('rejects an empty or whitespace-only title')`: `safeParse({ title: '   ' })` fails with message `"Title is required"` on path `['title']`.
  - `it('trims the title')`: `parse({ title: '  Piano  ' }).title === 'Piano'`.
  - `it('rejects a title over 120 characters')`: `'x'.repeat(121)` fails; `'x'.repeat(120)` passes.
  - `it('turns an empty description into undefined')`: `parse({ title: 'a', description: '' }).description === undefined`.
  - `it('rejects a description over 2000 characters')`.
  - `describe('listInput')`: default `limit` is 10; `limit` 0, 51, -1 and 1.5 fail; `cursor` accepts `null`.
- [ ] **Step 2:** Run `pnpm vitest run src/domain/tickets/__tests__/ticket.test.ts` → FAIL (module not found). Commit `test(tickets): validate ticket input (red)`.
- [ ] **Step 3:** Implement `result.ts`, `ticket.ts`, `errors.ts` with the interfaces above.
- [ ] **Step 4:** Run the test → PASS; `pnpm check` → green. Commit `feat(tickets): ticket schema, limits and domain error codes`.

### Task 3: Keyset pagination

**Files:**
- Create: `src/domain/tickets/pagination.ts`, `src/test-support/ticketFactory.ts`
- Test: `src/domain/tickets/__tests__/pagination.test.ts`

**Interfaces:**
- Consumes: Task 2 (`Ticket`, `Result`, `TICKET_ERROR`).
- Produces:
  - `compareTickets(a: Ticket, b: Ticket): number` — `createdAt` desc, then `id` desc.
  - `encodeCursor(t: Pick<Ticket, 'createdAt' | 'id'>): string` — `base64url(JSON.stringify({ v: 1, t: createdAt, id }))` (use `Buffer` with `'base64url'`; domain stays IO-free).
  - `decodeCursor(cursor: string): Result<{ t: number; id: string }, 'TICKET_INVALID_CURSOR'>` — JSON parse + Zod `{ v: z.literal(1), t: z.number().int(), id: z.string().min(1) }`; any failure → error.
  - `type TicketPage = { items: Ticket[]; nextCursor: string | null; total: number }`.
  - `paginate(tickets: readonly Ticket[], input: { limit: number; cursor?: string | null }): Result<TicketPage, 'TICKET_INVALID_CURSOR'>` — sort with `compareTickets`, keep items strictly after the cursor key, take `limit + 1`, `nextCursor = encodeCursor(items[limit-1])` only if the extra item exists, `total = tickets.length`.
  - Test support: `buildTicket(overrides?: Partial<Ticket>): Ticket`, `buildTickets(n: number, opts?: { start?: number; stepMs?: number }): Ticket[]` — ids `t-0001`… zero-padded, `createdAt` = `start` (default `1_794_000_000_000`) minus `i * stepMs` (default 60_000), titles `Ticket 0001`….

- [ ] **Step 1: Write the failing tests** `describe('paginate')`:
  - `it('orders by createdAt desc, then id desc')`: two tickets with equal `createdAt` and ids `a`, `b` → `b` first.
  - `it('returns an empty page for an empty store')`: `{ items: [], nextCursor: null, total: 0 }`.
  - `it('ends without an empty page when total is a multiple of limit')`: 20 tickets, limit 10 → page 2 has `nextCursor: null`.
  - `it('returns a cursor when total is limit + 1')`: 11 tickets → page 1 has a cursor, page 2 has 1 item and `null`.
  - `it('keeps a cursor valid after its ticket is deleted')`: page 1 of 25; remove page 1's last ticket from the array; page 2 starts at the original 11th ticket.
  - `it('splits equal timestamps across a page boundary without loss')`: 15 tickets sharing one `createdAt`, limit 10 → 10 + 5, all ids once.
  - `it('traverses 1000 tickets exactly once in order')` with `limit` 1 and with `limit` 50 (both bounds).
  - `describe('cursor')`: round-trip `decodeCursor(encodeCursor(x))`; the string matches `/^[A-Za-z0-9_-]+$/`; `'garbage'`, `base64url('not json')` and `base64url('{"v":2,"t":1,"id":"x"}')` → `{ ok: false, error: 'TICKET_INVALID_CURSOR' }`.
- [ ] **Step 2:** Run → FAIL. Commit `test(tickets): keyset pagination (red)`.
- [ ] **Step 3:** Implement `pagination.ts` and `ticketFactory.ts`.
- [ ] **Step 4:** Run → PASS; `pnpm check` green. Commit `feat(tickets): keyset pagination with opaque cursors`.

### Task 4: Pagination property test

**Files:**
- Test: `src/domain/tickets/__tests__/pagination.property.test.ts`

**Interfaces:**
- Consumes: Task 3 (`paginate`, `buildTickets`).

- [ ] **Step 1: Write the property test** with `fc.assert(..., { seed: 20261107, numRuns: 200 })`. Arbitrary: initial size `0..1000`, `limit` `1..50`, a list of up to 60 steps, each `next` | `create` | `delete(index)`; created tickets get `createdAt` ≤ the initial newest (so some collide with existing timestamps) and fresh ids. Simulate a traversal: on `next` call `paginate(current, { limit, cursor })`; apply creates/deletes to `current` between pages; stop when `nextCursor === null`, then drain remaining pages. Assert:
  - no id appears twice across pages;
  - concatenated items are strictly descending by `compareTickets`;
  - every page has `≤ limit` items;
  - every ticket present from start to end appears exactly once;
  - no ticket appears in a page fetched after its deletion.
- [ ] **Step 2:** Run → PASS (pagination already exists; if it fails, fix `pagination.ts` and note the failing seed in the commit body). Commit `test(tickets): property-based pagination invariants`.
- [ ] **Step 3:** Push, PR `feat/domain`, CI green, merge.

---

## Milestone 3 — `feat/server`

### Task 5: In-memory store and seed

**Files:**
- Create: `src/server/tickets/store.ts`, `src/server/tickets/seed.ts`
- Test: `src/server/tickets/__tests__/store.test.ts`

**Interfaces:**
- Consumes: Tasks 2–3.
- Produces:
  - `type TicketStore = { list(input: { limit: number; cursor?: string | null }): Result<TicketPage, TicketErrorCode>; get(id: string): Result<Ticket, TicketErrorCode>; create(input: TicketInput): Result<Ticket, TicketErrorCode>; update(id: string, input: TicketInput): Result<Ticket, TicketErrorCode>; remove(id: string): Result<{ id: string }, TicketErrorCode>; size(): number }`.
  - `createTicketStore(opts?: { seed?: readonly Ticket[]; now?: () => number; newId?: () => string }): TicketStore` — `Map`, defaults `Date.now` and `crypto.randomUUID`.
  - `getTicketStore(): TicketStore` — `globalThis.__ticketStore ??= createTicketStore({ seed: seedTickets })`.
  - `seedTickets: readonly Ticket[]` (25 tickets) and `NEWEST_SEEDED_TITLE = 'Piano tuning quote for a Yamaha U1'`.

- [ ] **Step 1: Write the failing tests** `describe('createTicketStore')`:
  - `create` uses the injected `newId()`/`now()` and returns the ticket; the stored ticket equals it.
  - `get`/`update`/`remove` with `'missing'` → `{ ok: false, error: 'TICKET_NOT_FOUND' }`.
  - `update` replaces title and description (`description: undefined` clears it) and keeps `createdAt`.
  - with `buildTickets(1000)` as seed, `create` → `{ ok: false, error: 'TICKET_LIMIT_REACHED' }` and `size()` stays 1000.
  - a title `'<script>alert(1)</script>'` round-trips unchanged.
  - `describe('seed')`: 25 tickets, unique ids, newest title equals `NEWEST_SEEDED_TITLE`, two tickets share one `createdAt` (tie-break exists in the data); `getTicketStore() === getTicketStore()` and its `size()` is 25 after two calls.
- [ ] **Step 2:** Run → FAIL. Commit `test(tickets): in-memory store (red)`.
- [ ] **Step 3:** Implement. `seed.ts`: ids `00000000-0000-4000-8000-0000000000NN` (NN = 01..25), `createdAt` descending from `Date.UTC(2026, 10, 7, 14, 42)` (10:42 AM in Campo Grande) with uneven gaps; the newest three are, in order: "Piano tuning quote for a Yamaha U1" / "Customer wants a home visit in Campo Grande next week and asked whether tuning and a light regulation fit in one visit. Prefers mornings."; "B string snapped on a new Giannini GF-1D" / "Bought 12 days ago, order 4417. The B string broke on the first tune. Wants a replacement set shipped, not a refund. Within the 30-day defect window."; "Trade-in value for a used Roland FP-30" / "Wants to trade toward an FP-60X and sent photos of the keys and pedal. The agent can't price used gear." The other 22 are music-store hand-offs in the same voice (at least two without a description, one with accents such as "Corumbá").
- [ ] **Step 4:** Run → PASS; `pnpm check` green. Commit `feat(tickets): in-memory ticket store with deterministic seed`.

### Task 6: tRPC init, error map and router

**Files:**
- Create: `src/server/trpc.ts`, `src/server/root.ts`, `src/server/tickets/errors.ts`, `src/server/tickets/router.ts`
- Test: `src/server/tickets/__tests__/router.test.ts`, `src/server/__tests__/errorFormatter.test.ts`

**Interfaces:**
- Consumes: Tasks 2–5.
- Produces:
  - `trpc.ts`: `type Context = { store: TicketStore }`; `createTRPCContext(opts?: { store?: TicketStore }): Context` (default `getTicketStore()`); `formatError({ shape, error, isDev }): shape` (pure, exported for tests) adding `data.zodError` (`z.flattenError(cause)` when `cause instanceof ZodError`, else `null`) and `data.domainCode` (`cause.code` when `cause instanceof TicketDomainError`, else `null`), replacing the message with `"Something went wrong."` and deleting `data.stack` when `code === 'INTERNAL_SERVER_ERROR' && !isDev`; `createTRPCRouter`, `publicProcedure`, `createCallerFactory`.
  - `errors.ts`: `toTRPCError: Record<TicketErrorCode, { code: TRPC_ERROR_CODE_KEY; message: string }>` = `NOT_FOUND`/"Ticket not found.", `FORBIDDEN`/"Ticket limit reached.", `BAD_REQUEST`/"Invalid cursor."; `unwrap<T>(r: Result<T, TicketErrorCode>): T` throws `new TRPCError({ ...toTRPCError[code], cause: new TicketDomainError(code) })`.
  - `router.ts`: `ticketRouter` with `list` (query, `listInput`, returns `TicketPage`), `byId` (query, `idInput`), `create` (mutation, `ticketInput`), `update` (mutation, `updateInput`), `delete` (mutation, `idInput`, returns `{ id }`). A JSDoc on `list` states the semantics from §6.3.
  - `root.ts`: `appRouter = createTRPCRouter({ ticket: ticketRouter })`, `type AppRouter`, `createCaller = createCallerFactory(appRouter)`, `type RouterOutputs = inferRouterOutputs<AppRouter>`.

- [ ] **Step 1: Write the failing tests.** `router.test.ts` with `const caller = createCaller(createTRPCContext({ store: createTicketStore({ seed: buildTickets(25) }) }))`:
  - `list({ limit: 10 })` returns 10 items, a string cursor and `total: 25`; following cursors to the end visits 25 ids once.
  - `create({ title: '' })` rejects with a `TRPCError` `{ code: 'BAD_REQUEST' }` whose `cause` is a `ZodError`; passing it through `formatError` yields `data.zodError.fieldErrors.title` containing `"Title is required"`.
  - `list({ limit: 0 | 51 | -1 | 1.5 })` → `BAD_REQUEST`; `list({ cursor: 'garbage' })` → `BAD_REQUEST`, message `"Invalid cursor."`, cause code `TICKET_INVALID_CURSOR`.
  - `update`/`delete`/`byId` with `'missing'` → `NOT_FOUND`, message `"Ticket not found."`.
  - store at 1000 → `create` → `FORBIDDEN`, `"Ticket limit reached."`.
  - `it.each(Object.values(TICKET_ERROR))` every code has an entry in `toTRPCError` (guards the map at runtime as well as in types).
  - `errorFormatter.test.ts`: `formatError` with an `INTERNAL_SERVER_ERROR` whose cause is `new Error('db password leaked')` and `isDev: false` → message `"Something went wrong."`, no `data.stack`; with `isDev: true` → original message kept.
- [ ] **Step 2:** Run → FAIL. Commit `test(tickets): ticket router contract and error map (red)`.
- [ ] **Step 3:** Implement the four files.
- [ ] **Step 4:** Run → PASS; `pnpm check` green. Commit `feat(tickets): tRPC ticket router with exhaustive error map`.

### Task 7: HTTP handler and route

**Files:**
- Create: `src/server/http.ts`, `src/app/api/trpc/[trpc]/route.ts`
- Test: `src/server/__tests__/http.test.ts`

**Interfaces:**
- Consumes: Task 6.
- Produces: `MAX_BATCH_SIZE = 10`; `handleTrpcRequest(req: Request, createContext?: () => Context): Promise<Response>` — `fetchRequestHandler({ endpoint: '/api/trpc', req, router: appRouter, createContext: createContext ?? (() => createTRPCContext()), maxBatchSize: MAX_BATCH_SIZE, onError: logs only `INTERNAL_SERVER_ERROR` with `console.error` })`. `route.ts`: `const handler = (req: Request) => handleTrpcRequest(req); export { handler as GET, handler as POST };`.

- [ ] **Step 1: Write the failing tests** (fresh store per test via the `createContext` argument; build URLs as `http://localhost/api/trpc/<path>`):
  - `GET ticket.list?input={"limit":10}` (URL-encoded) → 200, JSON `result.data.items.length === 10`.
  - `POST ticket.delete` with body `{"id":"t-0001"}` and `content-type: text/plain` → 415.
  - `POST ticket.delete` with `FormData` containing `id=t-0001` → 400, and the store still has `t-0001`.
  - batch `GET` of 11 `ticket.list` calls (`?batch=1&input={"0":{},…"10":{}}`) → 400 with message containing `"Batch call exceeds maximum size"`.
  - `POST ticket.update` for `'missing'` → 404; `POST ticket.create` with `{"title":""}` → 400; store at cap → `create` → 403.
  - with `vi.stubEnv('NODE_ENV', 'production')` (rebuild the router module via `vi.resetModules()` so `isDev` is re-read), a 404 response body has no `stack` key.
- [ ] **Step 2:** Run → FAIL. Commit `test(tickets): HTTP contract for the tRPC endpoint (red)`.
- [ ] **Step 3:** Implement `http.ts` and `route.ts`.
- [ ] **Step 4:** Run → PASS; `pnpm check` green; `pnpm dev` and `curl -s 'localhost:3000/api/trpc/ticket.list?input=%7B%22limit%22%3A2%7D'` returns two seeded tickets. Commit `feat(tickets): tRPC HTTP handler with batch limit`.
- [ ] **Step 5:** Push, PR `feat/server`, CI green, merge.

---

## Milestone 4 — `feat/ui`

### Task 8: Design system port and app shell

**Files:**
- Create: `src/app/globals.css` (from `$DS_SRC/src/index.css`), `src/client/shared/components/ui/{button,card,dialog,input,label,select,textarea,avatar}.tsx` (from `$DS_SRC/src/components/ui`), `src/client/shared/lib/utils.ts`, `components.json`, `public/avatar.jpg`, `public/wordmark.jpg`, `src/app/icon.png` (from `$DS_SRC/public/favicon.png`), `src/client/shared/components/AppRail.tsx`
- Modify: `src/app/layout.tsx`
- Add via CLI: `pnpm dlx shadcn@latest add sonner skeleton alert alert-dialog`

**Interfaces:**
- Produces: `<AppRail />` (server component: avatar 40px `alt=""`, "Empório da Música" / "Team desk", walnut rail with 3px honey bottom rule, `.surface-wood`); root layout `<html lang="en" className={fraunces.variable + ' ' + sourceSans.variable}>`, body `.surface-paper`, `<TRPCReactProvider>` placeholder slot (wired in Task 9), `<Toaster position="bottom-center" />`; `metadata = { title: { default: 'Tickets · Empório', template: '%s · Empório' } }`.

- [ ] **Step 1:** Copy the files; in `globals.css` delete the three `@fontsource` imports and point `--font-sans` to `var(--font-source-sans), system-ui, …` and `--font-display` to `var(--font-fraunces), Georgia, serif`. Fonts in `layout.tsx` via `next/font/google`: `Fraunces({ subsets: ['latin','latin-ext'], axes: ['SOFT','WONK','opsz'], style: ['normal','italic'], variable: '--font-fraunces' })`, `Source_Sans_3({ subsets: ['latin','latin-ext'], variable: '--font-source-sans' })`.
- [ ] **Step 2:** `components.json`: `rsc: true`, `tailwind.css: "src/app/globals.css"`, style `radix-nova`, aliases `ui: "@/client/shared/components/ui"`, `utils: "@/client/shared/lib/utils"`, `components: "@/client/shared/components"`. Add `'use client'` to dialog, label, avatar. Sonner: hardcode `theme="light"`, error icon `CircleAlert` with `strokeWidth={1.75}`, remove `next-themes`.
- [ ] **Step 3:** Verify: `pnpm build` exits 0; `pnpm start` and open `/` in a browser: cream paper canvas, walnut rail with honey rule, avatar, fonts loaded (Fraunces on a test `h1`). Compare against `docs/design/mockups/screens-a.html` §1 header.
- [ ] **Step 4:** Commit `feat(ui): port the Empório design system and app rail`.

### Task 9: tRPC client glue, test harness and error messages

**Files:**
- Create: `src/trpc/query-client.ts`, `src/trpc/client.tsx`, `src/trpc/server.tsx`, `src/test-support/renderWithTrpc.tsx`, `src/client/shared/lib/errorMessage.ts`
- Modify: `src/app/layout.tsx` (wrap children in `TRPCReactProvider`)
- Test: `src/client/shared/__tests__/errorMessage.test.ts`

**Interfaces:**
- Consumes: Tasks 6–7.
- Produces:
  - `makeQueryClient(): QueryClient` — `staleTime: 30_000`; `dehydrate.shouldDehydrateQuery: q => defaultShouldDehydrateQuery(q) || q.state.status === 'pending'`; no transformer.
  - `client.tsx`: `export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()`; `TRPCReactProvider({ children })` with a browser singleton QueryClient and `httpBatchLink({ url: getBaseUrl() + '/api/trpc', maxItems: 10 })`; `getBaseUrl()` = `''` in the browser else `http://localhost:${process.env.PORT ?? 3000}`.
  - `server.tsx`: `getQueryClient = cache(makeQueryClient)`; `trpc = createTRPCOptionsProxy({ ctx: () => createTRPCContext(), router: appRouter, queryClient: getQueryClient })`; `HydrateClient({ children })`; `caller = createCaller(createTRPCContext())`.
  - `renderWithTrpc<T>(hook: () => T, opts?: { store?: TicketStore }): { result; queryClient; store }` — `renderHook` wrapped in `QueryClientProvider` + `TRPCProvider` whose client uses `localLink({ router: appRouter, createContext: async () => ({ store }) })`.
  - `toUserMessage(error: unknown): string`.

- [ ] **Step 1: Write the failing test** `describe('toUserMessage')`, using real `TRPCClientError`s produced through `localLink` (or `TRPCClientError.from` with a shaped error):
  - `domainCode: 'TICKET_NOT_FOUND'` → `"This ticket no longer exists."`
  - `'TICKET_LIMIT_REACHED'` → `"The board is full (1,000 tickets). Delete one before adding another."`
  - `'TICKET_INVALID_CURSOR'` → `"Couldn't load more tickets. Try again."`
  - `code: 'BAD_REQUEST'` without domain code → `"Check the highlighted fields and try again."`
  - `TRPCClientError` without `data` (network) → `"Can't reach the server. Check your connection and try again."`
  - anything else → `"Something went wrong. Try again."`
- [ ] **Step 2:** Run → FAIL. Commit `test(ui): map errors to user messages (red)`.
- [ ] **Step 3:** Implement the five files and wrap the layout.
- [ ] **Step 4:** Run → PASS; `pnpm check` green. Commit `feat(ui): tRPC client glue and error messages`.

### Task 10: Ticket list (SSR + infinite scroll) and the New ticket shortcut

**Files:**
- Create: `src/app/(board)/page.tsx` (replace placeholder), `src/app/(board)/loading.tsx`, `src/client/tickets/useCases/list/{TicketList.tsx,useTicketList.ts,NewTicketButton.tsx,useNewTicketButton.ts}`, `src/client/tickets/ui/{TicketDate.tsx,formatTicketDate.ts,TicketsEmpty.tsx,TicketsSkeleton.tsx,ListEnd.tsx,LoadMoreError.tsx}`
- Test: `src/client/tickets/__tests__/useTicketList.test.tsx`, `src/client/tickets/__tests__/TicketList.test.tsx`, `src/client/tickets/__tests__/useNewTicketButton.test.tsx`, `src/client/tickets/__tests__/formatTicketDate.test.ts`

**Interfaces:**
- Consumes: Tasks 2, 6, 9.
- Produces:
  - `formatTicketDate(ms: number): string` — `Intl.DateTimeFormat('en-US', { timeZone: 'America/Campo_Grande', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })` (matches the approved mockup "Nov 7, 10:42 AM"; overrides the spec's `dateStyle: 'medium'`, which adds the year).
  - `useTicketList(): UseTicketListResult` = `{ kind: 'empty' } | { kind: 'content'; tickets: Ticket[]; total: number; statusText: string; hasNextPage: boolean; isFetchingNextPage: boolean; nextPageError: string | null; loadMoreRef: (el: HTMLButtonElement | null) => void; handleLoadMore: () => void; handleRetry: () => void }`. Uses `useSuspenseInfiniteQuery(trpc.ticket.list.infiniteQueryOptions({ limit: PAGE_SIZE }, { getNextPageParam: p => p.nextCursor }))`. `kind: 'empty'` only when the latest page's `total === 0`. Auto-fetch from the observer (`rootMargin: '400px'`, disconnect on cleanup) only when `hasNextPage && !isFetching && !isFetchNextPageError`. `statusText` = `"Showing ${n} of ${total} tickets"` with `toLocaleString('en-US')`. `handleLoadMore` (click) fetches and moves focus to the first new row after it renders.
  - `useNewTicketButton(): { href: '/tickets/new' }` registering a `keydown` listener: plain `n`/`N` with no modifier, not repeated, target not `input`/`textarea`/`select`/`[contenteditable]` → `router.push('/tickets/new')`.
  - `TicketList` renders: `TicketsEmpty` for `empty`; else `<ul>` of `TicketRow` (Task 11; until then a minimal `<li>` with title, description, `TicketDate`), two skeleton rows while `isFetchingNextPage`, `LoadMoreError` with "Try again" on `nextPageError`, the real "Load more" button with `loadMoreRef` while `hasNextPage`, `ListEnd` ("That's every ticket. The agent is still on shift.") at the end, and a `role="status" aria-atomic="true"` element always rendered with `statusText`.
  - `page.tsx`: `export const dynamic = 'force-dynamic'`; `await getQueryClient().prefetchInfiniteQuery(trpc.ticket.list.infiniteQueryOptions({ limit: PAGE_SIZE }))`; static header (Fraunces H1 "Handed to you", tagline "Customers the agent couldn't finish with, waiting for a person.", badge "From the store agent", `NewTicketButton`) and `<HydrateClient><TicketList /></HydrateClient>`. `loading.tsx` renders `TicketsSkeleton`. `TicketsEmpty` copy per §6.14.

- [ ] **Step 1: Write the failing tests.**
  - `formatTicketDate.test.ts`: `formatTicketDate(Date.UTC(2026, 10, 7, 14, 42))` → `"Nov 7, 10:42 AM"` regardless of `process.env.TZ` (run once with `TZ=UTC` and once `TZ=Asia/Tokyo` via `vi.stubEnv` + a fresh formatter call).
  - `useTicketList.test.tsx` (`renderWithTrpc`, store `buildTickets(25)`, mock `IntersectionObserver` with a controllable trigger): first render returns `content` with 10 tickets and `statusText "Showing 10 of 25 tickets"`; triggering the observer twice while fetching issues one request (spy on `store.list`); after three pages `hasNextPage` is false; empty store → `kind: 'empty'`; **Review Focus:** with 25 tickets, delete the 10 visible ones from the store and the cache, result stays `content` (not `empty`) and the next trigger loads more; a store whose `list` fails on the second call → `nextPageError` set, further observer triggers make no new call, `handleRetry` calls once.
  - `TicketList.test.tsx` (mock `../useCases/list/useTicketList`): renders empty copy "Quiet in the shop"; content renders rows and the status text; `isFetchingNextPage` renders two skeleton rows; `nextPageError` renders "Couldn't load more tickets." and a "Try again" button; end renders the end line.
  - `useNewTicketButton.test.tsx` (mock `next/navigation`): `n` on `document.body` → `push('/tickets/new')`; `n` with focus in an `<input>` → no push; `Meta+n` → no push.
- [ ] **Step 2:** Run → FAIL. Commit `test(ui): ticket list view model and states (red)`.
- [ ] **Step 3:** Implement per Interfaces, matching `screens-a.html` §1 and §5 (hairline rows, 880px column, hover tint + honey bar, skeleton blocks without shimmer).
- [ ] **Step 4:** Run → PASS; `pnpm check` green; `pnpm dev`, open `/`, scroll to the end of the 25 seeded tickets, view source shows "Piano tuning quote for a Yamaha U1" inside an `<li>`. Commit `feat(ui): SSR ticket list with accessible infinite scroll`.

### Task 11: Ticket row, delete and the takeover easter egg

**Files:**
- Create: `src/client/tickets/useCases/list/{TicketRow.tsx,useTicketRow.ts,TakeoverDialog.tsx}`
- Modify: `src/client/tickets/useCases/list/TicketList.tsx` (render `TicketRow`)
- Test: `src/client/tickets/__tests__/useTicketRow.test.tsx`

**Interfaces:**
- Consumes: Tasks 9–10.
- Produces:
  - `useTicketRow(ticket: Ticket): { isConfirmOpen: boolean; setConfirmOpen: (open: boolean) => void; handleDelete: () => void; isDeleting: boolean }` — `useMutation(trpc.ticket.delete.mutationOptions(...))`; `handleDelete` is a no-op while pending; on success `setQueryData(trpc.ticket.list.infiniteQueryKey({ limit: PAGE_SIZE }), …)` removing the id from every page (keep `pageParams`) and decrementing each page's `total`, then `toast.success('Ticket deleted.')`. A `NOT_FOUND` on delete counts as success (the ticket is gone either way). Any other error → `toast.error("Couldn't delete that ticket. Try again.")` and the cache is untouched.
  - `TicketRow({ ticket })`: whole row is a `Link` to `/tickets/${id}/edit`; hover/focus-within actions: takeover (opens `TakeoverDialog`), edit, delete (opens `AlertDialog`: title "Delete this ticket?", description `"${title}" will be gone for good. The customer's conversation stays with the agent.`, buttons "Keep it" (initial focus) and "Delete ticket" (destructive)). Action clicks `stopPropagation`/`preventDefault` so the row link doesn't fire. While deleting: row dimmed, `aria-busy`, label "Deleting…". On touch (`@media (hover: none)`) a visible menu button holds the same actions.
  - `TakeoverDialog({ ticket })`: static, uncontrolled Radix `Dialog`; title = ticket title; description "Conversation between the customer and the store agent."; the four sample bubbles from the mockup (two legible, two blurred) and the divider "Agent handed off"; the lock disc with heading "🔒 Live handoff" and text "Designed, not built yet. Unlocks right after this candidate gets hired. 😉"; one secondary "Got it" (`DialogClose`).

- [ ] **Step 1: Write the failing tests** (`renderWithTrpc` with the list hook and the row hook sharing one QueryClient; mock `sonner`):
  - delete success removes the ticket from cached pages, keeps `pageParams` length, calls `toast.success('Ticket deleted.')`;
  - **Review Focus:** calling `handleDelete` twice synchronously → `store.remove` spy called once, one success toast, no error toast;
  - server error (store `remove` stubbed to throw) → `toast.error("Couldn't delete that ticket. Try again.")` and the ticket stays in the cache;
  - NOT_FOUND (ticket removed from the store first) → treated as success.
- [ ] **Step 2:** Run → FAIL. Commit `test(ui): delete a ticket from the list (red)`.
- [ ] **Step 3:** Implement per Interfaces and `screens-a.html` §2 and §4 (collapse animation: `grid-template-rows: 1fr → 0fr` + opacity, 200ms `--ease-brand`, fade only under reduced motion).
- [ ] **Step 4:** Run → PASS; `pnpm check` green; manual check in `pnpm dev`: keyboard Tab reaches row actions, Enter on "Delete" opens the dialog focused on "Keep it". Commit `feat(ui): ticket row actions, delete confirm and takeover easter egg`.

### Task 12: Create and edit form

**Files:**
- Create: `src/client/tickets/useCases/form/{TicketForm.tsx,useTicketForm.ts,applyServerFieldErrors.ts}`, `src/app/tickets/new/page.tsx`, `src/app/tickets/[id]/edit/page.tsx`, `src/app/tickets/[id]/edit/not-found.tsx`
- Test: `src/client/tickets/__tests__/useTicketForm.test.tsx`, `src/client/tickets/__tests__/applyServerFieldErrors.test.ts`

**Interfaces:**
- Consumes: Tasks 2, 6, 9.
- Produces:
  - `applyServerFieldErrors(fieldErrors: Partial<Record<keyof TicketFormValues, string[]>>, setError: UseFormSetError<TicketFormValues>): boolean` — sets the first message per field; returns whether any was set.
  - `useTicketForm(props: { mode: 'create' } | { mode: 'edit'; ticket: Ticket }): { control: Control<TicketFormValues, unknown, TicketInput>; onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>; formError: string | null; isSaving: boolean; submitLabel: string }` — `useForm` exactly as §6.6 (`mode: 'onTouched'`, `shouldFocusError: true`, `values` mapped with `description ?? ''`); submit ignored while a mutation is pending; success: `queryClient.removeQueries(trpc.ticket.list.infiniteQueryFilter())`, `toast.success('Ticket created.' | 'Ticket updated.')`, `router.push('/')`; error: `applyServerFieldErrors(e.data?.zodError?.fieldErrors ?? {}, setError)` else `formError = toUserMessage(e)`. `submitLabel`: "Create ticket" / "Save changes", "Saving…" while pending.
  - `TicketForm(props)` (`'use client'`): breadcrumb link "All tickets", Fraunces H1 "New ticket" / "Edit ticket", tagline "Log something the agent didn't catch." / `Handed over ${formatTicketDate(createdAt)}`, spruce card with `Controller`-bound Title and Description (labels above, "Optional", `aria-invalid`, `aria-describedby`, error with `CircleAlert`; counter `n / max` only past 80% of the max), `role="alert"` banner for `formError`, ghost "Cancel" link to `/`, primary submit.
  - Field error copy: Zod message "Title is required" is shown as "Give the ticket a title." (map in `TicketForm` by field path, not by parsing text: when `errors.title?.type === 'too_small'`).
  - Edit page: `export default async function Page({ params }: PageProps<'/tickets/[id]/edit'>)`; `const { id } = await params`; `const ticket = await caller.ticket.byId({ id }).catch(e => { if (e instanceof TRPCError && e.code === 'NOT_FOUND') notFound(); throw e; })`; `generateMetadata` returns `{ title: 'Edit ticket' }`. New page metadata `{ title: 'New ticket' }`.
  - `edit/not-found.tsx`: `metadata.title = 'Ticket not found'`, H1 "Ticket not found", "It may have been deleted, or the link may be incomplete.", link "See all tickets" to `/` (GOV.UK pattern, §6.5).

- [ ] **Step 1: Write the failing tests** (`renderWithTrpc`, mock `next/navigation` and `sonner`):
  - `applyServerFieldErrors({ title: ['Title is required'] }, setError)` calls `setError('title', { type: 'server', message: 'Title is required' })` and returns true; `{}` returns false.
  - create success: set title "New strings", `await onSubmit()` → store `size()` +1, `removeQueries` spy called with the list filter, `toast.success('Ticket created.')`, `push('/')`.
  - **Review Focus:** `onSubmit()` called twice without awaiting → store grows by exactly one.
  - empty title → no store call, `errors.title` set.
  - edit a ticket that was removed from the store → `formError === "This ticket no longer exists."`, no navigation.
  - store at cap → `formError` equals the limit message from Task 9.
- [ ] **Step 2:** Run → FAIL. Commit `test(ui): create and edit ticket form (red)`.
- [ ] **Step 3:** Implement per Interfaces and `screens-a.html` §3.
- [ ] **Step 4:** Run → PASS; `pnpm check` green; manual: create a ticket, it appears at the top of `/`; edit it; `/tickets/nope/edit` shows "Ticket not found". Commit `feat(ui): create and edit tickets with server-aware validation`.

### Task 13: Error boundaries and root 404

**Files:**
- Create: `src/client/shared/useRouteErrorRetry.ts`, `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx`
- Test: `src/client/shared/__tests__/useRouteErrorRetry.test.tsx`

**Interfaces:**
- Produces: `useRouteErrorRetry(reset: () => void): { handleRetry: () => void }` — inside `startTransition`: `queryErrorResetBoundary.reset()`, `router.refresh()`, `reset()`. `error.tsx` (`'use client'`): H1 "Something went wrong", "The tickets couldn't load. Try again in a moment.", button "Try again". `global-error.tsx`: same copy with its own `<html><body>` and inline minimal styles. `not-found.tsx`: `metadata.title = 'Page not found'`, H1 "Page not found", "If you typed the web address, check it is correct." / "If you pasted the web address, check you copied the entire address.", link "Go to tickets" to `/`.

- [ ] **Step 1: Write the failing test** (mock `next/navigation`, wrap in `QueryClientProvider` and a `QueryErrorResetBoundary` spy): `handleRetry()` calls the boundary reset, `router.refresh` and the given `reset` once each.
- [ ] **Step 2:** Run → FAIL. Commit `test(ui): retry a failed route (red)`.
- [ ] **Step 3:** Implement the four files.
- [ ] **Step 4:** Run → PASS; `pnpm check` green; `curl -s -o /dev/null -w '%{http_code}' localhost:3000/does-not-exist` → `404` under `pnpm start`. Commit `feat(ui): error boundaries and GOV.UK-style not found page`.
- [ ] **Step 5:** Push, PR `feat/ui`, CI green, merge.

---

## Milestone 5 — `feat/e2e-docs`

### Task 14: End-to-end tests

**Files:**
- Create: `playwright.config.ts`, `e2e/tickets.spec.ts`, `e2e/routing.spec.ts`, `e2e/security.spec.ts`
- Modify: `.github/workflows/ci.yml` (drop the `hashFiles` guard)

**Interfaces:**
- Consumes: the running app; `NEWEST_SEEDED_TITLE` text "Piano tuning quote for a Yamaha U1".
- Produces: `playwright.config.ts` with `webServer: { command: 'pnpm build && pnpm start', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI, timeout: 180_000 }`, `workers: 1`, `use.baseURL`, chromium only.

- [ ] **Step 1: Write the specs.**
  - `tickets.spec.ts`:
    - SSR: a context with `javaScriptEnabled: false` loads `/` and finds `getByRole('listitem').filter({ hasText: 'Piano tuning quote for a Yamaha U1' })`.
    - No duplicate fetch: with JS on, record requests during `page.goto('/')` + `networkidle`; no request to `/api/trpc/ticket.list` whose `input` lacks a `cursor`.
    - Scroll to the end shows "That's every ticket. The agent is still on shift." and the status text "Showing 25 of 25 tickets".
    - Flow: "New ticket" → fill a unique title `E2E ${Date.now()}` → "Create ticket" → toast "Ticket created." → the ticket is the first row → open it → change the title → "Save changes" → toast "Ticket updated." → delete it via the row action → dialog → "Delete ticket" → toast "Ticket deleted." and the row is gone. Only this ticket is deleted.
    - **Review Focus:** create a ticket whose title is 120 characters with no spaces; on `/` its row has `scrollWidth <= clientWidth` and the page has no horizontal scrollbar (`document.documentElement.scrollWidth <= innerWidth`); delete it afterwards.
  - `routing.spec.ts`: `request.get('/does-not-exist')` → 404 and body contains "Page not found"; `request.get('/tickets/unknown-id/edit')` → 404 and body contains "Ticket not found".
  - `security.spec.ts`: `GET /` response has the three headers from Task 1 and no `x-powered-by`; `GET /api/trpc/ticket.byId?input=%7B%22id%22%3A%22nope%22%7D` → 404 JSON without a `stack` key.
- [ ] **Step 2:** Run `pnpm test:e2e` → PASS (the features exist; any failure is a bug to fix in the owning task's files). Commit `test(e2e): SSR, flows, routing and security headers`.

### Task 15: README, ADRs and publish hygiene

**Files:**
- Create: `README.md`, `docs/decisions/0001-trpc-tanstack-integration.md` … `0009-error-handling.md` (the nine titles in spec §8, each: Context, Decision, Consequences, Alternatives, Sources — under 40 lines)
- Modify: `docs/research/*` only if the hygiene grep finds something

- [ ] **Step 1:** `README.md` sections: what it is (the board, ticket = the statement's task; field map table `titulo → title`, `descricao → description`, `dataCriacao → createdAt (epoch ms)`); run (`pnpm i && pnpm dev`, `pnpm test`, `pnpm test:e2e`, Node 22 + pnpm); architecture (the §6.1 tree trimmed to folders, request flow SSR → hydrate → CSR); decisions (one line each linking the ADRs); pagination semantics (§6.3); testing (pyramid, what each layer proves); security and performance (the §6.11 table, First Load JS per route copied from `pnpm build` output, Lighthouse LCP/CLS/TBT from a manual run on `pnpm start`); limitations (in-memory per process, resets on restart, no auth, nonce CSP as the production step, Next 16 upgrade notes, virtualization upgrade path); next steps (database + auth, deploy, and the line "Live handoff: designed, not built yet. Unlocks right after this candidate gets hired."); design credits ("Empório da Música design system: tokens, type and voice"; fonts swapped from Fontsource to `next/font`, same intent).
- [ ] **Step 2:** Hygiene: `git grep -nIiE "rafael|jonker|/Users/|artefact|vaga|take-?home|job (search|application)|recruit|deadline|emporio-da-musica-agent" -- ':!docs/superpowers/plans'` → no output (the plan holds the pattern itself); `git grep -nI "candidate"` → only the easter-egg line in `TakeoverDialog.tsx` and the README. `git ls-files | grep -E '\.env'` → nothing.
- [ ] **Step 3:** `pnpm check && pnpm build && pnpm test:e2e` green. Commit `docs: README, ADRs and decision records`.
- [ ] **Step 4:** Push, PR `feat/e2e-docs`, CI green, merge.

### Task 16: Publish

- [ ] **Step 1:** Ask the owner to confirm making the repo public. Only after an explicit yes: `gh repo edit --visibility public --accept-visibility-change-consequences`.
- [ ] **Step 2:** Verify in a private browser window that the repo page, README and `docs/design/mockups/screens-a.html` (raw) open without login, and that CI on `main` is green. Report the URL to the owner.
