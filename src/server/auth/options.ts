import { PrismaAdapter } from '@auth/prisma-adapter';
import { type NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/server/db';

const hasDb = Boolean(process.env.DATABASE_URL);
const providers: Array<ReturnType<typeof EmailProvider> | ReturnType<typeof GoogleProvider>> = [];

// Only include Email provider when SMTP is configured
if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD && process.env.EMAIL_FROM) {
  providers.push(
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
      },
      from: process.env.EMAIL_FROM,
    }),
  );
}

// Only include Google when configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? 'dev-secret',
  adapter: hasDb ? PrismaAdapter(prisma) : undefined,
  session: { strategy: hasDb ? 'database' : 'jwt' },
  providers,
  pages: {},
  callbacks: {
    async session({ session, user, token }) {
      if (hasDb) {
        if (session.user) (session.user as unknown as { id?: string }).id = user.id;
      } else {
        if (session.user && token) (session.user as unknown as { id?: string }).id = (token as unknown as { sub?: string }).sub ?? '';
      }
      return session;
    },
  },
};


