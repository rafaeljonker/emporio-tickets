'use client';

import { Button } from '@/client/shared/components/ui/button';
import { ListEnd } from '../../ui/ListEnd';
import { LoadMoreError } from '../../ui/LoadMoreError';
import { TicketsEmpty } from '../../ui/TicketsEmpty';
import { TicketSkeletonRow } from '../../ui/TicketsSkeleton';
import { TicketRow } from './TicketRow';
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
          <TicketRow key={ticket.id} ticket={ticket} />
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
