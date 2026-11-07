// Pinned locale and store time zone: server and browser render the same text, so no hydration mismatch.
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Campo_Grande',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatTicketDate(epochMs: number): string {
  return formatter.format(epochMs);
}
