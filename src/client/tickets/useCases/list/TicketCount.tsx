'use client';

import { useTicketCount } from './useTicketCount';

export function TicketCount() {
  const { label } = useTicketCount();
  return <span className="tnum text-sm text-muted-foreground">{label}</span>;
}
