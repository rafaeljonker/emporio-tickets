import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TicketList } from '@/client/tickets/useCases/list/TicketList';
import type { UseTicketListResult } from '@/client/tickets/useCases/list/useTicketList';
import { buildTickets } from '@/test-support/ticketFactory';

const state: { current: UseTicketListResult } = { current: { kind: 'empty' } };

vi.mock('@/client/tickets/useCases/list/useTicketList', () => ({ useTicketList: () => state.current }));

const contentState = (overrides: Partial<Extract<UseTicketListResult, { kind: 'content' }>> = {}): UseTicketListResult => ({
  kind: 'content',
  tickets: buildTickets(3),
  total: 25,
  statusText: 'Showing 3 of 25 tickets',
  hasNextPage: true,
  isFetchingNextPage: false,
  nextPageError: null,
  loadMoreRef: vi.fn(),
  handleLoadMore: vi.fn(),
  handleRetry: vi.fn(),
  ...overrides,
});

beforeEach(() => {
  state.current = { kind: 'empty' };
});

describe('TicketList', () => {
  it('invites the first ticket when empty', () => {
    render(<TicketList />);
    expect(screen.getByRole('heading', { name: 'Quiet in the shop' })).toBeDefined();
    expect(screen.getByRole('link', { name: /new ticket/i }).getAttribute('href')).toBe('/tickets/new');
  });

  it('renders rows, the status line and a load more button', () => {
    state.current = contentState();
    render(<TicketList />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('status').textContent).toBe('Showing 3 of 25 tickets');
    expect(screen.getByRole('button', { name: 'Load more' })).toBeDefined();
  });

  it('shows skeleton rows while the next page loads', () => {
    state.current = contentState({ isFetchingNextPage: true });
    render(<TicketList />);
    expect(screen.getAllByTestId('ticket-skeleton')).toHaveLength(2);
  });

  it('offers a retry when the next page failed', () => {
    state.current = contentState({ nextPageError: "Couldn't load more tickets. Try again." });
    render(<TicketList />);
    expect(screen.getByText("Couldn't load more tickets. Try again.")).toBeDefined();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeDefined();
  });

  it('closes the list at the end', () => {
    state.current = contentState({ hasNextPage: false });
    render(<TicketList />);
    expect(screen.getByText("That's every ticket. The agent is still on shift.")).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
  });
});
