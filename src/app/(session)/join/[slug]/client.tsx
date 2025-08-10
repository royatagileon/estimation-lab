"use client";
// TRPC session joins removed; use REST endpoints instead
import { useState } from 'react';

export function JoinSlugClient({ slug }: { slug: string }) {
  async function joinViaApi(slugOrCode: string, displayName?: string) {
    const isCode = /^[0-9]{6}$/.test(slugOrCode);
    if (isCode) {
      const res = await fetch('/api/session/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: slugOrCode, name: displayName }),
      });
      if (!res.ok) throw new Error('join failed');
      return (await res.json()) as { sessionId: string; participantId: string };
    }
    const bySlug = await fetch(`/api/session/by-slug/${encodeURIComponent(slugOrCode)}`);
    if (!bySlug.ok) throw new Error('not found');
    const { id } = (await bySlug.json()) as { id: string };
    // optional: could call join without code for named guests, but our API is code-based.
    return { sessionId: id, participantId: '' };
  }
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Join session</h1>
      <p>
        Invite link code: <span className="font-mono">{slug}</span>
      </p>
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            const res = await joinViaApi(slug, name || undefined);
            window.location.href = `/session/${res.sessionId}`;
          } catch (err) {
            setError('Could not find that session. Check the link or code.');
          }
        }}
      >
        <label className="block text-sm font-medium">Display name</label>
        <input
          className="border px-3 py-2 rounded"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="inline-flex rounded bg-black text-white px-4 py-2">Join</button>
      </form>
    </div>
  );
}


