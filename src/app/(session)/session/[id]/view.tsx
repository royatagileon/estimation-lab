"use client";
import { trpc } from '@/app/api/trpc/client';
import Link from 'next/link';

export function SessionView({ id }: { id: string }) {
  const info = trpc.getSession.useQuery({ id });
  if (info.isLoading) return <div>Loading session…</div>;
  if (!info.data) return <div>Session not found.</div>;
  const isTShirt = info.data.deckType === 'TSHIRT';
  const deck = isTShirt ? ['XS','S','M','L','XL'] : ['1','2','3','5','8','13','21'];
  return (
    <div className="grid grid-cols-12 gap-4">
      <aside className="col-span-3 border rounded p-3">
        <h2 className="font-semibold mb-2">Participants</h2>
        <ul className="text-sm space-y-1">
          {info.data.participants.map((p) => (
            <li key={p.id}>{p.name ?? 'Member'}</li>
          ))}
        </ul>
        <div className="text-xs text-gray-500 mt-2">Share: <Link href={info.data.shareLink} className="underline">{info.data.shareLink}</Link></div>
        <div className="text-xs text-gray-500">Code: {info.data.joinCode}</div>
      </aside>
      <main className="col-span-6 border rounded p-3">
        <h2 className="font-semibold mb-2">{isTShirt ? 'Business Value Sizing' : 'Refinement Poker'}</h2>
        <div className="flex gap-2">
          {deck.map((v) => (
            <button key={v} className="flex-1 border rounded py-6 text-lg" aria-label={`vote ${v}`}>{v}</button>
          ))}
        </div>
        {isTShirt && (
          <div className="mt-3">
            <label className="block text-sm font-medium">Business Value</label>
            <div className="flex gap-2 text-sm">
              {['Not Sure','Very Low','Low','High','Very High'].map((b) => (
                <button key={b} className="border rounded px-3 py-2">{b}</button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <button className="border rounded px-3 py-2">Reveal</button>
          <button className="border rounded px-3 py-2">Revote</button>
          <button className="border rounded px-3 py-2">Finalize</button>
        </div>
      </main>
      <aside className="col-span-3 border rounded p-3">
        <h2 className="font-semibold mb-2">Similar Items</h2>
        <p className="text-sm text-gray-500">Model suggestion and neighbors…</p>
      </aside>
    </div>
  );
}


