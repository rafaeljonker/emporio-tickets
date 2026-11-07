import { fireEvent, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNewTicketButton } from '@/client/tickets/useCases/list/useNewTicketButton';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  push.mockClear();
  document.body.innerHTML = '';
});

describe('useNewTicketButton', () => {
  it('opens a new ticket on N', () => {
    renderHook(() => useNewTicketButton());
    fireEvent.keyDown(document.body, { key: 'n' });
    expect(push).toHaveBeenCalledWith('/tickets/new');
  });

  it('ignores N while typing in a field', () => {
    renderHook(() => useNewTicketButton());
    const input = document.body.appendChild(document.createElement('input'));
    fireEvent.keyDown(input, { key: 'n' });
    expect(push).not.toHaveBeenCalled();
  });

  it('ignores N with a modifier key', () => {
    renderHook(() => useNewTicketButton());
    fireEvent.keyDown(document.body, { key: 'n', metaKey: true });
    fireEvent.keyDown(document.body, { key: 'n', ctrlKey: true });
    expect(push).not.toHaveBeenCalled();
  });
});
