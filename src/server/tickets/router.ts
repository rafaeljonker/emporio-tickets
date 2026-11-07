import 'server-only';
import { idInput, listInput, ticketInput, updateInput } from '@/domain/tickets/ticket';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { unwrap } from './errors';

export const ticketRouter = createTRPCRouter({
  /**
   * Newest first (`createdAt desc, id desc`), keyset-paginated with an opaque cursor.
   * Every ticket that exists for the whole traversal appears exactly once; tickets
   * created after page 1 show up on the next refresh; deleted ones never reappear.
   * `total` is a point-in-time count.
   */
  list: publicProcedure.input(listInput).query(({ ctx, input }) => unwrap(ctx.store.list(input))),
  byId: publicProcedure.input(idInput).query(({ ctx, input }) => unwrap(ctx.store.get(input.id))),
  create: publicProcedure.input(ticketInput).mutation(({ ctx, input }) => unwrap(ctx.store.create(input))),
  update: publicProcedure
    .input(updateInput)
    .mutation(({ ctx, input: { id, ...ticket } }) => unwrap(ctx.store.update(id, ticket))),
  delete: publicProcedure.input(idInput).mutation(({ ctx, input }) => unwrap(ctx.store.remove(input.id))),
});
