import 'server-only';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { cache, type ReactNode } from 'react';
import { appRouter, createCaller } from '@/server/root';
import { createTRPCContext } from '@/server/trpc';
import { makeQueryClient } from './query-client';

/** One QueryClient per request, never shared between users. */
export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: () => createTRPCContext(),
  router: appRouter,
  queryClient: getQueryClient,
});

/** Calls procedures in-process. Its results are not hydrated: use it for props and notFound(). */
export const caller = createCaller(createTRPCContext());

export function HydrateClient({ children }: Readonly<{ children: ReactNode }>) {
  return <HydrationBoundary state={dehydrate(getQueryClient())}>{children}</HydrationBoundary>;
}
