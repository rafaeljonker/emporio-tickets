export const TICKET_ERROR = {
  NOT_FOUND: 'TICKET_NOT_FOUND',
  LIMIT_REACHED: 'TICKET_LIMIT_REACHED',
  INVALID_CURSOR: 'TICKET_INVALID_CURSOR',
} as const;

export type TicketErrorCode = (typeof TICKET_ERROR)[keyof typeof TICKET_ERROR];

const codes: ReadonlySet<string> = new Set(Object.values(TICKET_ERROR));

export function isTicketErrorCode(value: unknown): value is TicketErrorCode {
  return typeof value === 'string' && codes.has(value);
}

/** Carries a domain code as a `TRPCError` cause so the error formatter can expose it. */
export class TicketDomainError extends Error {
  constructor(readonly code: TicketErrorCode) {
    super(code);
    this.name = 'TicketDomainError';
  }
}
