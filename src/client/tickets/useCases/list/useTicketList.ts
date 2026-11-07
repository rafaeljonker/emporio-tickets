import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { toUserMessage } from '@/client/shared/lib/errorMessage';
import { PAGE_SIZE, type Ticket } from '@/domain/tickets/ticket';
import { useTRPC } from '@/trpc/client';

export type UseTicketListResult =
  | { kind: 'empty' }
  | {
      kind: 'content';
      tickets: Ticket[];
      total: number;
      statusText: string;
      hasNextPage: boolean;
      isFetchingNextPage: boolean;
      nextPageError: string | null;
      loadMoreRef: (element: HTMLButtonElement | null) => void;
      handleLoadMore: () => void;
      handleRetry: () => void;
    };

const count = (n: number) => n.toLocaleString('en-US');

export function useTicketList(): UseTicketListResult {
  const trpc = useTRPC();
  // Same input as the server prefetch, so hydration reuses the cached first page.
  const { data, hasNextPage, isFetching, isFetchingNextPage, isFetchNextPageError, error, fetchNextPage } =
    useSuspenseInfiniteQuery(
      trpc.ticket.list.infiniteQueryOptions({ limit: PAGE_SIZE }, { getNextPageParam: (page) => page.nextCursor }),
    );
  const [loadMoreButton, setLoadMoreButton] = useState<HTMLButtonElement | null>(null);
  const [focusTicketId, setFocusTicketId] = useState<string | null>(null);

  const tickets = data.pages.flatMap((page) => page.items);
  const total = data.pages.at(-1)?.total ?? 0;

  // `cancelRefetch: false` joins an in-flight request instead of starting another one.
  const loadNextPage = useCallback(() => fetchNextPage({ cancelRefetch: false }), [fetchNextPage]);

  // One request at a time, never during a background refetch, and no loop after a failure.
  const canAutoLoad = hasNextPage && !isFetching && !isFetchNextPageError;
  useEffect(() => {
    if (!loadMoreButton || !canAutoLoad) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void loadNextPage();
      },
      { rootMargin: '400px' },
    );
    observer.observe(loadMoreButton);
    return () => observer.disconnect();
  }, [loadMoreButton, canAutoLoad, loadNextPage]);

  // Only a click moves focus to the first new row; observer loads never steal focus.
  useEffect(() => {
    if (!focusTicketId) return;
    document.getElementById(`ticket-${focusTicketId}`)?.focus();
    setFocusTicketId(null);
  }, [focusTicketId]);

  if (total === 0) return { kind: 'empty' };

  return {
    kind: 'content',
    tickets,
    total,
    statusText: `Showing ${count(tickets.length)} of ${count(total)} tickets`,
    hasNextPage,
    isFetchingNextPage,
    nextPageError: isFetchNextPageError ? toUserMessage(error) : null,
    loadMoreRef: setLoadMoreButton,
    handleLoadMore: () => {
      const firstNewIndex = tickets.length;
      void loadNextPage().then((result) => {
        const next = result.data?.pages.flatMap((page) => page.items)[firstNewIndex];
        if (next) setFocusTicketId(next.id);
      });
    },
    handleRetry: () => void loadNextPage(),
  };
}
