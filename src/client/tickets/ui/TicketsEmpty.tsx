import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/client/shared/components/ui/button';

export function TicketsEmpty() {
  return (
    <section className="mt-7 flex flex-col items-center rounded-lg bg-card px-6 pt-12 pb-14 text-center">
      {/* A tuning fork: walnut line art over a honey disc. */}
      <svg viewBox="0 0 120 120" width="96" height="96" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M60 14v38" />
        <circle cx="60" cy="74" r="26" className="fill-accent/35" />
        <circle cx="60" cy="74" r="9" className="fill-background" />
        <path d="M52 14h16" />
        <path d="M54 22h12" />
        <path d="M38 106h44" />
      </svg>
      <h2 className="font-display mt-4 text-[28px] leading-tight">Quiet in the shop</h2>
      <p className="mt-1.5 mb-6 max-w-[44ch] text-muted-foreground">
        No tickets yet. When the agent hands a customer over, they&apos;ll land here.
      </p>
      <Link href="/tickets/new" className={buttonVariants()}>
        <PlusIcon className="size-5" strokeWidth={1.75} aria-hidden="true" />
        New ticket
      </Link>
    </section>
  );
}
