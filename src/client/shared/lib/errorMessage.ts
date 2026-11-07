import { TRPCClientError } from '@trpc/client';
import { isTicketErrorCode, type TicketErrorCode } from '@/domain/tickets/errors';

const byDomainCode: Record<TicketErrorCode, string> = {
  TICKET_NOT_FOUND: 'This ticket no longer exists.',
  TICKET_LIMIT_REACHED: 'The board is full (1,000 tickets). Delete one before adding another.',
  TICKET_INVALID_CURSOR: "Couldn't load more tickets. Try again.",
};

const FALLBACK = 'Something went wrong. Try again.';

type ErrorData = { code?: unknown; domainCode?: unknown };

/** The only place an error becomes copy. Decides by code, never by parsing messages. */
export function toUserMessage(error: unknown): string {
  if (!(error instanceof TRPCClientError)) return FALLBACK;
  const data = error.data as ErrorData | undefined;
  // No data means the request never got a tRPC answer: the network failed.
  if (!data) return "Can't reach the server. Check your connection and try again.";
  if (isTicketErrorCode(data.domainCode)) return byDomainCode[data.domainCode];
  if (data.code === 'BAD_REQUEST') return 'Check the highlighted fields and try again.';
  return FALLBACK;
}

/** True when the server answered NOT_FOUND (the thing is already gone). */
export function isNotFound(error: unknown): boolean {
  return error instanceof TRPCClientError && (error.data as ErrorData | undefined)?.code === 'NOT_FOUND';
}
