import { ForwardIcon } from 'lucide-react';
import { NewTicketButton } from '@/client/tickets/useCases/list/NewTicketButton';
import { TicketCount } from '@/client/tickets/useCases/list/TicketCount';
import { TicketList } from '@/client/tickets/useCases/list/TicketList';
import { PAGE_SIZE } from '@/domain/tickets/ticket';
import { getQueryClient, HydrateClient, trpc } from '@/trpc/server';

// The store changes at runtime, so the list renders per request.
export const dynamic = 'force-dynamic';

export default async function BoardPage() {
  // Awaited so the first page is in the server HTML; the client hydrates it without refetching.
  await getQueryClient().prefetchInfiniteQuery(
    trpc.ticket.list.infiniteQueryOptions({ limit: PAGE_SIZE }, { getNextPageParam: (page) => page.nextCursor }),
  );

  return (
    <HydrateClient>
    <main className="mx-auto max-w-[880px] px-4 pt-6 pb-24 md:px-6 md:pt-10 md:pb-12">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-5">
        <div>
          <h1 className="font-display text-[30px] leading-tight md:text-[40px]">Handed to you</h1>
          <p className="tagline mt-1.5 text-lg">Customers the agent couldn&apos;t finish with, waiting for a person.</p>
          <div className="mt-3.5 flex flex-wrap items-center gap-3">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-0.5 text-sm font-semibold">
              <ForwardIcon className="size-4" strokeWidth={1.75} aria-hidden="true" />
              From the store agent
            </p>
            <TicketCount />
          </div>
        </div>
        <NewTicketButton />
      </header>
      <TicketList />
    </main>
    </HydrateClient>
  );
}
