"use client";
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { trpc } from '@/app/api/trpc/client';

export default function NewSessionPage() {
  const [title, setTitle] = useState("");
  const [deck, setDeck] = useState("FIBONACCI");
  const [customSlug, setCustomSlug] = useState("");
  const [customCode, setCustomCode] = useState("");
  // const utils = trpc.useUtils();
  const create = trpc.createSession.useMutation();
  const [result, setResult] = useState<{ link: string; code: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">New Session</h1>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            const res = await create.mutateAsync({
              workspaceSlug: 'demo',
              title,
              deckType: deck as 'FIBONACCI' | 'TSHIRT' | 'CUSTOM',
              privacy: 'PRIVATE',
              customShareSlug: customSlug || undefined,
              customJoinCode: customCode || undefined,
            });
            // redirect straight into session after creation
            window.location.href = `/session/${res.id}`;
          } catch (err: any) {
            if (err?.data?.code === 'UNAUTHORIZED') {
              signIn(undefined, { callbackUrl: '/session/new' });
            } else {
              setError(err?.message ?? 'Failed to create session');
            }
          }
        }}
      >
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Estimation Method</label>
          <select value={deck} onChange={(e) => setDeck(e.target.value)} className="w-full border px-3 py-2 rounded">
            <option value="FIBONACCI">Refinement Poker (Relative Estimation)</option>
            <option value="TSHIRT">Business Value Sizing (Affinity Estimation)</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Custom Share Slug (optional)</label>
            <input value={customSlug} onChange={(e) => setCustomSlug(e.target.value)} placeholder="e.g. team-sprint-5" className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium">Custom Join Code (6 digits, optional)</label>
            <input value={customCode} onChange={(e) => setCustomCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="e.g. 482913" className="w-full border px-3 py-2 rounded" />
          </div>
        </div>
        <button className="inline-flex rounded bg-black text-white px-4 py-2">Create</button>
        {error && <div className="text-sm text-red-600">{error}</div>}
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


