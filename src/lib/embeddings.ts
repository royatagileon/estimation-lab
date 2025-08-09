import { pipeline } from '@xenova/transformers';

type Provider = 'local' | 'openai' | 'azureopenai';

let localEmbedder: any | null = null;

async function getLocalEmbedder() {
  if (!localEmbedder) {
    // Lightweight all-MiniLM-L6-v2 equivalent
    localEmbedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return localEmbedder;
}

export async function embedText(text: string): Promise<number[]> {
  const provider = (process.env.EMBEDDINGS_PROVIDER ?? 'local') as Provider;
  if (provider === 'local') {
    const emb = await (await getLocalEmbedder())(text, { pooling: 'mean', normalize: true });
    return Array.from(emb.data as Float32Array).map((v) => Number(v));
  }
  if (provider === 'openai') {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY missing');
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ input: text, model: 'text-embedding-3-small' }),
    }).then((r) => r.json());
    return res.data[0].embedding as number[];
  }
  if (provider === 'azureopenai') {
    const key = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT;
    if (!key || !endpoint || !deployment) throw new Error('Azure OpenAI env missing');
    const res = await fetch(`${endpoint}/openai/deployments/${deployment}/embeddings?api-version=2024-02-15-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': key,
      },
      body: JSON.stringify({ input: text }),
    }).then((r) => r.json());
    return res.data[0].embedding as number[];
  }
  throw new Error('Unknown embeddings provider');
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}


