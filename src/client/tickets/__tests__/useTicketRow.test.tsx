import { act, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTicketList, type UseTicketListResult } from '@/client/tickets/useCases/list/useTicketList';
import { useTicketRow } from '@/client/tickets/useCases/list/useTicketRow';
import { createTicketStore, type TicketStore } from '@/server/tickets/store';
import { installIntersectionObserver } from '@/test-support/intersectionObserver';
import { renderWithTrpc } from '@/test-support/renderWithTrpc';
import { buildTickets } from '@/test-support/ticketFactory';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const target = buildTickets(25)[0];
if (!target) throw new Error('fixture');

function ids(list: UseTicketListResult | undefined) {
  return list?.kind === 'content' ? list.tickets.map((t) => t.id) : [];
}

function renderRow(store: TicketStore) {
  return renderWithTrpc(() => ({ list: useTicketList(), row: useTicketRow(target) }), { store });
}

beforeEach(() => {
  installIntersectionObserver();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

describe('useTicketRow', () => {
  it('removes the ticket from the list and confirms', async () => {
    const { result, store } = renderRow(createTicketStore({ seed: buildTickets(25) }));
    await waitFor(() => expect(ids(result.current?.list)).toContain(target.id));
    act(() => result.current?.row.handleDelete());
    await waitFor(() => expect(ids(result.current?.list)).not.toContain(target.id));
    expect(store.get(target.id).ok).toBe(false);
    expect(result.current?.list.kind === 'content' && result.current.list.total).toBe(24);
    expect(toast.success).toHaveBeenCalledWith('Ticket deleted.');
  });

  it('deletes once when confirmed twice in a row', async () => {
    const base = createTicketStore({ seed: buildTickets(25) });
    const remove = vi.fn((id: string) => base.remove(id));
    const { result } = renderRow({ ...base, remove });
    await waitFor(() => expect(ids(result.current?.list)).toContain(target.id));
    act(() => {
      result.current?.row.handleDelete();
      result.current?.row.handleDelete();
    });
    await waitFor(() => expect(ids(result.current?.list)).not.toContain(target.id));
    expect(remove).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('keeps the row and says so when the delete fails', async () => {
    const base = createTicketStore({ seed: buildTickets(25) });
    const remove = vi.fn((): never => {
      throw new Error('disk on fire');
    });
    const { result } = renderRow({ ...base, remove });
    await waitFor(() => expect(ids(result.current?.list)).toContain(target.id));
    act(() => result.current?.row.handleDelete());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Couldn't delete that ticket. Try again."));
    expect(ids(result.current?.list)).toContain(target.id);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('treats an already deleted ticket as deleted', async () => {
    const store = createTicketStore({ seed: buildTickets(25) });
    const { result } = renderRow(store);
    await waitFor(() => expect(ids(result.current?.list)).toContain(target.id));
    store.remove(target.id);
    act(() => result.current?.row.handleDelete());
    await waitFor(() => expect(ids(result.current?.list)).not.toContain(target.id));
    expect(toast.success).toHaveBeenCalledWith('Ticket deleted.');
    expect(toast.error).not.toHaveBeenCalled();
  });
});
