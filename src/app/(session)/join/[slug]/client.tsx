"use client";
import { trpc } from '@/app/api/trpc/client';
import { useState } from 'react';

export function JoinSlugClient({ slug }: { slug: string }) {
  const joinBySlug = trpc.joinSessionBySlug.useMutation();
  const joinByCode = trpc.joinSessionByCode.useMutation();
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
            const isCode = /^[0-9]{6}$/.test(slug);
            const res = isCode
              ? await joinByCode.mutateAsync({ code: slug, displayName: name || undefined })
              : await joinBySlug.mutateAsync({ slug, displayName: name || undefined });
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


