# Design — Empório Tickets: a support-ticket board on Next.js 15 + tRPC

> Status: approved by the owner on 2026-11-07 after three builder checks. Research behind every decision lives in `docs/research/01..11`.

## 1. Intent and why
A written technical challenge asks for a **simple task manager** in **Next.js 15 + tRPC** with an **in-memory backend** (no database), plus theoretical answers delivered separately as a PDF (not part of this repo). The statement's own hint: **"less is more — simple but functional."** Everything (code, README, commits) is in English.

The task is themed as the **ticket board of Empório da Música's support team**: when the store's AI agent can't resolve something (a piano tuning quote, a defective string set), it hands a **ticket** to the human team. A ticket *is* the statement's task. The theme reuses the Empório design system (shadcn radix-nova + Tailwind v4 tokens, wordmark, voice) so the app looks finished and the sample data has personality.

**Quality goal:** because the app is small, it must be impeccable: the canonical, current tRPC v11 + App Router pattern (validated against tRPC's own examples and real OSS repos), a clear folder structure, small tested modules, every state handled, and a README that explains the decisions.

## 2. Goals (statement requirements → how they're met)
| Requirement | Design |
|---|---|
| Next.js latest, tRPC wired for the frontend | Next **15.5.x** (statement says v15), tRPC **11** with `@trpc/tanstack-react-query` |
| Task model: `id`, `titulo`, `descricao?`, `dataCriacao` | `Ticket { id, title, description?, createdAt }` (English names; README maps them) |
| CRUD via tRPC | `ticket.list`, `ticket.byId`, `ticket.create`, `ticket.update`, `ticket.delete` |
| Reject empty title; clear error messages (e.g. update of missing task) | Zod `title: trim().min(1)` → `BAD_REQUEST` with field errors; store miss → `TRPCError NOT_FOUND` "Ticket not found." |
| List page **preloaded with SSR**, simple layout, delete in the list with success/error feedback | RSC page awaits `prefetchInfiniteQuery` and hydrates; per-row delete with confirm dialog + toast |
| Create/edit page with functional components + hooks, block empty title | One `TicketForm` with React Hook Form (`useForm`) + `zodResolver` over the shared Zod schema; logic in its `useTicketForm` view model |
| Loading / success / failure for backend and frontend errors | Skeletons, toasts, inline field errors, `role="alert"` banner, `error.tsx`, `not-found.tsx`, empty state |
| Bonus: infinite scroll | Cursor (keyset) pagination + IntersectionObserver on a real "Load more" button |
| Bonus: comments + README | Comments only on non-obvious decisions; README with run steps, architecture, decisions, limits |

## 3. Non-goals
- A database, auth, users or real ticket assignment.
- A real agent integration or live chat. "Take over conversation" is a deliberate **easter egg** (§6.8).
- Deploy. In-memory state diverges across serverless instances; the README explains how to run it locally and what changes for production.
- Status/priority fields, search, filters, sorting options: not asked; "less is more".
- Undo on delete (needs soft delete).

## 4. Anti-goals (failure even if it works)
- Looking over-engineered: no service/repository interfaces, DI containers, `features/` trees or per-procedure handler files for five procedures.
- Hydration mismatch, double fetch on load, or a list that is not actually in the server HTML.
- An evaluator unable to run it with `pnpm i && pnpm dev`.
- Personal traces in the repo (names, other projects, local paths, job-search wording); secrets of any kind.
- A single squashed commit; force-push after submission.

## 5. Constraints
- **Versions (npm, 2026-11-07):** next 15.5.29, react/react-dom 19.3.1, @trpc/{server,client,tanstack-react-query} 11.25.0, @tanstack/react-query 5.107.1, zod 4.6.7, react-hook-form 7.91.0, @hookform/resolvers 7.0.3 (peer zod ^4), tailwindcss + @tailwindcss/postcss 4.3.5, vitest 5.1.0, fast-check (latest), @testing-library/react 16.3.3, jsdom 31.0.0, @playwright/test 1.65.0. Node 22, pnpm.
- Code is written **Next-16-ready**: `await params`, no middleware, ESLint CLI (not `next lint`). Upgrading is one line in the README.
- `next dev --turbopack`; default webpack for `next build` (Turbopack build is beta on 15.5).
- Fonts via `next/font/google` (self-hosted at build), so `next build` needs network once.

## 6. Architecture

### 6.1 Directory tree (domain-oriented)
```
src/
  app/                              routes only, thin: compose from client/ and trpc/
    layout.tsx                      fonts, metadata, <TRPCReactProvider>, <Toaster/>, wood-rail header
    (board)/page.tsx                SSR list: await prefetchInfiniteQuery → <HydrateClient><TicketList/></HydrateClient>
    (board)/loading.tsx             list skeleton, scoped to the list so other routes never stream before notFound()
    error.tsx | global-error.tsx    error boundaries with "Try again"
    not-found.tsx                   root 404 for any unmatched URL ("Page not found")
    tickets/new/page.tsx            <TicketForm mode="create"/>
    tickets/[id]/edit/page.tsx      caller.ticket.byId → notFound() on NOT_FOUND → <TicketForm mode="edit" ticket/>
    tickets/[id]/edit/not-found.tsx ticket-specific 404 ("Ticket not found")
    api/trpc/[trpc]/route.ts        3 lines: GET and POST delegate to server/http.ts
  domain/                           pure and isomorphic: no React, tRPC, Next or IO; imported by server and client
    tickets/
      ticket.ts                     Zod schemas, Ticket type, limits (MAX_TICKETS, title/description lengths, PAGE_SIZE)
      pagination.ts                 keyset ordering, encodeCursor/decodeCursor, paginate()
      errors.ts                     TICKET_ERROR codes, TicketErrorCode union, TicketDomainError (Error subclass carrying the code)
      __tests__/
  shared/
    result.ts                       Result<T, E> = { ok: true; data } | { ok: false; error }
  server/                           backend only; every module imports 'server-only'
    trpc.ts                         initTRPC (context = { store }), errorFormatter, procedures, createCallerFactory
    root.ts                         appRouter = { ticket }, type AppRouter, createCaller
    http.ts                         handleTrpcRequest(req, createContext): fetchRequestHandler + maxBatchSize + onError (testable without Next)
    tickets/
      store.ts                      in-memory adapter: Map + globalThis singleton; returns Result using domain/
      seed.ts                       ~25 Empório-themed tickets, fixed ids and fixed createdAt (deterministic)
      router.ts                     use cases (tRPC procedures): input schema → store → toTRPCError on failure
      errors.ts                     toTRPCError: Record<TicketErrorCode, { code, message }>
      __tests__/                    store.test.ts, router.test.ts
  client/
    tickets/
      useCases/list/                TicketList + useTicketList, TicketRow + useTicketRow, TakeoverDialog
      useCases/form/                TicketForm + useTicketForm
      ui/                           presentational, hookless (TicketDate, TicketsEmpty, TicketsSkeleton)
      __tests__/                    view-model tests (renderHook) + TicketList state rendering
    shared/
      components/ui/                Empório DS (shadcn radix-nova) + sonner, skeleton, alert, alert-dialog
      lib/errorMessage.ts           toUserMessage(error): the only place that turns errors into copy
      lib/utils.ts                  cn
  trpc/                             client/RSC glue
    query-client.ts                 makeQueryClient (staleTime 30s; dehydrate pending queries)
    client.tsx                      'use client' — createTRPCContext<AppRouter>, TRPCReactProvider, httpBatchLink
    server.tsx                      'server-only' — getQueryClient = cache(...), trpc options proxy, HydrateClient, caller
  test-support/                     test-only helpers (exempt from import rules): ticketFactory, renderWithTrpc
e2e/                                tickets.spec.ts, routing.spec.ts, security.spec.ts
docs/decisions/  docs/research/  docs/superpowers/specs/
AGENTS.md  CLAUDE.md (@AGENTS.md)  README.md  .github/workflows/ci.yml
```
Why this shape:
- **`domain/` holds the business rules** (validation, limits, keyset pagination, error codes) as pure functions, testable without tRPC or React. It sits at the top level, not under `server/`, because the form imports the Zod schema as a *value* for `zodResolver`, and everything under `server/` is guarded by `server-only`.
- **`server/` is the backend:** the store is only persistence (an adapter over a `Map`), and the router holds the use cases. Swapping the store for a database touches `store.ts` only.
- **`client/` groups UI by domain and use case:** each use case pairs components with their view models; `ui/` holds hookless presentational pieces; `client/shared` holds the design system and the error-message function.
- **`app/` stays thin:** routing, layouts and the SSR prefetch only.
- **Import rules** (ESLint `no-restricted-imports`): `domain/` imports only `zod` and `shared/`; `client/` never imports `server/`; `server/` never imports `client/`; `app/` composes everything. Test files (`**/__tests__/**`) are exempt so view-model tests can wire the real router.

### 6.2 Data model and schemas (`domain/tickets/ticket.ts`)
```ts
Ticket = { id: string; title: string; description?: string; createdAt: number } // epoch ms
ticketInput  = z.object({ title: z.string().trim().min(1, "Title is required").max(120),
                          description: z.string().trim().max(2000).optional()
                                        .transform(v => v || undefined) })   // input type stays string | undefined
idInput      = z.object({ id: z.string().min(1) })   // no uuid check: a bad id is a NOT_FOUND, not a BAD_REQUEST
updateInput  = ticketInput.extend({ id: z.string().min(1) })   // full replacement, not a patch
listInput    = z.object({ limit: z.number().int().min(1).max(50).default(10), cursor: z.string().nullish() })   // over-max is rejected, not coerced
```
- `id`: `crypto.randomUUID()`. `createdAt`: epoch ms set by the store. Using a number timestamp (the statement says "timestamp") keeps the wire format JSON-native, so **no superjson transformer** is needed; the UI formats it with `Intl.DateTimeFormat('en-US', { timeZone: 'America/Campo_Grande', dateStyle: 'medium', timeStyle: 'short' })`. Locale and time zone are **pinned** so server and browser render the same text (no hydration mismatch); no relative times.
- An empty description becomes `undefined` via `.transform` (not `z.preprocess`, whose input type is `unknown`), so `z.input<typeof ticketInput>` keeps `description: string | undefined` for the form state and the tRPC client.
- `update` is a **full replacement** of title and description: clearing the description field clears it.
- Ids are validated only as non-empty strings, so `/tickets/foo/edit` reaches the store, misses, and renders the 404 page.

### 6.3 Domain rules and store
- **`domain/tickets/pagination.ts`** (pure; validated against Google AIP-158, Stripe, Slack, Relay, JSON:API cursor profile, Zalando and Microsoft guidelines — research 10):
  - **Order:** `createdAt desc, id desc`; `id` is the unique tie-breaker, so the order is total and stable. `createdAt` is server-assigned and immutable.
  - **Keyset, not offset:** the next page is the items strictly after the last returned item's key, so creating or deleting tickets while paging never skips or duplicates a row. A cursor whose item was deleted meanwhile stays valid (the key is compared, never looked up).
  - **Opaque cursor:** `base64url(JSON.stringify({ v: 1, t: createdAt, id }))`; decoded and validated with a Zod schema. Clients never parse it; `v` allows a future format change.
  - **Malformed cursor → `BAD_REQUEST` "Invalid cursor."** (fail fast, like Slack and JSON:API), never a silent restart that would duplicate rows in an infinite list.
  - **`limit + 1` fetch:** `nextCursor` is set only when an extra item exists, so a total that is an exact multiple of `limit` ends with `nextCursor: null` instead of an empty last page. `null` is the only end signal (no `hasMore`), as TanStack's `getNextPageParam` expects.
  - **`total`:** a point-in-time count (cheap at ≤1,000 in memory).
  - **Documented semantics (on the procedure and in the README):** every ticket that exists for the whole traversal appears exactly once; tickets created after page 1 appear on the next refresh, not mid-scroll; deleted tickets never appear afterwards; known edge: a ticket created in the same millisecond as the cursor with a lower id can appear mid-traversal (accepted).
  - Returns `{ items, nextCursor: string | null, total: number }`.
- **`server/tickets/store.ts`** (adapter): `createTicketStore({ seed = [], now = Date.now, newId = crypto.randomUUID } = {})` returns `{ list, get, create, update, remove }` over a `Map`, synchronous, no tRPC imports. Every fallible method returns `Result<T, TicketErrorCode>`: `get`/`update`/`remove` → `TICKET_NOT_FOUND` on a miss; `create` → `TICKET_LIMIT_REACHED` at `MAX_TICKETS` (1,000). It never throws for expected cases.
- **Seed is deterministic and idempotent:** fixed ids and fixed `createdAt` values (only user-created tickets use `randomUUID()`/`Date.now()`), so example URLs and the e2e's "newest seeded ticket" are stable. It is applied only when the store is created (`globalThis.__ticketStore ??= createTicketStore(seed)`): hot reload never re-seeds or duplicates; a restart resets to exactly the seed.
- Production instance: `getTicketStore()` keeps one seeded store on `globalThis` so Next dev HMR and the RSC/route-handler bundles share the same data (Prisma-singleton pattern). Tests create a fresh store per test through the context.
- Limits (README): data resets on restart; one copy per server process; not safe across instances.

### 6.4 tRPC
- Context: `{ store: getTicketStore() }`. The route handler and the RSC proxy both build it.
- `errorFormatter`: adds `zodError` (`z.flattenError(cause)` when the cause is a `ZodError`, Zod 4 API) and `domainCode` (the `TicketErrorCode` when the cause is a domain error) to `shape.data`, and masks `INTERNAL_SERVER_ERROR` messages in production (§6.13).
- Procedures: `list` (query, `listInput`), `byId` (query, `{ id }`), `create` (mutation, returns the ticket), `update` (mutation), `delete` (mutation, returns `{ id }`).
- Link: `httpBatchLink` with `getBaseUrl()`: `''` in the browser, `http://localhost:${PORT ?? 3000}` on the server, so a client query that ever runs during SSR still resolves. No `loggerLink` beyond dev.
- Route handler exports both `GET` and `POST` (queries use GET).

### 6.5 Rendering
- **List (`/`)**: `export const dynamic = 'force-dynamic'`. The page `await`s `getQueryClient().prefetchInfiniteQuery(trpc.ticket.list.infiniteQueryOptions({ limit: 10 }))` and renders `<HydrateClient><TicketList/></HydrateClient>`. The client uses `useSuspenseInfiniteQuery` with **the exact same input** (`PAGE_SIZE` constant shared) and `getNextPageParam: p => p.nextCursor` (never `initialPageParam`: tRPC reserves it). Result: the first page is in the server HTML, no client refetch on hydration, and later pages load client-side.
- **Edit (`/tickets/[id]/edit`)**: server `caller.ticket.byId` → `notFound()` on `NOT_FOUND` (via `.catch`, not a swallowing try/catch) → ticket passed as props to the form's initial state. No client query.
- **New (`/tickets/new`)**: plain client form.
- **404s are real HTTP 404s.** Any unmatched URL renders `app/not-found.tsx` with status 404. An unknown ticket id calls `notFound()` before anything streams, so the edit route's own `not-found.tsx` renders with status 404 too. That is why `loading.tsx` lives only in the `(board)` route group: a root `loading.tsx` would wrap every route in Suspense, the response would start streaming, and a later `notFound()` would ship status 200.
- **404 content follows the GOV.UK "Page not found" pattern:** the H1 and the tab title say "Page not found" / "Ticket not found" (`metadata.title`); plain, blame-free copy ("If you typed the web address, check it is correct. If you pasted the web address, check you copied the entire address." / "It may have been deleted, or the link may be incomplete."); one link back to the tickets; no "404" jargon, no "oops" or puns, no red warning text; the rail stays so navigation is consistent. Next marks not-found responses `noindex`. The root `app/not-found.tsx` covers unmatched URLs because the app has a single root layout, so the experimental `global-not-found` is not needed.
- **List total:** `ticket.list` also returns `total` (the store's size) for the header count ("24 open tickets").

### 6.6 Client behavior
- **Infinite scroll** (validated against WCAG 2.2, WAI-ARIA APG, NN/g and TanStack's own load-more example — research 11):
  - A plain list plus a real "Load more" button that is also the IntersectionObserver target (`rootMargin: "400px"`, observer disconnected on cleanup so StrictMode double-mounts are safe). Not the APG Feed pattern: its Page Up/Down model is not a standard convention, and a button meets 2.1.1.
  - Auto-fetch only when `hasNextPage && !isFetching && !isFetchNextPageError`: one request at a time, never during a background refetch, and no retry loop after a failure (the inline "Try again" is the only retry).
  - A `role="status"` `aria-atomic="true"` region, present from the first render, reads "Showing 30 of 1,000 tickets" (WCAG 4.1.3). When the load came from a click, focus moves to the first new row; never on observer-triggered loads.
  - The end reads "That's every ticket. The agent is still on shift." Nothing essential sits below the list (auto-load would make it unreachable).
  - `staleTime: 30_000`, so hydration and window focus don't refetch every loaded page.
  - No virtualization and no `maxPages` up to 1,000 rows (both break Ctrl+F and back-scroll); Lighthouse measures DOM size at load (~10 rows). Upgrade path in the README: `content-visibility: auto` on rows, then TanStack Virtual if measured INP degrades.
  - Back/forward keeps the loaded pages and scroll (Next router cache + TanStack cache within `gcTime`); a forward link to `/` starts again at page 1 (documented).
- **Delete**: each row owns a `useMutation` (per-row pending state: "Deleting…", button disabled, `aria-busy`). Confirm with `AlertDialog` naming the ticket ("Delete ticket" / "Keep it", §6.14). On success: remove the row from cached `pages` with `setQueryData` (keyset makes this safe) + `toast.success`. On error: `toast.error` with the server message. No optimistic rollback (single place shown).
- **Form**: `useTicketForm` owns React Hook Form (so `TicketForm` keeps exactly one hook call) and returns `{ control, onSubmit, formError, isSaving }` — `useForm<z.input<typeof ticketInput>, unknown, z.output<typeof ticketInput>>({ resolver: zodResolver(ticketInput), mode: 'onTouched', defaultValues: { title: '', description: '' }, values: ticket && { title: ticket.title, description: ticket.description ?? '' } })` (description mapped to `''` so inputs stay controlled); edit data syncs through `values`, never `useEffect` + `reset()`. Fields bind through `Controller` with label, control and error associated by ids (`aria-invalid`, `aria-describedby`); an invalid form never sends a request. Submission in the same view model: server `zodError.fieldErrors` → `setError` per field through a small pure helper (`applyServerFieldErrors`, unit-tested; in practice unreachable from the UI because the client runs the same schema, kept as defense); anything else (e.g. `NOT_FOUND` on a ticket deleted meanwhile) → `role="alert"` banner. Submit disabled and labelled "Saving…" while pending. Success: `queryClient.removeQueries(trpc.ticket.list.infiniteQueryFilter())` → `toast.success("Ticket created" | "Ticket updated")` → `router.push('/')`. Not `invalidateQueries`: on an infinite query it refetches every loaded page in sequence (100 requests with 1,000 tickets loaded). Removing first also avoids a flash of the old pages before the fresh SSR page 1 hydrates.
- **States**: `loading.tsx` skeleton; empty state as in §6.14; `error.tsx` with "Try again"; `not-found.tsx`.

### 6.7 Design system (ported from the Empório repo)
- Source: the Empório design-system source (a Vite app; `src/index.css`, `src/components/ui/*`, `src/lib/utils.ts`, `src/assets/{wordmark,avatar}.jpg`, `public/favicon.png`; brand docs in `.design/branding/emporio-da-musica/`).
- Copy `index.css` → `app/globals.css`, the 8 UI files → `client/shared/components/ui/`, `utils.ts` → `client/shared/lib/`, wordmark/avatar/favicon (`app/icon.png`). `components.json`: `rsc: true`, css path updated, style `radix-nova`, aliases `ui` → `@/client/shared/components/ui`, `utils` → `@/client/shared/lib/utils`.
- Add `"use client"` to dialog, label, avatar (select already has it).
- Tailwind via `@tailwindcss/postcss`; drop Vite files.
- Fonts: `next/font/google` Fraunces (SOFT/WONK/opsz, normal+italic) and Source Sans 3, exposed as CSS variables the tokens point to; README notes the swap from Fontsource (same intent: self-hosted, latin + latin-ext).
- Add shadcn `sonner` (theme hardcoded light, `CircleAlert` error icon), `skeleton`, `alert`, `alert-dialog`; `badge` only if used.
- Brand rules applied: cream canvas, walnut text, terracotta only on the one primary action per view ("New ticket" on the list, "Save" on the form), icon + word for every status, labels above inputs, Fraunces for the single page headline, sentence-case copy, no em dashes, no emoji except the easter egg (§6.8, owner-approved).

### 6.8 Easter egg: "Take over conversation"
- A secondary button on each ticket row opens a dialog: a short mocked preview of the customer's chat with the agent (static sample lines, same for every ticket, with the ticket title as the topic) under a locked overlay.
- Copy (owner-approved, §9.1):
  > 🔒 **Live handoff**
  > Designed, not built yet. Unlocks right after this candidate gets hired. 😉
- No backend, no model field. README "Next steps" mentions it in one line in the same tone.

### 6.9 Why this architecture and not another (research 05)
- **Kept from the references:** the `server/` + `trpc/` split (create-t3-app, tRPC v11 docs) and a thin router over a separate data module (midday).
- **Chosen on top:** domain-oriented folders (`domain/`, `server/<domain>`, `client/<domain>/useCases`) so business rules are pure and isolated, persistence is an adapter, and each UI use case pairs components with view models. With one entity this costs a few folders; each has one clear job, and a second domain would have an obvious place.
- **Rejected — bulletproof-react's `features/*/api` hooks:** with tRPC, `queryOptions`/`mutationOptions` already are that layer; wrapping them adds nothing.
- **Rejected — Feature-Sliced Design:** renamed layers, `app/` outside `src/` and re-exported routes; no place for the tRPC server.
- **Rejected — hexagonal ports/interfaces:** a port with one implementation is the smell §4 bans; the store adapter is a module, not an interface.

### 6.10 Component, state and typing rules (also in AGENTS.md)
- **Boundaries:** in app code, `'use client'` only on files a Server Component imports (`TicketList.tsx`, `TicketForm.tsx`, `trpc/client.tsx`) and on `app/error.tsx` and `app/global-error.tsx` (Next requires it); their imports are client automatically. `client/shared/components/ui` keeps shadcn's own directives (dialog, label, avatar, select, sonner, alert-dialog). Static chrome (headline, "New ticket" link, header) stays in server files.
- **Files:** one exported component per file; app components in PascalCase (`TicketList.tsx`) paired with `use{Name}.ts`; shadcn primitives keep shadcn's kebab-case. Named exports except Next special files. Props as a local `interface {Name}Props`; no `React.FC`. No barrels, no per-procedure files.
- **View-model pattern (MVVM):** every use-case component (list, row, form) makes exactly one behavioral hook call, its colocated view model `use{ComponentName}`, destructures the result and renders. No `useState`, `useEffect`, data or router hooks, and no handler logic in component bodies; JSX arrows only adapt arguments. The view model returns status flags as a discriminated union so guard clauses narrow the data. For the list, initial loading and load errors belong to Suspense and the error boundary (`loading.tsx`, `error.tsx`) because `useSuspenseInfiniteQuery` suspends and throws; `useTicketList` returns only `empty | content` plus next-page flags (`isFetchingNextPage`, `nextPageError`).
  - Presentational children and shadcn primitives stay hookless and get domain-typed props; a child gets its own view model only when it owns behavior (`TicketRow` owns delete). `TakeoverDialog` is static, so it has none.
  - Forms: `useTicketForm` owns `useForm`, submission and its side effects; `TicketForm` binds fields with the returned `control`.
  - Next special files (`error.tsx`, `global-error.tsx`) use the shared `useRouteErrorRetry` view model: `useQueryErrorResetBoundary().reset()` + `router.refresh()` + `reset()` inside `startTransition`, so "Try again" really refetches a failed suspense query.
  - View models call tRPC options directly (`useMutation(trpc.ticket.delete.mutationOptions(...))`): tRPC's typed `queryOptions`/`mutationOptions` already are the data-hook layer, so no wrapper hooks around them.
- **State:** server state only in TanStack Query (never copied, except as form initial values); form state in React Hook Form; dialog open state in the owning view model; the only URL state is `[id]`; no Context/Zustand/Redux.
- **Errors:** client validation errors come from `zodResolver`; server field errors (`error.data.zodError.fieldErrors`) go through `setError`, so both render through React Hook Form's single `formState.errors` path. Non-field server errors render in one `role="alert"` banner.
- **Types:** `Ticket` defined once in `domain/tickets/ticket.ts`; `z.input` for form state, `z.infer` for parsed input, `RouterOutputs` (`inferRouterOutputs<AppRouter>`) for data received from tRPC.
- **tsconfig (t3's):** `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `isolatedModules`, `moduleResolution: Bundler`. Not `exactOptionalPropertyTypes` (fights Zod `.optional()` and Radix props).
- **Typed routes:** `typedRoutes: true` (stable in 15.5); typecheck runs `next typegen && tsc --noEmit`; edit page uses `PageProps<'/tickets/[id]/edit'>`.
- **ESLint (t3's base + stricter):** `next/core-web-vitals`, typescript-eslint `recommendedTypeChecked` + `stylisticTypeChecked`, `consistent-type-imports`, `no-misused-promises` (attributes off), errors on `no-explicit-any`, `no-non-null-assertion`, `no-floating-promises`, `react/no-danger`.

### 6.14 Screens (direction A, "editorial ledger", owner-approved)
Mockups: `docs/design/mockups/directions.html` (A/B/C comparison) and `docs/design/mockups/screens-a.html` (every screen); research in `docs/research/07..09`.
- **Shell:** walnut wood rail with the 3px honey rule, store avatar (40px) + "Empório da Música" / "Team desk"; the wordmark never goes on the rail. Cream paper canvas with grain at .05. Content column 880px for the list, 36rem for forms.
- **List:** Fraunces H1 "Handed to you" + italic tagline; "From the store agent" badge (icon + word) and `total` count; terracotta "New ticket" pill with an `N` shortcut hint. Rows separated by hairlines, no boxed cards: title 17/600, two-line clamped description, date on the right in tabular numerals. The whole row links to edit. Hover/focus-within: walnut 4% tint, 3px honey bar on the left, and the date gives way to three icon buttons (take over, edit, delete; aria-labels; delete turns terracotta on hover only). On touch the actions sit in an always-visible menu button.
- **Infinite scroll:** next page shows two static skeleton rows (spruce blocks, no shimmer, no spinner); the end closes with "That's every ticket. The agent is still on shift." between hairlines; a failed page shows an inline spruce strip "Couldn't load more tickets." with a secondary "Try again".
- **Delete:** AlertDialog titled "Delete this ticket?" naming the ticket and stating the consequence; initial focus on the secondary "Keep it", destructive "Delete ticket" (oxblood). The row dims to "Deleting…" while pending, then collapses (fade + height, 200ms; reduced motion keeps the fade). Toasts bottom-center on paper with an icon + sentence: "Ticket deleted." / "Couldn't delete that ticket. Try again."
- **Form:** breadcrumb "All tickets", Fraunces H1 "New ticket" / "Edit ticket", italic tagline ("Log something the agent didn't catch." / "Handed over <date>"); fields in a spruce card; labels above, "Optional" beside Description; field errors under the field with CircleAlert ("Give the ticket a title."), first invalid field focused; character counter only past 80% of a limit; non-field errors in a paper banner with `role="alert"`; ghost "Cancel" + terracotta "Create ticket" / "Save changes" ("Saving…" while pending).
- **Takeover (easter egg):** dialog with the ticket title (Fraunces), a mocked transcript (walnut customer bubbles in Portuguese, spruce agent bubbles), the first two messages legible and the rest blurred under a tilted honey lock disc with the owner-approved copy; one secondary "Got it".
- **Empty state:** spruce panel with a line-art tuning-fork illustration, Fraunces "Quiet in the shop", "No tickets yet. When the agent hands a customer over, they'll land here.", primary "New ticket".
- **Mobile (<768px):** rail 52px, rows stacked with the menu button, sticky bottom bar with a full-width "New ticket" (safe-area padding, cream 92% + blur, top hairline); dialogs become sheets.
- **404s:** see §6.5 (GOV.UK pattern).
- **Copy rules:** sentence case, short, blame-free, no em dashes, no emoji outside the easter egg.

### 6.13 Error handling (end to end)
1. **Domain — errors are values.** `domain/tickets/errors.ts` defines `TICKET_ERROR = { NOT_FOUND: 'TICKET_NOT_FOUND', LIMIT_REACHED: 'TICKET_LIMIT_REACHED', INVALID_CURSOR: 'TICKET_INVALID_CURSOR' } as const` and the `TicketErrorCode` union; `shared/result.ts` defines `Result<T, E>`. Expected failures are returned, never thrown, so the type system forces callers to handle them.
2. **Server — one exhaustive map.** `server/tickets/errors.ts`: `toTRPCError: Record<TicketErrorCode, { code: TRPC_ERROR_CODE_KEY; message: string }>` (`TICKET_NOT_FOUND` → `NOT_FOUND` "Ticket not found."; `TICKET_LIMIT_REACHED` → `FORBIDDEN` "Ticket limit reached."; `TICKET_INVALID_CURSOR` → `BAD_REQUEST` "Invalid cursor."). A `Record` over the union fails the build if a new code is not mapped. The router throws `new TRPCError({ ...toTRPCError[code], cause: new TicketDomainError(code) })` so the formatter can expose `domainCode`. Input validation stays in Zod (`BAD_REQUEST` + `zodError.fieldErrors`).
3. **Unexpected errors — masked and logged.** Anything not a domain or validation error becomes `INTERNAL_SERVER_ERROR`; in production the formatter replaces its message with "Something went wrong." (tRPC would otherwise forward the original message) and never sends `stack`; the route handler's `onError` logs only internal errors on the server.
4. **Client — decide by code, in one place.** `client/shared/lib/errorMessage.ts` → `toUserMessage(error: unknown): string` reads `data.domainCode`, then `data.code`, and handles network failure (`TRPCClientError` without `data`: "Can't reach the server. Check your connection and try again."). Components never parse messages; view models call `toUserMessage` and expose plain strings/flags.
5. **UI — one channel per kind:**
   | Situation | Channel |
   |---|---|
   | Invalid field (client `zodResolver` or server `zodError`) | Message under the field via `formState.errors` / `setError` |
   | Non-field form error (not found, limit, network) | `role="alert"` banner in the form |
   | List action fails (delete) | Error toast; the row's button returns to idle |
   | Next page fails | Inline message + "Try again" (`fetchNextPage`) |
   | Page fails to load | `app/error.tsx` with "Try again" (`reset`) |
   | Unknown ticket id | `app/not-found.tsx` |
   | Root layout fails | `app/global-error.tsx` |
6. **Proof:** domain tests (miss → `TICKET_NOT_FOUND`, cap → `TICKET_LIMIT_REACHED`); router tests (each code → the right `TRPCError` code, message and `domainCode`); `toUserMessage` tests (one per code + network); view-model tests (NOT_FOUND → banner, delete error → error toast); a unit test calls the `errorFormatter` with an unexpected error and `isDev: false` (message masked, no `stack`); e2e on `pnpm start`: a NOT_FOUND response has no `stack`.

### 6.11 Security (research 06, checked in tRPC 11.25 / Next 15.5 source)
| Threat | Mitigation | Proof |
|---|---|---|
| Stored XSS (OWASP A03) | React escaping; `react/no-danger` lint | store test round-trips `<script>` as text; lint in CI |
| Cross-site form POST / CSRF (A01) | tRPC accepts only JSON/multipart/octet-stream; JSON needs a CORS preflight the app never grants; Zod object inputs reject `FormData`; `allowMethodOverride` off | HTTP test (§7.2): multipart POST to `ticket.delete` → 400 and ticket still exists; `text/plain` → 415 |
| Clickjacking (A05) | `frame-ancestors 'none'` | e2e header assertion |
| Memory DoS on the in-memory store (A04) | Zod max lengths, `limit ≤ 50`, **ticket cap 1,000** → `FORBIDDEN` "Ticket limit reached." | router test with a store at the cap |
| Batch amplification (A04) | `maxBatchSize: 10` on the handler, `maxItems: 10` on the link | HTTP test (§7.2): 11-call batch → 400 |
| Error leakage (A05) | stacks only in dev (`isDev`); `errorFormatter` masks `INTERNAL_SERVER_ERROR` messages in production; `onError` logs internals server-side (§6.13) | formatter + HTTP tests (§7.2); e2e on `pnpm start`: NOT_FOUND JSON has no `stack` |
| Vulnerable dependencies (A06) | lockfile, `--frozen-lockfile`, actions pinned to SHA, `permissions: contents: read`, `pnpm audit --prod --audit-level=high` | CI |
| No authentication (A07) | out of scope by statement | README limitations |
- `next.config.ts`: `poweredByHeader: false`; headers `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`. A nonce-based `script-src` needs middleware and dynamic rendering everywhere: README names it as the production step.
- `server-only` in `trpc/server.tsx` and every `server/*` module; Vitest aliases `server-only` to an empty module (it throws outside the `react-server` condition), so unit tests still import them.
- Skipped on purpose: rate limiting, CSRF tokens, nonce CSP/SRI, body-size middleware (a reverse proxy caps it in production), HSTS (localhost).

### 6.12 Performance (research 06)
- Server Components by default; client JS only at the two boundaries. **First Load JS per route from `next build` recorded in the README.**
- One awaited prefetch, no hydration refetch (`staleTime: 30_000`): **e2e asserts the server-rendered list (JS disabled) shows the newest ticket, and that no `ticket.list` request without a cursor fires on initial load** (the load-more observer may legitimately fetch page 2 if the first page fits the viewport).
- No manual `useMemo`/`useCallback`, no virtualization (pages of 10, cap 1,000), no React Compiler (experimental in 15), no `next/dynamic` for dialogs (Radix Dialog is already in the bundle via AlertDialog).
- Manual Lighthouse run on `pnpm build && pnpm start`, numbers in the README against targets LCP < 2.5 s, CLS < 0.1, TBT as the lab proxy for INP < 200 ms. No Lighthouse CI (flaky on runners).

## 7. Testing and CI

### 7.1 Shape
A pyramid weighted at the bottom: most guarantees come from pure domain tests and invariants, fewer from the UI layers, and a handful of e2e flows that need a real Next server.
- **Tools:** Vitest with two projects in one `vitest.config.mts` (`node` for `domain/`, `server/`, `client/shared/lib`; `jsdom` for `client/**/*.tsx` tests), `vite-tsconfig-paths`, `server-only` aliased to an empty module; `@testing-library/react`; fast-check; Playwright.
- **Naming and placement:** `*.test.ts(x)` in a `__tests__/` folder next to the code; e2e as `e2e/*.spec.ts`. One `describe` per unit; `it` names state the behavior ("returns TICKET_NOT_FOUND when the id is unknown"). Arrange / act / assert, one behavior per test.
- **Determinism:** the store takes injectable `now()` and `newId()`; fixtures come from `test-support/ticketFactory.ts` (`buildTicket`, `buildTickets(n)` with fixed ids and dates); fast-check runs with a fixed seed and prints it on failure; no sleeps or wall-clock assertions.
- **Isolation:** every test builds its own store (never the `globalThis` singleton); e2e deletes only what it created; Playwright runs with `workers: 1` because the server's store is shared.
- **Mocks:** never our own code. View models run against the real router through tRPC's `localLink`; only boundaries outside the app are mocked (`next/navigation`, `sonner`).
- **TDD in history:** each behavior is a pair `test(tickets): <behavior> (red)` → `feat(tickets): <behavior>`, built bottom-up: domain → store → router → HTTP → view models → components → e2e.
- **No coverage percentage gate:** invariants and flows are the guarantee; a % target rewards shallow tests.

### 7.2 Backend (Vitest `node`, no server, no network)
1. **Domain — `domain/tickets/__tests__/`**
   - `ticket.test.ts`: empty or whitespace title rejected with "Title is required"; 121 chars rejected; title trimmed; `""` description → `undefined`; 2,001 chars rejected.
   - `pagination.test.ts`: order `createdAt desc, id desc`; equal timestamps across a page boundary; cursor of a deleted item stays valid; empty store → `{ items: [], nextCursor: null, total: 0 }`; total = `limit`, = k·`limit` (no empty last page), = `limit` + 1; `limit` 1 and 50; full traversal of 1,000; cursor round-trip and base64url charset; malformed cursors (garbage, base64 of non-JSON, wrong `v`) → `INVALID_CURSOR`.
   - `pagination.property.test.ts` (fast-check, fixed seed): random stores up to 1,000 tickets with interleaved creates, deletes and next-page calls; invariants: no ticket twice, strictly descending, every page ≤ `limit`, every ticket present throughout appears exactly once, nothing after its deletion.
2. **Store — `server/tickets/__tests__/store.test.ts`:** `create` assigns `id`/`createdAt` from the injected `newId`/`now`; unknown id → `TICKET_NOT_FOUND` for `get`/`update`/`remove`; `update` replaces title and description and never changes `createdAt`; the 1,001st create → `TICKET_LIMIT_REACHED`; seed is deterministic and `getTicketStore()` returns one instance without re-seeding; a `<script>` title round-trips as literal text.
3. **Router — `server/tickets/__tests__/router.test.ts`** via `createCaller({ store })`: every procedure's output shape; validation (`BAD_REQUEST` + `zodError.fieldErrors.title`; `limit` 0, 51, negative, non-integer); the exhaustive error map (each `TicketErrorCode` → the right `TRPCError` code, message and `data.domainCode`); a full traversal through the router (cursor, `nextCursor`, `total` intact). `errorFormatter.test.ts`: unexpected error with `isDev: false` → "Something went wrong." and no `stack`; with `isDev: true` the original message.
4. **HTTP — `server/__tests__/http.test.ts`** calls `handleTrpcRequest(new Request(...), createContext)` with a fresh store: query via `GET` → 200; mutation with `text/plain` → 415; `multipart/form-data` mutation (form CSRF) → 400 and the ticket still exists; 11-call batch → 400 "Batch call exceeds maximum size"; unknown id → 404, empty title → 400, limit reached → 403 (tRPC JSON); no `stack` under `NODE_ENV=production`.

### 7.3 Frontend (Vitest `jsdom`)
- **View models — `client/tickets/__tests__/`**, rendered with `test-support/renderWithTrpc.tsx` (`QueryClientProvider` + `TRPCProvider` whose client uses `localLink` to the real `appRouter` with a fresh store):
  - `useTicketList`: flattens pages; `hasNextPage` false at the end; next-page error sets `nextPageError` and does not auto-retry (guard `!isFetchNextPageError`); status text "Showing N of M tickets".
  - `useTicketRow`: delete removes the row from cached pages; server error → error toast and the row stays.
  - `useTicketForm`: ticket removed meanwhile → `formError` banner; store at cap → limit banner; success → `removeQueries` on the list + success toast + `router.push('/')`.
  - `applyServerFieldErrors.test.ts`: maps `zodError.fieldErrors` to `setError` calls.
- **Component — `TicketList.test.tsx`** mocks `useTicketList` and asserts each returned state renders: empty, content, loading next page, next-page error with retry.
- **`client/shared/__tests__/errorMessage.test.ts`:** `toUserMessage` for each domain code, each tRPC code, and network failure.

### 7.4 End to end (Playwright, `pnpm build && pnpm start`, `workers: 1`)
- `tickets.spec.ts`: a browser context with JavaScript disabled shows the newest seeded ticket inside a list item (SSR markup); no `ticket.list` request without a cursor fires on initial load; scrolling to the end shows the end line; create → appears at the top → edit → delete (only the ticket the test created) with toasts.
- `routing.spec.ts`: `GET /does-not-exist` → 404 with "Page not found"; `GET /tickets/unknown-id/edit` → 404 with "Ticket not found".
- `security.spec.ts`: security headers on `GET /`; a NOT_FOUND response has no `stack`.

### 7.5 Commands and CI
| Command | Runs |
|---|---|
| `pnpm test` / `pnpm test:watch` | Vitest, both projects |
| `pnpm test:e2e` | Playwright against `pnpm build && pnpm start` |
| `pnpm check` | `next typegen` → lint → `tsc --noEmit` → `pnpm test` (green before every commit, except the red half of a TDD pair) |

CI (`.github/workflows/ci.yml`, one job, actions pinned to SHA, `permissions: contents: read`): `pnpm install --frozen-lockfile` → `pnpm check` → `pnpm audit --prod --audit-level=high` (blocking) → `pnpm build` → Playwright chromium → `pnpm test:e2e`.

## 8. Repository and documentation
- New public repo `emporio-tickets`. English everywhere. Conventional Commits, small commits, one branch per milestone with PRs (merge commits, no squash), never force-push.
- `README.md`: what it is (ticket = the statement's task, field mapping), how to run (`pnpm i && pnpm dev`, tests, e2e), architecture (tree + request flow SSR → hydrate → CSR), decisions (links to ADRs), limitations, next steps (DB + auth, deploy, live handoff).
- `docs/decisions/` (short ADRs): 0001 tRPC TanStack integration over classic; 0002 in-memory store on globalThis with injected factory; 0003 keyset cursor pagination; 0004 SSR via awaited prefetch + hydration; 0005 view-model pattern (MVVM) and React Hook Form over the shared Zod schema; 0006 Next 15.5 (not 16) and no superjson; 0007 domain-oriented folders (and why not feature-based/FSD/hexagonal); 0008 security posture (what is mitigated, what is skipped and why); 0009 error handling: Result + domain error codes + one client message function.
- `docs/research/01..11`: the research reports, neutral wording, each with its sources.
- `AGENTS.md` (+ `CLAUDE.md` with `@AGENTS.md`): commands, structure rules (client code never imports `server/`), TDD commit pairs, language policy.
- Before publishing: `git grep -iE "<personal-trace patterns>"` clean, no `.env`.

## 9. Builder calls (made during review)
- Next **15.5.x**, not 16: the statement names v15; "latest" read as latest within v15.
- Dates pinned to `en-US` + `America/Campo_Grande` (the store's zone).
- Id validated as non-empty string; bad ids are 404s.
- `update` replaces title and description.
- Server branch in `getBaseUrl()`.
- `pnpm audit` is a blocking CI gate: CI only runs on push/PR, and nothing is pushed after submission, so a later advisory can't turn an existing run red.

## 9.1 Owner decisions (2026-11-07)
- **Easter egg keeps the "hired" joke**, with the 🔒 and 😉 emoji: a deliberate, owner-approved exception to the no-job-search-wording and no-emoji rules, limited to the takeover dialog and one README line. The publish grep allows this one phrase.
- **Domain-oriented structure and error handling** (§6.1, §6.13): owner-approved on top of the research's flatter layout.
- **View-model pattern (MVVM) and React Hook Form**: overrides research 03/05, which recommended inline hooks and `useState`. Every use-case component pairs with a `use{Name}` view model; the form uses `useForm` + `zodResolver` (`useForm` is a hook, so the statement's "hooks to manage state" still holds).
- **English field names** (`title`, `description`, `createdAt`) with a README table mapping them to the statement's `titulo`, `descricao`, `dataCriacao`.

## 9.2 Main sources
- tRPC v11 docs (TanStack React Query integration, server components, error formatting, httpBatchLink) and `examples/next-minimal-starter`; `@trpc/server` 11.25.0 source (contentType, resolveResponse, TRPCError, formatter).
- create-t3-app 7.40.0 template (`src/server/api`, `src/trpc`, tsconfig, ESLint base).
- bulletproof-react (`docs/project-structure.md`, `docs/state-management.md`, `apps/nextjs-app`); Feature-Sliced Design Next.js guide.
- midday, unkey, openstatus, cal.com (structure comparison).
- TanStack Query v5 guides (infinite queries, optimistic updates, client vs server state) and its load-more example; TkDodo "React Query and Forms".
- Next.js 15 docs (project structure, server and client components, not-found, staleTimes, CSP guide, 15.5 release: typed routes); next@15.5.29 `config-shared.js`.
- Zod 4 docs (error formatting, v4 changelog); OWASP Top 10 2021; NN/g (confirmation dialogs, infinite scrolling).

## 10. Left to the builder
Seed ticket wording beyond the newest three, skeleton proportions, exact spacing within the approved mockups, commit granularity within the TDD pairs.

## 11. As built (deviations from this design, each recorded in the execution ledger)
- **No `(board)/loading.tsx`.** With it, the list streamed into a hidden Suspense boundary that only JavaScript reveals, so the JS-disabled SSR test failed. The store answers in milliseconds, so the page now renders the list straight into the HTML. Skeleton rows remain for the next page.
- **Dates** read "Nov 7, 10:42 AM" (`month: 'short', day, hour, minute`), matching the approved mockup; `dateStyle: 'medium'` would add the year.
- **Touch rows** show the three actions always instead of a menu button (no dropdown primitive for one use).
- **Paper grain** is a pre-rendered PNG tile: the SVG `feTurbulence` filter cost ~4 s of blocking time on Lighthouse's throttled CPU. **Fonts** load only the Latin subset and Fraunces without the WONK axis (580 KB → 293 KB).
- **Row links** don't prefetch (up to 1,000 rows); **e2e** runs on port 3100.
- `next>postcss` is overridden to `^8.5.18` to clear two high advisories pinned by Next 15.5.
- **Returning to the board keeps your place** (owner request after review): opening a ticket from the board marks it; Back, Cancel and saving an edit then step back in history, so the loaded pages and scroll position return. Saving an edit patches the row in the cache instead of `removeQueries`; only a create starts the board again from a fresh first page. A ticket opened from a pasted link still goes to `/`. Proven by three e2e tests.
- **Rows highlight on keyboard focus only** (`:focus-visible`): after a mouse delete, focus moves to the neighbouring row for keyboard users, and `focus-within` would have lit it as a second selected row.
