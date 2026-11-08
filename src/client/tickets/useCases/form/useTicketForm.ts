import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { useForm, useWatch, type FieldError } from 'react-hook-form';
import { toast } from 'sonner';
import { toUserMessage } from '@/client/shared/lib/errorMessage';
import { DESCRIPTION_MAX, PAGE_SIZE, TITLE_MAX, ticketInput, type Ticket, type TicketFormValues, type TicketInput } from '@/domain/tickets/ticket';
import { useTRPC } from '@/trpc/client';
import { formatTicketDate } from '../../ui/formatTicketDate';
import { useReturnToBoard } from '../returnToBoard';
import { applyServerFieldErrors } from './applyServerFieldErrors';

/** The part of a tRPC error this form reads: field errors from the server's formatter. */
type ServerError = { data?: { zodError?: { fieldErrors: Partial<Record<string, string[] | undefined>> } | null } | null };

export type TicketFormProps = { mode: 'create' } | { mode: 'edit'; ticket: Ticket };

const copy: Record<'title' | 'description', Partial<Record<string, string>>> = {
  title: { too_small: 'Give the ticket a title.', too_big: 'Keep the title under 120 characters.' },
  description: { too_big: 'Keep the description under 2,000 characters.' },
};

const messageFor = (field: 'title' | 'description', error: FieldError | undefined) =>
  error && (copy[field][error.type] ?? error.message ?? 'Check this field.');

/** Shown only past 80% of the limit, so it never nags. */
const counter = (value: string | undefined, max: number) => {
  const length = value?.length ?? 0;
  return length > max * 0.8 ? `${length.toLocaleString('en-US')} / ${max.toLocaleString('en-US')}` : null;
};

export function useTicketForm(props: TicketFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { returnToBoard, handleBackClick, startOver } = useReturnToBoard();
  const ticket = props.mode === 'edit' ? props.ticket : undefined;
  const values = useMemo(() => ticket && { title: ticket.title, description: ticket.description ?? '' }, [ticket]);
  const form = useForm<TicketFormValues, unknown, TicketInput>({
    resolver: zodResolver(ticketInput),
    mode: 'onTouched',
    shouldFocusError: true,
    defaultValues: { title: '', description: '' },
    values,
  });
  const [title, description] = useWatch({ control: form.control, name: ['title', 'description'] });
  const [formError, setFormError] = useState<string | null>(null);
  // Enter twice or a double click must not save twice.
  const inFlight = useRef(false);

  function onCreated() {
    // The new ticket goes first: drop the cached pages and start from a fresh server-rendered board.
    queryClient.removeQueries(trpc.ticket.list.infiniteQueryFilter());
    toast.success('Ticket created.');
    startOver();
  }

  function onUpdated(updated: Ticket) {
    // Patch the row where it sits, so going back keeps the loaded pages and the scroll position.
    queryClient.setQueryData(trpc.ticket.list.infiniteQueryKey({ limit: PAGE_SIZE }), (old) =>
      old && {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.map((item) => (item.id === updated.id ? updated : item)),
        })),
      },
    );
    toast.success('Ticket updated.');
    returnToBoard();
  }

  function onFailed(error: ServerError) {
    inFlight.current = false;
    if (!applyServerFieldErrors(error.data?.zodError?.fieldErrors ?? {}, form.setError)) setFormError(toUserMessage(error));
  }

  const create = useMutation(trpc.ticket.create.mutationOptions({ onSuccess: onCreated, onError: onFailed }));
  const update = useMutation(trpc.ticket.update.mutationOptions({ onSuccess: onUpdated, onError: onFailed }));
  const isSaving = create.isPending || update.isPending;
  const { errors } = form.formState;

  return {
    control: form.control,
    heading: ticket ? 'Edit ticket' : 'New ticket',
    tagline: ticket ? `Handed over ${formatTicketDate(ticket.createdAt)}` : "Log something the agent didn't catch.",
    fieldErrors: { title: messageFor('title', errors.title), description: messageFor('description', errors.description) },
    counters: { title: counter(title, TITLE_MAX), description: counter(description, DESCRIPTION_MAX) },
    formError,
    handleBackClick,
    isSaving,
    submitLabel: isSaving ? 'Saving…' : ticket ? 'Save changes' : 'Create ticket',
    onSubmit: form.handleSubmit((input) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setFormError(null);
      if (ticket) update.mutate({ id: ticket.id, ...input });
      else create.mutate(input);
    }),
  };
}
