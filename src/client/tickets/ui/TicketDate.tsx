import { formatTicketDate } from './formatTicketDate';

interface TicketDateProps {
  createdAt: number;
  className?: string;
}

export function TicketDate({ createdAt, className }: TicketDateProps) {
  return (
    <time dateTime={new Date(createdAt).toISOString()} className={`tnum text-[13px] whitespace-nowrap text-muted-foreground ${className ?? ''}`}>
      {formatTicketDate(createdAt)}
    </time>
  );
}
