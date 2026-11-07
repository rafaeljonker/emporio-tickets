import { TRPCClientError } from '@trpc/client';
import { describe, expect, it } from 'vitest';
import { toUserMessage } from '@/client/shared/lib/errorMessage';

const clientError = (data: Record<string, unknown> | undefined) =>
  TRPCClientError.from({ error: { message: 'raw', code: -32600, data } } as never);

describe('toUserMessage', () => {
  it.each([
    ['TICKET_NOT_FOUND', 'This ticket no longer exists.'],
    ['TICKET_LIMIT_REACHED', 'The board is full (1,000 tickets). Delete one before adding another.'],
    ['TICKET_INVALID_CURSOR', "Couldn't load more tickets. Try again."],
  ])('explains %s', (domainCode, message) => {
    expect(toUserMessage(clientError({ code: 'BAD_REQUEST', domainCode }))).toBe(message);
  });

  it('asks to fix the fields for a validation error', () => {
    expect(toUserMessage(clientError({ code: 'BAD_REQUEST', domainCode: null }))).toBe('Check the highlighted fields and try again.');
  });

  it('explains a network failure', () => {
    expect(toUserMessage(TRPCClientError.from(new TypeError('Failed to fetch')))).toBe(
      "Can't reach the server. Check your connection and try again.",
    );
  });

  it('falls back for anything else', () => {
    expect(toUserMessage(new Error('boom'))).toBe('Something went wrong. Try again.');
    expect(toUserMessage(clientError({ code: 'INTERNAL_SERVER_ERROR', domainCode: null }))).toBe('Something went wrong. Try again.');
  });
});
