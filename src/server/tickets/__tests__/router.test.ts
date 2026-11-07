import { TRPCError } from '@trpc/server';
import { describe, expect, it } from 'vitest';
import { TICKET_ERROR, TicketDomainError } from '@/domain/tickets/errors';
import { createCaller } from '@/server/root';
import { toTRPCError } from '@/server/tickets/errors';
import { createTicketStore } from '@/server/tickets/store';
import { createTRPCContext, formatError } from '@/server/trpc';
import { buildTickets } from '@/test-support/ticketFactory';

const callerWith = (count = 25) => createCaller(createTRPCContext({ store: createTicketStore({ seed: buildTickets(count) }) }));

async function rejection(promise: Promise<unknown>): Promise<TRPCError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof TRPCError) return error;
    throw error;
  }
  throw new Error('expected the call to reject');
}

describe('ticket router', () => {
  it('lists the first page with a cursor and the total', async () => {
    const page = await callerWith().ticket.list({ limit: 10 });
    expect(page.items).toHaveLength(10);
    expect(typeof page.nextCursor).toBe('string');
    expect(page.total).toBe(25);
  });

  it('follows cursors to the end, visiting every ticket once', async () => {
    const caller = callerWith();
    const ids: string[] = [];
    let cursor: string | null = null;
    do {
      const page = await caller.ticket.list({ limit: 10, cursor });
      ids.push(...page.items.map((t) => t.id));
      cursor = page.nextCursor;
    } while (cursor);
    expect(ids).toEqual(buildTickets(25).map((t) => t.id));
  });

  it('creates, reads, updates and deletes a ticket', async () => {
    const caller = callerWith(0);
    const created = await caller.ticket.create({ title: 'Restring a Strat' });
    expect(await caller.ticket.byId({ id: created.id })).toEqual(created);
    const updated = await caller.ticket.update({ id: created.id, title: 'Restring a Telecaster', description: '010 gauge' });
    expect(updated).toMatchObject({ title: 'Restring a Telecaster', description: '010 gauge', createdAt: created.createdAt });
    expect(await caller.ticket.delete({ id: created.id })).toEqual({ id: created.id });
  });

  it('rejects an empty title with a field error', async () => {
    const error = await rejection(callerWith().ticket.create({ title: '' }));
    expect(error.code).toBe('BAD_REQUEST');
    const shape = formatError({ shape: { message: error.message, code: -32600, data: { code: 'BAD_REQUEST', httpStatus: 400 } }, error, isDev: false });
    expect(shape.data.zodError?.fieldErrors.title).toContain('Title is required');
  });

  it.each([0, 51, -1, 1.5])('rejects a limit of %s', async (limit) => {
    expect((await rejection(callerWith().ticket.list({ limit }))).code).toBe('BAD_REQUEST');
  });

  it('rejects a malformed cursor with the domain code', async () => {
    const error = await rejection(callerWith().ticket.list({ limit: 10, cursor: 'garbage' }));
    expect(error).toMatchObject({ code: 'BAD_REQUEST', message: 'Invalid cursor.' });
    expect(error.cause).toBeInstanceOf(TicketDomainError);
    expect((error.cause as TicketDomainError).code).toBe('TICKET_INVALID_CURSOR');
  });

  it.each(['byId', 'delete'] as const)('%s on an unknown id is NOT_FOUND', async (procedure) => {
    const error = await rejection(callerWith().ticket[procedure]({ id: 'missing' }));
    expect(error).toMatchObject({ code: 'NOT_FOUND', message: 'Ticket not found.' });
  });

  it('update on an unknown id is NOT_FOUND', async () => {
    const error = await rejection(callerWith().ticket.update({ id: 'missing', title: 'x' }));
    expect(error).toMatchObject({ code: 'NOT_FOUND', message: 'Ticket not found.' });
  });

  it('refuses to create past the cap', async () => {
    const error = await rejection(callerWith(1000).ticket.create({ title: 'One too many' }));
    expect(error).toMatchObject({ code: 'FORBIDDEN', message: 'Ticket limit reached.' });
  });

  it.each(Object.values(TICKET_ERROR))('maps %s to a tRPC error', (code) => {
    expect(toTRPCError[code]).toBeDefined();
  });
});
