// Lightweight KV adapter with a safe in-memory fallback for local/dev
type KVLike = {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<void>;
};

const memoryStore = new Map<string, { value: unknown; expiresAt?: number }>();

const memoryKv: KVLike = {
  async get<T>(key: string) {
    const rec = memoryStore.get(key);
    if (!rec) return null;
    if (rec.expiresAt && Date.now() > rec.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return (rec.value as T) ?? null;
  },
  async set(key: string, value: unknown, opts?: { ex?: number }) {
    const expiresAt = opts?.ex ? Date.now() + opts.ex * 1000 : undefined;
    memoryStore.set(key, { value, expiresAt });
  },
};

let adapter: KVLike = memoryKv;

// If Vercel KV env is present, try to use it. If import fails, stay on memory.
if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const real = require("@vercel/kv");
    if (real?.kv) adapter = real.kv as KVLike;
  } catch {
    // no-op, fallback to memory
  }
}

export default adapter;


