# 0009. Error handling: Result values, domain codes, one message function

## Context
Errors cross three boundaries (store → router → HTTP → UI) and each needs the right shape: a value the code must handle, a status the client understands, and copy a person can act on.

## Decision
1. The domain returns `Result<T, TicketErrorCode>`; expected failures are never thrown.
2. `toTRPCError` is a `Record` over every code (a new code fails the build until mapped): `TICKET_NOT_FOUND` → 404 "Ticket not found.", `TICKET_LIMIT_REACHED` → 403, `TICKET_INVALID_CURSOR` → 400. The formatter exposes `domainCode` and Zod field errors.
3. Unexpected errors become "Something went wrong." in production, without a stack, and are logged on the server.
4. `toUserMessage` is the only place an error becomes copy, deciding by code (including network failure).
5. Each kind of error has one UI channel: field message, form banner, toast, inline retry, error page, or 404 page.

## Consequences
Components never parse error messages, and every mapping has a test.

## Alternatives
Throwing domain exceptions: shorter, but nothing forces callers to handle them.

Sources: research 06; spec section 6.13.
