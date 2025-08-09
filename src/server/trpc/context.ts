import { prisma } from '@/server/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth/options';
import { headers } from 'next/headers';

export async function createContext() {
  const session = await getServerSession(authOptions);
  const h = await headers();
  return { prisma, session, headers: h };
}

export type Context = Awaited<ReturnType<typeof createContext>>;


