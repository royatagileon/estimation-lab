import { neon, neonConfig } from "@neondatabase/serverless";

// Cache connections across invocations (Edge/Serverless friendly)
neonConfig.fetchConnectionCache = true;

let memoizedSql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!memoizedSql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      // Intentionally throw only when used at runtime, not at import-time
      throw new Error("DATABASE_URL is not set. Please configure your Neon Postgres connection string.");
    }
    memoizedSql = neon(url);
  }
  return memoizedSql;
}

export async function ensureSessionsTable() {
  const sql = getSql();
  await sql`create table if not exists sessions (
    id text primary key,
    data jsonb not null,
    expires_at timestamptz,
    created_at timestamptz default now()
  )`;
}

export type SessionRow = {
  id: string;
  data: unknown;
  expires_at: string | null;
  created_at: string;
};


