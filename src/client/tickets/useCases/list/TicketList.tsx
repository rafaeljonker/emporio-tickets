'use client';

import Link from 'next/link';
import { Button } from '@/client/shared/components/ui/button';
import { ListEnd } from '../../ui/ListEnd';
import { LoadMoreError } from '../../ui/LoadMoreError';
import { TicketDate } from '../../ui/TicketDate';
import { TicketsEmpty } from '../../ui/TicketsEmpty';
import { TicketSkeletonRow } from '../../ui/TicketsSkeleton';
import { useTicketList } from './useTicketList';

export function TicketList() {
  const list = useTicketList();

  if (list.kind === 'empty') return <TicketsEmpty />;

  const { tickets, statusText, hasNextPage, isFetchingNextPage, nextPageError, loadMoreRef, handleLoadMore, handleRetry } = list;

  return (
    <>
      <p role="status" aria-atomic="true" className="sr-only">
        {statusText}
      </p>
      <ul>
        {tickets.map((ticket) => (
          <li key={ticket.id} className="border-b border-border">
            <Link
              id={`ticket-${ticket.id}`}
              href={`/tickets/${ticket.id}/edit`}
              // Up to 1,000 rows: no viewport prefetch per row.
              prefetch={false}
              className="grid grid-cols-[1fr_auto] items-start gap-5 px-3.5 py-[18px]"
            >
              <span className="min-w-0">
                <span className="block text-[17px] leading-snug font-semibold [overflow-wrap:anywhere]">{ticket.title}</span>
                {ticket.description && (
                  <span className="mt-1 line-clamp-2 block max-w-[64ch] text-[15px] text-muted-foreground [overflow-wrap:anywhere]">
                    {ticket.description}
                  </span>
                )}
              </span>
              <TicketDate createdAt={ticket.createdAt} />
            </Link>
          </li>
        ))}
      </ul>
      {isFetchingNextPage && (
        <>
          <TicketSkeletonRow />
          <TicketSkeletonRow />
        </>
      )}
      {nextPageError && <LoadMoreError message={nextPageError} onRetry={handleRetry} />}
      {hasNextPage && !nextPageError && (
        <div className="mt-6 flex justify-center">
          <Button ref={loadMoreRef} variant="secondary" onClick={handleLoadMore} disabled={isFetchingNextPage}>
            Load more
          </Button>
        </div>
      )}
      {!hasNextPage && <ListEnd />}
    </>
  );
}
