"use client";
import { useState } from 'react';
import { trpc } from '@/app/api/trpc/client';

export default function NewSessionPage() {
  const [title, setTitle] = useState("");
  const [deck, setDeck] = useState("FIBONACCI");
  const utils = trpc.useUtils();
  const create = trpc.createSession.useMutation();
  const [result, setResult] = useState<{ link: string; code: string } | null>(null);
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">New Session</h1>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const workspaceId = 'demo';
          const res = await create.mutateAsync({ workspaceId, title, deckType: deck as any, privacy: 'PRIVATE' });
          setResult({ link: res.shareLink, code: res.joinCode });
        }}
      >
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Deck</label>
          <select value={deck} onChange={(e) => setDeck(e.target.value)} className="w-full border px-3 py-2 rounded">
            <option value="FIBONACCI">Fibonacci</option>
          </select>
        </div>
        <button className="inline-flex rounded bg-black text-white px-4 py-2">Create</button>
      </form>
      {result && (
        <div className="rounded border p-3 space-y-2">
          <div className="text-sm">Share link:</div>
          <div className="font-mono break-all">{result.link}</div>
          <div className="text-sm">Join code:</div>
          <div className="font-mono">{result.code}</div>
          <button
            className="mt-2 border rounded px-3 py-1"
            onClick={() => navigator.clipboard.writeText(`${result.link} (code ${result.code})`)}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}


