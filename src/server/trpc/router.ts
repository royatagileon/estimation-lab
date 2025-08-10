import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const appRouter = t.router({
  health: t.procedure.query(() => ({ ok: true })),
  currentUser: t.procedure.query(({ ctx }) => ({ user: ctx.session?.user ?? null })),
});

export type AppRouter = typeof appRouter;

 