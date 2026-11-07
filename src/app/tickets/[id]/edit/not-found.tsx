import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Ticket not found' };

export default function TicketNotFound() {
  return (
    <main className="mx-auto max-w-[42rem] px-6 pt-14 pb-16">
      <h1 className="font-display text-4xl leading-tight">Ticket not found</h1>
      <p className="mt-3 max-w-[52ch]">It may have been deleted, or the link may be incomplete.</p>
      <p className="mt-6">
        <Link href="/" className="font-semibold underline underline-offset-3 hover:decoration-2">
          See all tickets
        </Link>
      </p>
    </main>
  );
}
