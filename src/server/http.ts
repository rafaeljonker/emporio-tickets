import 'server-only';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './root';
import { createTRPCContext, type Context } from './trpc';

/** Caps how many procedures one request can fan out to. */
export const MAX_BATCH_SIZE = 10;

/** The tRPC endpoint without Next: the route delegates here, tests call it directly. */
export function handleTrpcRequest(req: Request, createContext: () => Context = () => createTRPCContext()) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    maxBatchSize: MAX_BATCH_SIZE,
    onError({ error, path }) {
      // Expected errors are answers, not incidents; log only the unexpected ones.
      if (error.code === 'INTERNAL_SERVER_ERROR') console.error(`tRPC ${path ?? '<no path>'}`, error);
    },
  });
}
