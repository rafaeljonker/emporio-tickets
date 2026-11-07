import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleTrpcRequest } from '@/server/http';
import { createTicketStore, type TicketStore } from '@/server/tickets/store';
import { buildTickets } from '@/test-support/ticketFactory';

const BASE = 'http://localhost/api/trpc';
const input = (value: unknown) => encodeURIComponent(JSON.stringify(value));
const contextFor = (store: TicketStore) => () => ({ store });
const fresh = (count = 25) => createTicketStore({ seed: buildTickets(count) });
const post = (path: string, body: BodyInit, contentType?: string) =>
  new Request(`${BASE}/${path}`, { method: 'POST', body, headers: contentType ? { 'content-type': contentType } : undefined });
const json = (path: string, body: unknown) => post(path, JSON.stringify(body), 'application/json');

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('handleTrpcRequest', () => {
  it('answers a query over GET', async () => {
    const res = await handleTrpcRequest(new Request(`${BASE}/ticket.list?input=${input({ limit: 10 })}`), contextFor(fresh()));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { result: { data: { items: unknown[] } } };
    expect(body.result.data.items).toHaveLength(10);
  });

  it('rejects a text/plain mutation with 415', async () => {
    const res = await handleTrpcRequest(post('ticket.delete', JSON.stringify({ id: 't-0001' }), 'text/plain'), contextFor(fresh()));
    expect(res.status).toBe(415);
  });

  it('rejects a form-encoded mutation and keeps the ticket', async () => {
    const store = fresh();
    const form = new FormData();
    form.set('id', 't-0001');
    const res = await handleTrpcRequest(post('ticket.delete', form), contextFor(store));
    expect(res.status).toBe(400);
    expect(store.get('t-0001').ok).toBe(true);
  });

  it('rejects a batch of 11 calls', async () => {
    const calls = Object.fromEntries(Array.from({ length: 11 }, (_, i) => [String(i), {}]));
    const paths = Array.from({ length: 11 }, () => 'ticket.list').join(',');
    const res = await handleTrpcRequest(new Request(`${BASE}/${paths}?batch=1&input=${input(calls)}`), contextFor(fresh()));
    expect(res.status).toBe(400);
    expect(await res.text()).toContain('Batch call exceeds maximum size');
  });

  it('maps domain and validation errors to HTTP status codes', async () => {
    expect((await handleTrpcRequest(json('ticket.update', { id: 'missing', title: 'x' }), contextFor(fresh()))).status).toBe(404);
    expect((await handleTrpcRequest(json('ticket.create', { title: '' }), contextFor(fresh()))).status).toBe(400);
    expect((await handleTrpcRequest(json('ticket.create', { title: 'One too many' }), contextFor(fresh(1000)))).status).toBe(403);
  });

  it('sends no stack trace in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    const { handleTrpcRequest: prodHandler } = await import('@/server/http');
    const res = await prodHandler(json('ticket.update', { id: 'missing', title: 'x' }), contextFor(fresh()));
    expect(res.status).toBe(404);
    expect(await res.text()).not.toContain('"stack"');
  });
});
