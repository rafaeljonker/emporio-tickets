import { describe, expect, it, vi } from 'vitest';
import { applyServerFieldErrors } from '@/client/tickets/useCases/form/applyServerFieldErrors';

describe('applyServerFieldErrors', () => {
  it('sets the first message of each field', () => {
    const setError = vi.fn();
    expect(applyServerFieldErrors({ title: ['Title is required', 'other'] }, setError)).toBe(true);
    expect(setError).toHaveBeenCalledWith('title', { type: 'server', message: 'Title is required' });
    expect(setError).toHaveBeenCalledTimes(1);
  });

  it('reports when there was nothing to set', () => {
    const setError = vi.fn();
    expect(applyServerFieldErrors({}, setError)).toBe(false);
    expect(applyServerFieldErrors({ title: [] }, setError)).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});
