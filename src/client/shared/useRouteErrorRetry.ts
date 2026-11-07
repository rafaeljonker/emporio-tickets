import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { startTransition } from 'react';

/** "Try again" must refetch a failed suspense query, not just re-render the boundary. */
export function useRouteErrorRetry(reset: () => void) {
  const router = useRouter();
  const { reset: resetQueries } = useQueryErrorResetBoundary();
  return {
    handleRetry: () => {
      startTransition(() => {
        resetQueries();
        router.refresh();
        reset();
      });
    },
  };
}
