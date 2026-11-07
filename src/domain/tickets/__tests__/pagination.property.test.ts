import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { compareTickets, paginate } from '@/domain/tickets/pagination';
import type { Ticket } from '@/domain/tickets/ticket';
import { FACTORY_START, buildTickets } from '@/test-support/ticketFactory';

type Step = { kind: 'next' } | { kind: 'create'; offsetMs: number } | { kind: 'delete'; index: number };

const step: fc.Arbitrary<Step> = fc.oneof(
  { weight: 3, arbitrary: fc.constant<Step>({ kind: 'next' }) },
  // New tickets land at or before the newest existing one, so some share a timestamp.
  { weight: 1, arbitrary: fc.integer({ min: 0, max: 5 * 60_000 }).map<Step>((offsetMs) => ({ kind: 'create', offsetMs })) },
  { weight: 1, arbitrary: fc.nat({ max: 999 }).map<Step>((index) => ({ kind: 'delete', index })) },
);

describe('paginate invariants', () => {
  it('pages every surviving ticket exactly once, in order, while tickets come and go', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 1, max: 50 }),
        fc.array(step, { maxLength: 60 }),
        (size, limit, steps) => {
          let current: Ticket[] = buildTickets(size, { stepMs: 30_000 });
          const initial = new Set(current.map((t) => t.id));
          const deleted = new Set<string>();
          const deletedBeforePage = new Map<string, number>();
          const pages: Ticket[][] = [];
          let cursor: string | null = null;
          let finished = false;
          let created = 0;

          const fetchPage = () => {
            // A cursor that stops advancing must fail the property, not hang the run.
            if (pages.length > size + steps.length + 2) throw new Error('pagination did not terminate');
            const result = paginate(current, { limit, cursor });
            if (!result.ok) throw new Error(result.error);
            expect(result.data.items.length).toBeLessThanOrEqual(limit);
            pages.push(result.data.items);
            cursor = result.data.nextCursor;
            finished = cursor === null;
          };

          fetchPage();
          for (const s of steps) {
            if (finished) break;
            if (s.kind === 'next') fetchPage();
            else if (s.kind === 'create') {
              created += 1;
              current = [...current, { id: `new-${created}`, title: 'x', createdAt: FACTORY_START - s.offsetMs }];
            } else if (current.length > 0) {
              const victim = current[s.index % current.length];
              if (victim) {
                current = current.filter((t) => t.id !== victim.id);
                deleted.add(victim.id);
                deletedBeforePage.set(victim.id, pages.length);
              }
            }
          }
          while (!finished) fetchPage();

          const seen = pages.flat();
          const ids = seen.map((t) => t.id);
          expect(new Set(ids).size).toBe(ids.length);
          for (let i = 1; i < seen.length; i += 1) {
            const prev = seen[i - 1];
            const next = seen[i];
            if (prev && next) expect(compareTickets(prev, next)).toBeLessThan(0);
          }
          for (const id of initial) {
            if (!deleted.has(id)) expect(ids.filter((x) => x === id)).toHaveLength(1);
          }
          pages.forEach((page, pageIndex) => {
            for (const t of page) {
              const deletedAt = deletedBeforePage.get(t.id);
              if (deletedAt !== undefined) expect(pageIndex).toBeLessThan(deletedAt);
            }
          });
        },
      ),
      { seed: 20261107, numRuns: 200 },
    );
    // 200 traversals of up to 1,000 tickets: seconds, not milliseconds, on a busy CI runner.
  }, 60_000);
});
