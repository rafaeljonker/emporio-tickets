import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, localLink } from '@trpc/client';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { appRouter, type AppRouter } from '@/server/root';
import { createTicketStore, type TicketStore } from '@/server/tickets/store';
import { TRPCProvider } from '@/trpc/client';

/** Renders a hook against the real router and a fresh store, with no network. */
export function renderWithTrpc<T>(hook: () => T, opts: { store?: TicketStore; queryClient?: QueryClient } = {}) {
  const store = opts.store ?? createTicketStore();
  const queryClient = opts.queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000 }, mutations: { retry: false } } });
  const trpcClient = createTRPCClient<AppRouter>({
    links: [localLink({ router: appRouter, createContext: () => Promise.resolve({ store }) })],
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
  return { ...renderHook(hook, { wrapper }), queryClient, store };
}
