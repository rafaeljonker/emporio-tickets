import { TRPCError } from '@trpc/server';
import { describe, expect, it } from 'vitest';
import { TicketDomainError } from '@/domain/tickets/errors';
import { formatError } from '@/server/trpc';

const internal = () =>
  new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'db password leaked', cause: new Error('db password leaked') });
const shapeOf = (error: TRPCError) => ({
  message: error.message,
  code: -32603,
  data: { code: error.code, httpStatus: 500, stack: 'at secret.ts:1' },
});

describe('formatError', () => {
  it('masks unexpected errors in production', () => {
    const error = internal();
    const shape = formatError({ shape: shapeOf(error), error, isDev: false });
    expect(shape.message).toBe('Something went wrong.');
    expect(shape.data).not.toHaveProperty('stack');
  });

  it('keeps the original message in development', () => {
    const error = internal();
    expect(formatError({ shape: shapeOf(error), error, isDev: true }).message).toBe('db password leaked');
  });

  it('exposes the domain code of a domain error', () => {
    const error = new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found.', cause: new TicketDomainError('TICKET_NOT_FOUND') });
    const shape = formatError({ shape: { message: error.message, code: -32004, data: { code: 'NOT_FOUND', httpStatus: 404 } }, error, isDev: false });
    expect(shape.data.domainCode).toBe('TICKET_NOT_FOUND');
    expect(shape.data.zodError).toBeNull();
  });
});
