import { describe, expect, it } from 'vitest';
import { listInput, ticketInput } from '@/domain/tickets/ticket';

describe('ticketInput', () => {
  it('rejects an empty or whitespace-only title', () => {
    const result = ticketInput.safeParse({ title: '   ' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ path: ['title'], message: 'Title is required' });
  });

  it('trims the title', () => {
    expect(ticketInput.parse({ title: '  Piano  ' }).title).toBe('Piano');
  });

  it('rejects a title over 120 characters', () => {
    expect(ticketInput.safeParse({ title: 'x'.repeat(121) }).success).toBe(false);
    expect(ticketInput.safeParse({ title: 'x'.repeat(120) }).success).toBe(true);
  });

  it('turns an empty description into undefined', () => {
    expect(ticketInput.parse({ title: 'a', description: '' }).description).toBeUndefined();
  });

  it('rejects a description over 2000 characters', () => {
    expect(ticketInput.safeParse({ title: 'a', description: 'x'.repeat(2001) }).success).toBe(false);
  });
});

describe('listInput', () => {
  it('defaults the limit to 10', () => {
    expect(listInput.parse({}).limit).toBe(10);
  });

  it.each([0, 51, -1, 1.5])('rejects a limit of %s', (limit) => {
    expect(listInput.safeParse({ limit }).success).toBe(false);
  });

  it('accepts a null cursor', () => {
    expect(listInput.parse({ cursor: null }).cursor).toBeNull();
  });
});
