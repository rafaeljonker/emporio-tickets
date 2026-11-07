import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { useForm, useWatch, type FieldError } from 'react-hook-form';
import { toast } from 'sonner';
import { toUserMessage } from '@/client/shared/lib/errorMessage';
import { DESCRIPTION_MAX, TITLE_MAX, ticketInput, type Ticket, type TicketFormValues, type TicketInput } from '@/domain/tickets/ticket';
import { useTRPC } from '@/trpc/client';
import { formatTicketDate } from '../../ui/formatTicketDate';
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
  const router = useRouter();
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

  function onSaved(message: string) {
    // Dropping the list (instead of invalidating every loaded page) makes the board
    // start again from a fresh server-rendered first page.
    queryClient.removeQueries(trpc.ticket.list.infiniteQueryFilter());
    toast.success(message);
    router.push('/');
  }

  function onFailed(error: ServerError) {
    inFlight.current = false;
    if (!applyServerFieldErrors(error.data?.zodError?.fieldErrors ?? {}, form.setError)) setFormError(toUserMessage(error));
  }

  const create = useMutation(trpc.ticket.create.mutationOptions({ onSuccess: () => onSaved('Ticket created.'), onError: onFailed }));
  const update = useMutation(trpc.ticket.update.mutationOptions({ onSuccess: () => onSaved('Ticket updated.'), onError: onFailed }));
  const isSaving = create.isPending || update.isPending;
  const { errors } = form.formState;

  return {
    control: form.control,
    heading: ticket ? 'Edit ticket' : 'New ticket',
    tagline: ticket ? `Handed over ${formatTicketDate(ticket.createdAt)}` : "Log something the agent didn't catch.",
    fieldErrors: { title: messageFor('title', errors.title), description: messageFor('description', errors.description) },
    counters: { title: counter(title, TITLE_MAX), description: counter(description, DESCRIPTION_MAX) },
    formError,
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
