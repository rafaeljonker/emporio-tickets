'use client';

import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/client/shared/components/ui/button';
import { useNewTicketButton } from './useNewTicketButton';

export function NewTicketButton() {
  const { href } = useNewTicketButton();
  return (
    // On phones the primary action sits in a sticky bottom bar; on desktop it stays in the header.
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/92 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur-md md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
      <Link href={href} className={buttonVariants({ className: 'w-full md:w-auto' })} aria-keyshortcuts="n">
        <PlusIcon className="size-5" strokeWidth={1.75} aria-hidden="true" />
        New ticket
        <kbd className="hidden rounded-[5px] bg-primary-foreground/20 px-1.5 py-px text-xs font-semibold md:inline" aria-hidden="true">
          N
        </kbd>
      </Link>
    </div>
  );
}
