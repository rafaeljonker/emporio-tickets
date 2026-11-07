import { TicketsSkeleton } from '@/client/tickets/ui/TicketsSkeleton';

export default function Loading() {
  return (
    <main className="mx-auto max-w-[880px] px-4 pt-6 md:px-6 md:pt-10">
      <div className="h-10 w-64 rounded-md bg-card" aria-hidden="true" />
      <TicketsSkeleton />
    </main>
  );
}
