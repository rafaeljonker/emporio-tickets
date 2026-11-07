# 0007. Domain-oriented folders

## Context
One entity, five procedures, three screens. The structure should be obvious to a reviewer and leave a clear place for a second domain without ceremony.

## Decision
`src/domain` (pure rules: schemas, limits, pagination, error codes; imports only Zod), `src/server` (store adapter, router, HTTP handler; `server-only`), `src/client/<domain>/useCases` (components with their view models) plus `ui/` for hookless pieces, `src/trpc` (client and RSC glue), and `src/app` (thin routes). ESLint enforces the import rules between them.

## Consequences
- Business rules are testable without tRPC or React; persistence is a single swappable module.
- The domain sits at the top level because the form imports its Zod schema as a value; everything under `server/` is guarded by `server-only`.

## Alternatives
- Feature folders with an `api/` hook layer: wraps tRPC's options in more hooks.
- Feature-Sliced Design: renamed layers and re-exported routes for three pages.
- Hexagonal ports: an interface with one implementation.

Sources: create-t3-app, tRPC examples, midday, unkey, openstatus, cal.com, bulletproof-react, Feature-Sliced Design; research 02, 05.
