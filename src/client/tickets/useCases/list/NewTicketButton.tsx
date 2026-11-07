'use client';

import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/client/shared/components/ui/button';
import { useNewTicketButton } from './useNewTicketButton';

export function NewTicketButton() {
  const { href } = useNewTicketButton();
  return (
    <Link href={href} className={buttonVariants()} aria-keyshortcuts="n">
      <PlusIcon className="size-5" strokeWidth={1.75} aria-hidden="true" />
      New ticket
      <kbd className="rounded-[5px] bg-primary-foreground/20 px-1.5 py-px text-xs font-semibold" aria-hidden="true">
        N
      </kbd>
    </Link>
  );
}
