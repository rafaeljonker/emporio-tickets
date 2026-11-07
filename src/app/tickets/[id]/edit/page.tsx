import { TRPCError } from '@trpc/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TicketForm } from '@/client/tickets/useCases/form/TicketForm';
import { caller } from '@/trpc/server';

export const metadata: Metadata = { title: 'Edit ticket' };

export default async function EditTicketPage({ params }: PageProps<'/tickets/[id]/edit'>) {
  const { id } = await params;
  // notFound() runs before anything renders, so the response is a real 404.
  // A try/catch would swallow the error notFound() throws; .catch rethrows the rest.
  const ticket = await caller.ticket.byId({ id }).catch((error: unknown) => {
    if (error instanceof TRPCError && error.code === 'NOT_FOUND') notFound();
    throw error;
  });
  return <TicketForm mode="edit" ticket={ticket} />;
}
