import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTicketCount } from '@/client/tickets/useCases/list/useTicketCount';
import type { TicketPage } from '@/domain/tickets/pagination';
import { PAGE_SIZE } from '@/domain/tickets/ticket';
import { createTicketStore } from '@/server/tickets/store';
import { renderWithTrpc } from '@/test-support/renderWithTrpc';
import { buildTickets } from '@/test-support/ticketFactory';
import { useTRPC } from '@/trpc/client';

describe('useTicketCount', () => {
  it('counts open tickets from the list query and follows cache updates', async () => {
    const { result, queryClient } = renderWithTrpc(() => ({ count: useTicketCount(), trpc: useTRPC() }), {
      store: createTicketStore({ seed: buildTickets(25) }),
    });
    await waitFor(() => expect(result.current?.count.label).toBe('25 open tickets'));
    const key = result.current?.trpc.ticket.list.infiniteQueryKey({ limit: PAGE_SIZE });
    act(() => {
      queryClient.setQueryData<{ pages: TicketPage[]; pageParams: unknown[] }>(key, (old) =>
        old && { ...old, pages: old.pages.map((p) => ({ ...p, total: 1 })) },
      );
    });
    expect(result.current?.count.label).toBe('1 open ticket');
  });
});
