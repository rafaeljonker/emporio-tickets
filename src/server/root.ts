import 'server-only';
import type { inferRouterOutputs } from '@trpc/server';
import { ticketRouter } from './tickets/router';
import { createCallerFactory, createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({ ticket: ticketRouter });

export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export const createCaller = createCallerFactory(appRouter);
