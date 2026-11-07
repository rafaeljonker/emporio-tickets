import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor, paginate } from '@/domain/tickets/pagination';
import type { Ticket } from '@/domain/tickets/ticket';
import { buildTicket, buildTickets } from '@/test-support/ticketFactory';

function pageOrFail(...args: Parameters<typeof paginate>) {
  const result = paginate(...args);
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

function traverse(tickets: readonly Ticket[], limit: number): string[] {
  const seen: string[] = [];
  let cursor: string | null = null;
  do {
    const page = pageOrFail(tickets, { limit, cursor });
    expect(page.items.length).toBeLessThanOrEqual(limit);
    seen.push(...page.items.map((t) => t.id));
    cursor = page.nextCursor;
  } while (cursor !== null);
  return seen;
}

const base64url = (text: string) => btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

describe('paginate', () => {
  it('orders by createdAt desc, then id desc', () => {
    const tickets = [buildTicket({ id: 'a', createdAt: 5 }), buildTicket({ id: 'b', createdAt: 5 }), buildTicket({ id: 'c', createdAt: 9 })];
    expect(pageOrFail(tickets, { limit: 10 }).items.map((t) => t.id)).toEqual(['c', 'b', 'a']);
  });

  it('returns an empty page for an empty store', () => {
    expect(pageOrFail([], { limit: 10 })).toEqual({ items: [], nextCursor: null, total: 0 });
  });

  it('ends without an empty page when total is a multiple of limit', () => {
    const tickets = buildTickets(20);
    const first = pageOrFail(tickets, { limit: 10 });
    const second = pageOrFail(tickets, { limit: 10, cursor: first.nextCursor });
    expect(second.items).toHaveLength(10);
    expect(second.nextCursor).toBeNull();
  });

  it('returns a cursor when total is limit + 1', () => {
    const tickets = buildTickets(11);
    const first = pageOrFail(tickets, { limit: 10 });
    expect(first.nextCursor).not.toBeNull();
    const second = pageOrFail(tickets, { limit: 10, cursor: first.nextCursor });
    expect(second.items).toHaveLength(1);
    expect(second.nextCursor).toBeNull();
  });

  it('reports the total at the time of the request', () => {
    expect(pageOrFail(buildTickets(25), { limit: 10 }).total).toBe(25);
  });

  it('keeps a cursor valid after its ticket is deleted', () => {
    const tickets = buildTickets(25);
    const first = pageOrFail(tickets, { limit: 10 });
    const lastOfFirst = first.items.at(-1)?.id;
    const remaining = tickets.filter((t) => t.id !== lastOfFirst);
    const second = pageOrFail(remaining, { limit: 10, cursor: first.nextCursor });
    expect(second.items[0]?.id).toBe('t-0011');
  });

  it('splits equal timestamps across a page boundary without loss', () => {
    const tickets = buildTickets(15, { stepMs: 0 });
    const ids = traverse(tickets, 10);
    expect(ids).toHaveLength(15);
    expect(new Set(ids).size).toBe(15);
  });

  it.each([1, 50])('traverses 1000 tickets exactly once in order with limit %i', (limit) => {
    const tickets = buildTickets(1000);
    expect(traverse(tickets, limit)).toEqual(tickets.map((t) => t.id));
  });

  it('rejects a malformed cursor', () => {
    expect(paginate(buildTickets(3), { limit: 10, cursor: 'garbage' })).toEqual({ ok: false, error: 'TICKET_INVALID_CURSOR' });
  });
});

describe('cursor', () => {
  it('round-trips through encode and decode', () => {
    expect(decodeCursor(encodeCursor({ createdAt: 123, id: 'x' }))).toEqual({ ok: true, data: { t: 123, id: 'x' } });
  });

  it('is base64url text', () => {
    expect(encodeCursor({ createdAt: 1_794_000_000_000, id: 'çã/+?' })).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it.each([
    ['garbage', '***'],
    ['base64 of non-JSON', base64url('not json')],
    ['an unknown version', base64url('{"v":2,"t":1,"id":"x"}')],
    ['a missing id', base64url('{"v":1,"t":1}')],
  ])('rejects %s', (_label, cursor) => {
    expect(decodeCursor(cursor)).toEqual({ ok: false, error: 'TICKET_INVALID_CURSOR' });
  });
});
