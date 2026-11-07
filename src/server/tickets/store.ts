import 'server-only';
import { TICKET_ERROR, type TicketErrorCode } from '@/domain/tickets/errors';
import { paginate, type TicketPage } from '@/domain/tickets/pagination';
import { MAX_TICKETS, type Ticket, type TicketInput } from '@/domain/tickets/ticket';
import { err, ok, type Result } from '@/shared/result';
import { seedTickets } from './seed';

export type TicketStore = {
  list(input: { limit: number; cursor?: string | null }): Result<TicketPage, TicketErrorCode>;
  get(id: string): Result<Ticket, TicketErrorCode>;
  create(input: TicketInput): Result<Ticket, TicketErrorCode>;
  update(id: string, input: TicketInput): Result<Ticket, TicketErrorCode>;
  remove(id: string): Result<{ id: string }, TicketErrorCode>;
  size(): number;
};

type StoreOptions = { seed?: readonly Ticket[]; now?: () => number; newId?: () => string };

/**
 * In-memory persistence: a Map per process. Data resets on restart and is not shared
 * across instances. Swapping this module for a database leaves the router untouched.
 */
export function createTicketStore({
  seed = [],
  now = Date.now,
  newId = () => crypto.randomUUID(),
}: StoreOptions = {}): TicketStore {
  const tickets = new Map(seed.map((ticket) => [ticket.id, ticket]));

  return {
    list: (input) => paginate([...tickets.values()], input),
    get(id) {
      const ticket = tickets.get(id);
      return ticket ? ok(ticket) : err(TICKET_ERROR.NOT_FOUND);
    },
    create(input) {
      if (tickets.size >= MAX_TICKETS) return err(TICKET_ERROR.LIMIT_REACHED);
      const ticket: Ticket = { id: newId(), title: input.title, description: input.description, createdAt: now() };
      tickets.set(ticket.id, ticket);
      return ok(ticket);
    },
    update(id, input) {
      const current = tickets.get(id);
      if (!current) return err(TICKET_ERROR.NOT_FOUND);
      const next: Ticket = { ...current, title: input.title, description: input.description };
      tickets.set(id, next);
      return ok(next);
    },
    remove(id) {
      return tickets.delete(id) ? ok({ id }) : err(TICKET_ERROR.NOT_FOUND);
    },
    size: () => tickets.size,
  };
}

const globalForStore = globalThis as typeof globalThis & { __ticketStore?: TicketStore };

/**
 * One seeded store per process, kept on globalThis so Next's dev reloads and the
 * RSC and route-handler bundles share the same data. Seeding happens only once.
 */
export function getTicketStore(): TicketStore {
  globalForStore.__ticketStore ??= createTicketStore({ seed: seedTickets });
  return globalForStore.__ticketStore;
}
