"use client";
import { trpc } from '@/app/api/trpc/client';
import { useState } from 'react';

export default function JoinSlugPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const join = trpc.joinSessionBySlug.useMutation();
  const [name, setName] = useState("");
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Join session</h1>
      <p>Invite link code: <span className="font-mono">{slug}</span></p>
      <form className="space-y-2" onSubmit={async (e) => {
        e.preventDefault();
        await join.mutateAsync({ slug, displayName: name || undefined });
        window.location.href = `/session/${slug}`;
      }}>
        <label className="block text-sm font-medium">Display name</label>
        <input className="border px-3 py-2 rounded" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="inline-flex rounded bg-black text-white px-4 py-2">Join</button>
      </form>
    </div>
  );
}


