import { act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTicketList, type UseTicketListResult } from '@/client/tickets/useCases/list/useTicketList';
import type { TicketPage } from '@/domain/tickets/pagination';
import { PAGE_SIZE } from '@/domain/tickets/ticket';
import { createTicketStore, type TicketStore } from '@/server/tickets/store';
import { installIntersectionObserver } from '@/test-support/intersectionObserver';
import { renderWithTrpc } from '@/test-support/renderWithTrpc';
import { buildTickets } from '@/test-support/ticketFactory';
import { useTRPC } from '@/trpc/client';

type Content = Extract<UseTicketListResult, { kind: 'content' }>;

function content(list: { current: UseTicketListResult | null }): Content {
  const value = list.current;
  if (value?.kind !== 'content') throw new Error(`expected content, got ${value?.kind ?? 'nothing'}`);
  return value;
}

let observer: ReturnType<typeof installIntersectionObserver>;

beforeEach(() => {
  observer = installIntersectionObserver();
});

function renderList(store: TicketStore) {
  const rendered = renderWithTrpc(() => ({ list: useTicketList(), trpc: useTRPC() }), { store });
  const list = {
    get current() {
      return rendered.result.current?.list ?? null;
    },
  };
  const button = document.createElement('button');
  return { ...rendered, list, attach: () => act(() => content(list).loadMoreRef(button)) };
}

describe('useTicketList', () => {
  it('starts with the first page and a status line', async () => {
    const { list } = renderList(createTicketStore({ seed: buildTickets(25) }));
    await waitFor(() => expect(content(list).tickets).toHaveLength(10));
    expect(content(list).statusText).toBe('Showing 10 of 25 tickets');
    expect(content(list).hasNextPage).toBe(true);
  });

  it('is empty only when there are no tickets at all', async () => {
    const { list } = renderList(createTicketStore());
    await waitFor(() => expect(list.current?.kind).toBe('empty'));
  });

  it('loads one page per visibility trigger and stops at the end', async () => {
    const base = createTicketStore({ seed: buildTickets(25) });
    const listSpy = vi.fn((input: Parameters<TicketStore["list"]>[0]) => base.list(input));
    const { list, attach } = renderList({ ...base, list: listSpy });
    await waitFor(() => expect(content(list).tickets).toHaveLength(10));
    attach();
    act(() => {
      observer.trigger();
      observer.trigger();
    });
    await waitFor(() => expect(content(list).tickets).toHaveLength(20));
    expect(listSpy).toHaveBeenCalledTimes(2);
    act(() => observer.trigger());
    await waitFor(() => expect(content(list).hasNextPage).toBe(false));
    expect(content(list).statusText).toBe('Showing 25 of 25 tickets');
  });

  it('keeps loading when every visible row was deleted but more exist', async () => {
    const { list, attach, queryClient, result, store } = renderList(createTicketStore({ seed: buildTickets(25) }));
    await waitFor(() => expect(content(list).tickets).toHaveLength(10));
    const visible = content(list).tickets.map((t) => t.id);
    for (const id of visible) store.remove(id);
    const key = result.current?.trpc.ticket.list.infiniteQueryKey({ limit: PAGE_SIZE });
    act(() => {
      queryClient.setQueryData<{ pages: TicketPage[]; pageParams: unknown[] }>(key, (old) =>
        old && { ...old, pages: old.pages.map((p) => ({ ...p, items: [], total: p.total - visible.length })) },
      );
    });
    expect(list.current?.kind).toBe('content');
    attach();
    act(() => observer.trigger());
    await waitFor(() => expect(content(list).tickets).toHaveLength(10));
  });

  it('stops auto-loading after a failed page until retried', async () => {
    const base = createTicketStore({ seed: buildTickets(25) });
    let calls = 0;
    const listSpy = vi.fn((input: Parameters<TicketStore['list']>[0]) => {
      calls += 1;
      return calls === 2 ? ({ ok: false, error: 'TICKET_INVALID_CURSOR' } as const) : base.list(input);
    });
    const { list, attach } = renderList({ ...base, list: listSpy });
    await waitFor(() => expect(content(list).tickets).toHaveLength(10));
    attach();
    act(() => observer.trigger());
    await waitFor(() => expect(content(list).nextPageError).toBe("Couldn't load more tickets. Try again."));
    act(() => observer.trigger());
    expect(listSpy).toHaveBeenCalledTimes(2);
    act(() => content(list).handleRetry());
    await waitFor(() => expect(content(list).tickets).toHaveLength(20));
    expect(listSpy).toHaveBeenCalledTimes(3);
  });
});
