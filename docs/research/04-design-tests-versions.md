# Research 04 — Design system port, testing, versions

## A) Porting Empório DS (from the Empório design-system source, read-only)
- Copy: src/index.css → app/globals.css (font imports change); 8 ui components; lib/utils.ts (`export { cn } from "cn"`; ui files import `cn` pkg directly). Deps: radix-ui, class-variance-authority, lucide-react, tw-animate-css, shadcn (CSS imports shadcn/tailwind.css), cn. Assets: wordmark.jpg, avatar.jpg → public/; favicon.png → app/icon.png.
- Change: components.json rsc:true, css app/globals.css, keep style radix-nova. Add "use client" to dialog, label, avatar (select already has). button/card/input/textarea server-safe. Tailwind: @tailwindcss/vite → @tailwindcss/postcss + postcss.config.mjs; theme/tokens/dark/grain/arrive/breathe/reduced-motion port unchanged.
- Fonts: next/font/google (self-hosted at build, preload, size-adjusted fallbacks, no CLS) instead of @fontsource. Fraunces axes SOFT/WONK/opsz, normal+italic, var --font-fraunces; Source_Sans_3 var --font-source-sans; variables on <html>; tokens point to vars (hashed family names). Build needs network. STYLE.md says Fontsource — note swap in README (intent kept).
- Drop: vite.config (incl /api proxy), index.html → layout metadata lang="en", main.tsx, tsconfig.app/node, @vitejs/plugin-react, dist.
- Extra components (exist in radix-nova, verified via `shadcn view`): sonner, skeleton, alert, badge, alert-dialog. sonner imports next-themes → hardcode theme="light"; error icon CircleAlert strokeWidth 1.75; Toaster once in layout. badge per STYLE (spruce fill, walnut text, rounded-full, icon+word, never terracotta). alert-dialog destructive = oxblood. skeleton static.

## Brand rules (short)
Visual: cream canvas #FAF4EA + paper grain; spruce cards; walnut text; no blue/cool grey; no pure black/large gradients. Terracotta only on clickables, one primary action per view; buttons rounded-full 16px semibold sentence case. Inputs paper fill, 1px border-input, rounded-md, visible label above, 16px. Cards rounded-lg 12px, no border, p-6/p-8. Fraunces only one editorial headline per screen. Body Source Sans 3 16px; 13–14px metadata only. Status = icon + word. Lucide strokeWidth 1.75; aria-labels on icon buttons. Focus 2px walnut outline 2px offset. Reduced motion/data. Motion 150ms arrive. Centered layout, gap-4..6, 4px grid. Wood rail header (walnut + 3px honey bottom rule). Never: ALL CAPS, emoji in UI, robot/sparkle icons, decorative spinners.
Voice (EN): relaxed professional, honest, never salesy; sentence case, short; no em dashes; ≤1 exclamation; no emoji; no "happy to help"/"great question". Errors clear, blame-free. Empty states concrete ("No tickets yet. When a customer writes in, it shows up here."). Light musical touch only when it helps. "Empório" with accent.
NOTE: easter egg copy uses 😉 and the user wants it — conflicts with "no emoji in UI"; flag to user.

## B) Testing
- t3 ships no tests; exports createCaller = createCallerFactory(appRouter). tRPC docs: t.createCallerFactory(router)(ctx).
- Vitest env node; store as factory `createTicketStore()` injected via tRPC context → fresh store per test; prod context uses globalThis singleton. `rejects.toMatchObject({ code: 'BAD_REQUEST' })`.
- vitest.config.mts: vite-tsconfig-paths 6.1.1; include src/**/*.test.ts. Async Server Components not unit-testable → e2e.
- Playwright 1.65: webServer `pnpm build && pnpm start`, workers 1. One spec create→reload→edit→delete. Prove SSR via request.get('/') raw HTML or javaScriptEnabled:false.
- CI one job: checkout, pnpm/action-setup@v4, setup-node 22 cache pnpm, install --frozen-lockfile, lint (ESLint CLI; next lint deprecated 15.5), typecheck, test, build, playwright install chromium, test:e2e.

## C) Versions (npm view 2026-11-07)
next 16.4.5 latest; next@15 15.5.29 (backport, patched 2026-11-03); react 19.3.1; @trpc/* 11.25.0; @tanstack/react-query 5.107.1; zod 4.6.7; tailwindcss 4.3.5; vitest 5.1.0; @playwright/test 1.65.0.
Zod 4 + tRPC 11 OK (Standard Schema; tRPC dev dep zod ^4.2.1). Next 15.5 peer React ^19.0.0 OK.
Next 16 breaking: sync params/headers removed, Turbopack default, next lint removed, middleware→proxy, Node 20.9+, revalidateTag 2nd arg. Next 15.5: `next build --turbopack` beta → dev turbopack, webpack build.
Pick: Next 15.5.29, rest latest; write 16-ready (await params, no middleware, ESLint CLI).
