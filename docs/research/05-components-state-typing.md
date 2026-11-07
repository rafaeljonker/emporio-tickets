# Research 05 — Architecture schools, components, state, typing

## 1. Architecture: keep server/ + trpc/ + app/_components + lib/
- create-t3-app: same split (cli/template/extras/src/{trpc/react.tsx, trpc/server.ts, app/_components/post.tsx}).
- bulletproof-react Next variant: route-only UI in app/**/_components (apps/nextjs-app/src/app/app/discussions/_components/discussions.tsx); features/* only for cross-route code; its features/*/api wrap REST into hooks (delete-discussion.ts) — with tRPC, mutationOptions() already is that layer → wrappers around wrappers. docs/project-structure.md: "You don't need all of these folders for every feature"; main goal (no cross-feature imports) moot with one entity.
- Feature-Sliced Design (feature-sliced.design/docs/guides/tech/with-nextjs): renames layers to _app/_pages, app/ outside src/, routes re-export → indirection for 3 routes; frontend-only, no place for tRPC server.
- Clean/hexagonal: ports with one implementation = smell; pure store + thin router gives same testability.
- Reviewer flags — over: features/ with one child, barrels, per-procedure files, repo interfaces, hook per mutation. Under: client reaching server/, duplicated schema, 400-line component.

## 2. Components
- 'use client' at the boundary only (Next docs server-and-client-components: imports of a client file are already client). ticket-list.tsx, ticket-form.tsx; row/dialog redundant. Pick one rule, document.
- Static chrome (headline, "New ticket" link) in server files (Next "Reducing JS bundle size").
- Hooks inline (t3 post-tw.tsx useMutation inline). No useDeleteTicket/useTicketForm; extract on second caller or if form logic > ~40 lines (colocated use-ticket-form.ts). Pure helpers (error mapping) if form > ~150 lines.
- Server→client props serializable (createdAt number).

## 3. State
Server state: TanStack Query only (TanStack "does this replace client state"). Form: useState seeded from server data as initial only (TkDodo "React Query and Forms"). URL: [id] only; cursors not in URL. Local UI: dialog open state. No global store (bulletproof state-management.md: keep state close). Deviation: bulletproof recommends RHF — statement + 2 fields justify useState (ADR 0005).

## 4. Typing
- tsconfig = t3 (cli/template/base/tsconfig.json): strict, noUncheckedIndexedAccess, verbatimModuleSyntax, isolatedModules, moduleDetection force, moduleResolution Bundler. Skip exactOptionalPropertyTypes (Zod .optional() infers T|undefined; .exactOptional() only since 4.3.1; Radix prop spreads break). Skip noImplicitOverride (no classes).
- Types: z.input for form state; z.infer for parsed; inferRouterOutputs (RouterOutputs) for received data; Ticket defined once in lib/ticket-schema.ts.
- ESLint (t3 _eslint.base.js): recommendedTypeChecked + stylisticTypeChecked, consistent-type-imports inline, no-misused-promises checksVoidReturn attributes false; add no-explicit-any, no-non-null-assertion, no-floating-promises errors. strictTypeChecked fires on cursor template/toast callbacks → skip or accept tweaks.
- typedRoutes stable top-level in 15.5 (nextjs.org/blog/next-15-5); CI runs `next typegen && tsc --noEmit`; global PageProps<'/tickets/[id]/edit'>.

## Disagreements
features/tickets colocation reads as "scales" to some — but schema shared with server/ belongs in lib/. Redundant 'use client' as documentation has defenders — be consistent.
