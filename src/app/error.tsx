'use client';

import { RefreshCwIcon } from 'lucide-react';
import { Button } from '@/client/shared/components/ui/button';
import { useRouteErrorRetry } from '@/client/shared/useRouteErrorRetry';

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { handleRetry } = useRouteErrorRetry(reset);
  return (
    <main className="mx-auto max-w-[42rem] px-6 pt-14 pb-16">
      <h1 className="font-display text-4xl leading-tight">Something went wrong</h1>
      <p className="mt-3 max-w-[52ch]">The tickets couldn&apos;t load. Try again in a moment.</p>
      <Button className="mt-6" onClick={handleRetry}>
        <RefreshCwIcon className="size-5" strokeWidth={1.75} aria-hidden="true" />
        Try again
      </Button>
    </main>
  );
}
