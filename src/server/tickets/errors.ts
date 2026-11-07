import 'server-only';
import { TRPCError } from '@trpc/server';
import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';
import { TicketDomainError, type TicketErrorCode } from '@/domain/tickets/errors';
import type { Result } from '@/shared/result';

/** Exhaustive over the union: a new domain code fails the build until it is mapped here. */
export const toTRPCError: Record<TicketErrorCode, { code: TRPC_ERROR_CODE_KEY; message: string }> = {
  TICKET_NOT_FOUND: { code: 'NOT_FOUND', message: 'Ticket not found.' },
  TICKET_LIMIT_REACHED: { code: 'FORBIDDEN', message: 'Ticket limit reached.' },
  TICKET_INVALID_CURSOR: { code: 'BAD_REQUEST', message: 'Invalid cursor.' },
};

export function unwrap<T>(result: Result<T, TicketErrorCode>): T {
  if (result.ok) return result.data;
  throw new TRPCError({ ...toTRPCError[result.error], cause: new TicketDomainError(result.error) });
}
