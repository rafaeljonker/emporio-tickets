import 'server-only';
import { initTRPC, type TRPCError } from '@trpc/server';
import { z, ZodError } from 'zod';
import { TicketDomainError } from '@/domain/tickets/errors';
import { getTicketStore, type TicketStore } from './tickets/store';

export type Context = { store: TicketStore };

/** Shared by the HTTP route and the RSC caller; tests pass their own store. */
export function createTRPCContext(opts: { store?: TicketStore } = {}): Context {
  return { store: opts.store ?? getTicketStore() };
}

const isDev = process.env.NODE_ENV !== 'production';

type BaseShape = { message: string; data: object };

/**
 * Adds what the client decides on (field errors, domain code) and hides internals:
 * tRPC forwards the original message of unexpected errors even in production.
 */
export function formatError<S extends BaseShape>({ shape, error, isDev }: { shape: S; error: TRPCError; isDev: boolean }) {
  const { cause } = error;
  const masked = error.code === 'INTERNAL_SERVER_ERROR' && !isDev;
  const data: Record<string, unknown> = { ...shape.data };
  if (masked) delete data.stack;
  return {
    ...shape,
    message: masked ? 'Something went wrong.' : shape.message,
    data: {
      ...(data as S['data']),
      // Inputs are objects, so field errors are keyed by field name.
      zodError: cause instanceof ZodError ? z.flattenError(cause as ZodError<Record<string, unknown>>) : null,
      domainCode: cause instanceof TicketDomainError ? cause.code : null,
    },
  };
}

const t = initTRPC.context<Context>().create({
  isDev,
  errorFormatter: ({ shape, error }) => formatError({ shape, error, isDev }),
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
