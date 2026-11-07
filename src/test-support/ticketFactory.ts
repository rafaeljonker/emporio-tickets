import type { Ticket } from '@/domain/tickets/ticket';

/** Fixed base so tests never depend on the clock. */
export const FACTORY_START = 1_794_000_000_000;

export function buildTicket(overrides: Partial<Ticket> = {}): Ticket {
  return { id: 't-0001', title: 'Ticket 0001', createdAt: FACTORY_START, ...overrides };
}

/** `n` tickets, newest first: ids `t-0001`…, one minute apart by default. */
export function buildTickets(n: number, opts: { start?: number; stepMs?: number } = {}): Ticket[] {
  const { start = FACTORY_START, stepMs = 60_000 } = opts;
  return Array.from({ length: n }, (_, i) => {
    const seq = String(i + 1).padStart(4, '0');
    return { id: `t-${seq}`, title: `Ticket ${seq}`, createdAt: start - i * stepMs };
  });
}
