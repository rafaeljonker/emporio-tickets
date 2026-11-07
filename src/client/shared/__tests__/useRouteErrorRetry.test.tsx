import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRouteErrorRetry } from '@/client/shared/useRouteErrorRetry';

const refresh = vi.fn();
const resetQueries = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
vi.mock('@tanstack/react-query', () => ({ useQueryErrorResetBoundary: () => ({ reset: resetQueries }) }));

describe('useRouteErrorRetry', () => {
  it('clears the failed queries, refreshes the route and resets the boundary', () => {
    const reset = vi.fn();
    const { result } = renderHook(() => useRouteErrorRetry(reset));
    act(() => result.current.handleRetry());
    expect(resetQueries).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
