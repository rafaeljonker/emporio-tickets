import type { UseFormSetError } from 'react-hook-form';
import type { TicketFormValues } from '@/domain/tickets/ticket';

const FIELDS = ['title', 'description'] as const satisfies readonly (keyof TicketFormValues)[];

/**
 * Puts server field errors on the matching inputs. The client runs the same schema,
 * so this is a defense for a server that rejects what the client accepted.
 */
export function applyServerFieldErrors(
  fieldErrors: Partial<Record<string, string[] | undefined>>,
  setError: UseFormSetError<TicketFormValues>,
): boolean {
  let applied = false;
  for (const field of FIELDS) {
    const message = fieldErrors[field]?.[0];
    if (message) {
      setError(field, { type: 'server', message });
      applied = true;
    }
  }
  return applied;
}
