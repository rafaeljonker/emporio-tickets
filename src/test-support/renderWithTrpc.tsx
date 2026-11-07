import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, localLink } from '@trpc/client';
import { render, renderHook } from '@testing-library/react';
import { Suspense, type ReactElement, type ReactNode } from 'react';
import { appRouter, type AppRouter } from '@/server/root';
import { createTicketStore, type TicketStore } from '@/server/tickets/store';
import { TRPCProvider } from '@/trpc/client';

type Options = { store?: TicketStore; queryClient?: QueryClient };

/** Providers wired to the real router and a fresh store, with no network. */
function setup(opts: Options) {
  const store = opts.store ?? createTicketStore();
  const queryClient =
    opts.queryClient ??
    new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000 }, mutations: { retry: false } } });
  const trpcClient = createTRPCClient<AppRouter>({
    links: [localLink({ router: appRouter, createContext: () => Promise.resolve({ store }) })],
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <Suspense fallback={null}>{children}</Suspense>
      </TRPCProvider>
    </QueryClientProvider>
  );
  return { store, queryClient, wrapper };
}

export function renderWithTrpc<T>(hook: () => T, opts: Options = {}) {
  const { store, queryClient, wrapper } = setup(opts);
  return { ...renderHook(hook, { wrapper }), queryClient, store };
}

export function renderUiWithTrpc(ui: ReactElement, opts: Options = {}) {
  const { store, queryClient, wrapper } = setup(opts);
  return { ...render(ui, { wrapper }), queryClient, store };
}
