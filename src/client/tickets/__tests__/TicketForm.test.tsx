import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TicketForm } from '@/client/tickets/useCases/form/TicketForm';
import { createTicketStore } from '@/server/tickets/store';
import { renderUiWithTrpc } from '@/test-support/renderWithTrpc';
import { buildTicket, buildTickets } from '@/test-support/ticketFactory';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  push.mockClear();
  vi.mocked(toast.success).mockClear();
});

const title = () => screen.getByLabelText('Title');
const submit = (label: RegExp) => screen.getByRole('button', { name: label });

describe('TicketForm (create)', () => {
  it('suggests what a title looks like', () => {
    renderUiWithTrpc(<TicketForm mode="create" />);
    expect(title().getAttribute('placeholder')).toBe('e.g. B string snapped on a new Giannini');
  });

  it('creates a ticket, resets the list cache and goes back to the board', async () => {
    const { store, queryClient } = renderUiWithTrpc(<TicketForm mode="create" />);
    const removeQueries = vi.spyOn(queryClient, 'removeQueries');
    fireEvent.change(title(), { target: { value: 'New strings for a Strat' } });
    fireEvent.click(submit(/create ticket/i));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
    expect(store.size()).toBe(1);
    expect(removeQueries).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Ticket created.');
  });

  it('creates exactly one ticket when submitted twice', async () => {
    const { store, container } = renderUiWithTrpc(<TicketForm mode="create" />);
    fireEvent.change(title(), { target: { value: 'Double click' } });
    const form = container.querySelector('form');
    if (!form) throw new Error('no form');
    act(() => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(store.size()).toBe(1);
  });

  it('blocks an empty title without calling the server', async () => {
    const base = createTicketStore();
    const create = vi.fn(base.create.bind(base));
    renderUiWithTrpc(<TicketForm mode="create" />, { store: { ...base, create } });
    fireEvent.change(title(), { target: { value: '   ' } });
    fireEvent.click(submit(/create ticket/i));
    expect(await screen.findByText('Give the ticket a title.')).toBeDefined();
    expect(title().getAttribute('aria-invalid')).toBe('true');
    expect(create).not.toHaveBeenCalled();
  });

  it('explains when the board is full', async () => {
    renderUiWithTrpc(<TicketForm mode="create" />, { store: createTicketStore({ seed: buildTickets(1000) }) });
    fireEvent.change(title(), { target: { value: 'One too many' } });
    fireEvent.click(submit(/create ticket/i));
    expect((await screen.findByRole('alert')).textContent).toContain('The board is full (1,000 tickets).');
    expect(push).not.toHaveBeenCalled();
  });
});

describe('TicketForm (edit)', () => {
  it('starts from the ticket and saves changes', async () => {
    const ticket = buildTicket({ description: 'Old notes' });
    const { store } = renderUiWithTrpc(<TicketForm mode="edit" ticket={ticket} />, { store: createTicketStore({ seed: [ticket] }) });
    expect((title() as HTMLInputElement).value).toBe(ticket.title);
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: '' } });
    fireEvent.click(submit(/save changes/i));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
    const saved = store.get(ticket.id);
    expect(saved.ok && saved.data.description).toBeUndefined();
    expect(toast.success).toHaveBeenCalledWith('Ticket updated.');
  });

  it('says so when the ticket was deleted meanwhile', async () => {
    const ticket = buildTicket();
    renderUiWithTrpc(<TicketForm mode="edit" ticket={ticket} />, { store: createTicketStore() });
    fireEvent.click(submit(/save changes/i));
    expect((await screen.findByRole('alert')).textContent).toContain('This ticket no longer exists.');
    expect(push).not.toHaveBeenCalled();
  });
});
