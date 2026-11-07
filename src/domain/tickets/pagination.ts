import { z } from 'zod';
import { err, ok, type Result } from '@/shared/result';
import { TICKET_ERROR } from './errors';
import type { Ticket } from './ticket';

export type TicketPage = { items: Ticket[]; nextCursor: string | null; total: number };

type CursorKey = { t: number; id: string };
type InvalidCursor = typeof TICKET_ERROR.INVALID_CURSOR;

const cursorSchema = z.object({ v: z.literal(1), t: z.number().int(), id: z.string().min(1) });

/** Newest first; `id` breaks ties so the order is total and stable. */
export function compareTickets(a: Pick<Ticket, 'createdAt' | 'id'>, b: Pick<Ticket, 'createdAt' | 'id'>): number {
  if (a.createdAt !== b.createdAt) return b.createdAt - a.createdAt;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

// btoa/atob + TextEncoder work in Node and in browsers, so the domain stays isomorphic.
function toBase64Url(text: string): string {
  const binary = Array.from(new TextEncoder().encode(text), (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

/** Opaque to clients; `v` leaves room to change the format later. */
export function encodeCursor(ticket: Pick<Ticket, 'createdAt' | 'id'>): string {
  return toBase64Url(JSON.stringify({ v: 1, t: ticket.createdAt, id: ticket.id }));
}

export function decodeCursor(cursor: string): Result<CursorKey, InvalidCursor> {
  try {
    const parsed = cursorSchema.safeParse(JSON.parse(fromBase64Url(cursor)));
    return parsed.success ? ok({ t: parsed.data.t, id: parsed.data.id }) : err(TICKET_ERROR.INVALID_CURSOR);
  } catch {
    return err(TICKET_ERROR.INVALID_CURSOR);
  }
}

/**
 * Keyset pagination: the next page is everything strictly after the cursor's key, so
 * creating or deleting tickets between pages never skips or repeats a row. A cursor
 * whose ticket was deleted stays valid because the key is compared, never looked up.
 */
export function paginate(
  tickets: readonly Ticket[],
  input: { limit: number; cursor?: string | null },
): Result<TicketPage, InvalidCursor> {
  let after: CursorKey | null = null;
  if (input.cursor) {
    const decoded = decodeCursor(input.cursor);
    if (!decoded.ok) return decoded;
    after = decoded.data;
  }
  const key = after && { createdAt: after.t, id: after.id };
  const ordered = [...tickets].sort(compareTickets);
  const remaining = key ? ordered.filter((ticket) => compareTickets(key, ticket) < 0) : ordered;
  // Fetching one extra tells whether another page exists without an empty last page.
  const window = remaining.slice(0, input.limit + 1);
  const items = window.slice(0, input.limit);
  const last = items.at(-1);
  const nextCursor = window.length > input.limit && last ? encodeCursor(last) : null;
  return ok({ items, nextCursor, total: tickets.length });
}
