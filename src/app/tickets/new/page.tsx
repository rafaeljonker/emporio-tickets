import type { Metadata } from 'next';
import { TicketForm } from '@/client/tickets/useCases/form/TicketForm';

export const metadata: Metadata = { title: 'New ticket' };

export default function NewTicketPage() {
  return <TicketForm mode="create" />;
}
