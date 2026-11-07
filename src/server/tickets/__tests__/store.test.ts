import { describe, expect, it } from 'vitest';
import { NEWEST_SEEDED_TITLE, seedTickets } from '@/server/tickets/seed';
import { createTicketStore, getTicketStore } from '@/server/tickets/store';
import { buildTickets } from '@/test-support/ticketFactory';

const fixed = () => ({ now: () => 1_000, newId: () => 'new-id' });

describe('createTicketStore', () => {
  it('creates a ticket with the injected id and clock', () => {
    const store = createTicketStore(fixed());
    const created = store.create({ title: 'Restring a Strat', description: undefined });
    expect(created).toEqual({ ok: true, data: { id: 'new-id', title: 'Restring a Strat', description: undefined, createdAt: 1_000 } });
    expect(store.get('new-id')).toEqual(created);
  });

  it.each(['get', 'remove'] as const)('%s returns TICKET_NOT_FOUND for an unknown id', (method) => {
    expect(createTicketStore()[method]('missing')).toEqual({ ok: false, error: 'TICKET_NOT_FOUND' });
  });

  it('update returns TICKET_NOT_FOUND for an unknown id', () => {
    expect(createTicketStore().update('missing', { title: 'x', description: undefined })).toEqual({ ok: false, error: 'TICKET_NOT_FOUND' });
  });

  it('update replaces title and description and keeps createdAt', () => {
    const store = createTicketStore({ seed: [{ id: 'a', title: 'Old', description: 'Old text', createdAt: 42 }] });
    expect(store.update('a', { title: 'New', description: undefined })).toEqual({
      ok: true,
      data: { id: 'a', title: 'New', description: undefined, createdAt: 42 },
    });
  });

  it('remove deletes the ticket', () => {
    const store = createTicketStore({ seed: buildTickets(2) });
    expect(store.remove('t-0001')).toEqual({ ok: true, data: { id: 't-0001' } });
    expect(store.size()).toBe(1);
  });

  it('refuses to create past 1000 tickets', () => {
    const store = createTicketStore({ seed: buildTickets(1000) });
    expect(store.create({ title: 'One too many', description: undefined })).toEqual({ ok: false, error: 'TICKET_LIMIT_REACHED' });
    expect(store.size()).toBe(1000);
  });

  it('stores markup as literal text', () => {
    const store = createTicketStore(fixed());
    store.create({ title: '<script>alert(1)</script>', description: undefined });
    const stored = store.get('new-id');
    expect(stored.ok && stored.data.title).toBe('<script>alert(1)</script>');
  });

  it('lists through keyset pagination', () => {
    const store = createTicketStore({ seed: buildTickets(25) });
    const page = store.list({ limit: 10 });
    expect(page.ok && page.data.items.map((t) => t.id)[0]).toBe('t-0001');
    expect(page.ok && page.data.total).toBe(25);
  });
});

describe('seed', () => {
  it('has 25 tickets with unique ids', () => {
    expect(seedTickets).toHaveLength(25);
    expect(new Set(seedTickets.map((t) => t.id)).size).toBe(25);
  });

  it('puts the piano quote first', () => {
    const page = createTicketStore({ seed: seedTickets }).list({ limit: 1 });
    expect(page.ok && page.data.items[0]?.title).toBe(NEWEST_SEEDED_TITLE);
  });

  it('includes two tickets that share a timestamp', () => {
    expect(new Set(seedTickets.map((t) => t.createdAt)).size).toBe(24);
  });

  it('is applied once to a single shared store', () => {
    expect(getTicketStore()).toBe(getTicketStore());
    expect(getTicketStore().size()).toBe(25);
  });
});
