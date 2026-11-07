import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { isNotFound } from '@/client/shared/lib/errorMessage';
import { PAGE_SIZE, type Ticket } from '@/domain/tickets/ticket';
import { useTRPC } from '@/trpc/client';

/** Matches the row's collapse transition; reduced motion skips the wait. */
const COLLAPSE_MS = 200;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export function useTicketRow(ticket: Ticket) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [isRemoving, setRemoving] = useState(false);
  // A second confirm in the same tick must not send a second delete.
  const inFlight = useRef(false);

  function removeFromList() {
    // Keyset cursors make local removal safe: later pages don't shift.
    queryClient.setQueryData(trpc.ticket.list.infiniteQueryKey({ limit: PAGE_SIZE }), (old) =>
      old && {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.filter((item) => item.id !== ticket.id),
          total: page.total - 1,
        })),
      },
    );
  }

  function finishDelete() {
    setConfirmOpen(false);
    setRemoving(true);
    toast.success('Ticket deleted.');
    if (prefersReducedMotion()) removeFromList();
    else setTimeout(removeFromList, COLLAPSE_MS);
  }

  const { mutate, isPending } = useMutation(
    trpc.ticket.delete.mutationOptions({
      onSuccess: finishDelete,
      onError: (error) => {
        // Already gone is the outcome the user asked for.
        if (isNotFound(error)) finishDelete();
        else toast.error("Couldn't delete that ticket. Try again.");
      },
      onSettled: () => {
        inFlight.current = false;
      },
    }),
  );

  return {
    isConfirmOpen,
    setConfirmOpen,
    isDeleting: isPending,
    isRemoving,
    handleDelete: () => {
      if (inFlight.current) return;
      inFlight.current = true;
      mutate({ id: ticket.id });
    },
  };
}
