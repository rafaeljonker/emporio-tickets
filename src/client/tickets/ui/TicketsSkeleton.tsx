// Static blocks, no shimmer and no spinner (brand rule).
export function TicketSkeletonRow() {
  return (
    <div data-testid="ticket-skeleton" aria-hidden="true" className="grid grid-cols-[1fr_auto] gap-5 border-b border-border px-3.5 py-[18px]">
      <div>
        <div className="h-4 w-[46%] rounded-md bg-card" />
        <div className="mt-2.5 h-3.5 w-[82%] rounded-md bg-card" />
      </div>
      <div className="h-3.5 w-[110px] rounded-md bg-card" />
    </div>
  );
}

export function TicketsSkeleton() {
  return (
    <div className="mt-2" aria-busy="true" aria-label="Loading tickets">
      {Array.from({ length: 5 }, (_, i) => (
        <TicketSkeletonRow key={i} />
      ))}
    </div>
  );
}
