import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { PAGE_SIZE } from '@/domain/tickets/ticket';
import { useTRPC } from '@/trpc/client';

/** Reads `total` from the same cached query as the list, so it follows deletes and creates. */
export function useTicketCount() {
  const trpc = useTRPC();
  const { data } = useSuspenseInfiniteQuery(
    trpc.ticket.list.infiniteQueryOptions({ limit: PAGE_SIZE }, { getNextPageParam: (page) => page.nextCursor }),
  );
  const total = data.pages.at(-1)?.total ?? 0;
  return { label: `${total.toLocaleString('en-US')} open ${total === 1 ? 'ticket' : 'tickets'}` };
}
