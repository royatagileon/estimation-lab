type Stamp = { ts: number; count: number };
const buckets = new Map<string, Stamp>();

export function rateLimitKey(key: string, max = Number(process.env.RATE_LIMIT_MAX ?? 120), windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000)) {
  const now = Date.now();
  const stamp = buckets.get(key);
  if (!stamp || now - stamp.ts > windowMs) {
    buckets.set(key, { ts: now, count: 1 });
    return { ok: true, remaining: max - 1 };
  }
  if (stamp.count >= max) return { ok: false, remaining: 0 };
  stamp.count++;
  return { ok: true, remaining: max - stamp.count };
}


