import { PencilIcon, Trash2Icon } from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/client/shared/components/ui/alert-dialog';
import { Button } from '@/client/shared/components/ui/button';
import type { Ticket } from '@/domain/tickets/ticket';
import { TicketDate } from '../../ui/TicketDate';
import { TakeoverDialog } from './TakeoverDialog';
import { useTicketRow } from './useTicketRow';

interface TicketRowProps {
  ticket: Ticket;
}

const iconButton = 'size-9 rounded-lg text-muted-foreground hover:text-foreground';
const editHref = (id: string) => `/tickets/${id}/edit` as const;

export function TicketRow({ ticket }: TicketRowProps) {
  const { isConfirmOpen, setConfirmOpen, isDeleting, isRemoving, handleDelete } = useTicketRow(ticket);

  return (
    <li
      aria-busy={isDeleting}
      className={`grid grid-rows-[1fr] transition-[grid-template-rows,opacity] duration-200 ease-brand motion-reduce:transition-opacity ${isRemoving ? 'grid-rows-[0fr] opacity-0' : ''}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`group relative border-b border-border hover:bg-foreground/[.04] hover:shadow-[inset_3px_0_0_var(--accent)] has-[:focus-visible]:bg-foreground/[.04] has-[:focus-visible]:shadow-[inset_3px_0_0_var(--accent)] ${isDeleting ? 'opacity-45' : ''}`}
        >
          <Link
            id={`ticket-${ticket.id}`}
            href={editHref(ticket.id)}
            // Up to 1,000 rows: no viewport prefetch per row.
            prefetch={false}
            className="block py-[18px] pr-3.5 pl-3.5 md:pr-[170px]"
          >
            {/* On phones only the title shares its line with the actions. */}
            <span className="block min-h-9 pr-[116px] text-[17px] leading-snug font-semibold [overflow-wrap:anywhere] md:min-h-0 md:pr-0">{ticket.title}</span>
            {ticket.description && (
              <span className="mt-1 line-clamp-2 max-w-[64ch] text-[15px] text-muted-foreground [overflow-wrap:anywhere]">
                {ticket.description}
              </span>
            )}
            {isDeleting ? (
              <span className="mt-1.5 block text-[13px] text-muted-foreground md:hidden">Deleting…</span>
            ) : (
              <TicketDate createdAt={ticket.createdAt} className="mt-1.5 block md:hidden" />
            )}
          </Link>
          {/* Desktop: the date gives way to the actions on hover or keyboard focus (not focus moved by code after a mouse action). */}
          <span className="pointer-events-none absolute top-[18px] right-3.5 hidden md:block group-has-[:focus-visible]:invisible group-hover:invisible">
            {isDeleting ? <span className="text-[13px] text-muted-foreground">Deleting…</span> : <TicketDate createdAt={ticket.createdAt} />}
          </span>
          <div className="absolute top-3 right-2 flex gap-0.5 md:opacity-0 md:group-has-[:focus-visible]:opacity-100 md:group-hover:opacity-100 [@media(hover:none)]:opacity-100">
            <TakeoverDialog title={ticket.title} />
            <Button asChild variant="ghost" size="icon" className={iconButton}>
              <Link href={editHref(ticket.id)} prefetch={false} aria-label={`Edit ${ticket.title}`}>
                <PencilIcon className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </Link>
            </Button>
            <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className={`${iconButton} hover:text-primary`} aria-label={`Delete ${ticket.title}`} disabled={isDeleting}>
                  <Trash2Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display text-[21px]">Delete this ticket?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &ldquo;{ticket.title}&rdquo; will be gone for good. The customer&apos;s conversation stays with the agent.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel variant="secondary">Keep it</AlertDialogCancel>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    <Trash2Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                    {isDeleting ? 'Deleting…' : 'Delete ticket'}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </li>
  );
}
