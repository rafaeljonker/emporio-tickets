import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatTicketDate } from '@/client/tickets/ui/formatTicketDate';

afterEach(() => vi.unstubAllEnvs());

describe('formatTicketDate', () => {
  it.each(['UTC', 'Asia/Tokyo', 'America/Sao_Paulo'])('renders store time regardless of TZ=%s', (tz) => {
    vi.stubEnv('TZ', tz);
    expect(formatTicketDate(Date.UTC(2026, 10, 7, 14, 42))).toBe('Nov 7, 10:42 AM');
  });
});
