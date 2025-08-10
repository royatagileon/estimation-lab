"use client";
import { useEffect, useState, Suspense } from "react";
import useSWR from "swr";
import Link from "next/link";
import type { Session } from "@/lib/types";

const fetcher = (u: string) => fetch(u).then(r => r.json());

function slugifyTeam(team?: string) {
  if (!team) return "";
  return team.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "").slice(0, 40);
}

export function SessionView({ id }: { id: string }) {
  const { data: s, isLoading, mutate } = useSWR<Session>(`/api/session/${id}`, fetcher, { refreshInterval: 1000 });
  if (isLoading) return <div>Loading session…</div>;
  if (!s) return <div>Session not found.</div>;

  const isBusiness = s.method === "business_value";
  const fib = [0,1,2,3,5,8,13,21,34,55,"?","X"] as const;
  const tshirt = ["XS","S","M","L","XL"] as const;
  const deck = isBusiness ? tshirt : fib;

  const slugKey = slugifyTeam(s.teamName) ? `${slugifyTeam(s.teamName)}-${s.code}` : s.code;
  const shareLink = `/s/${slugKey}`;

  const myPid = typeof window !== 'undefined' ? localStorage.getItem('pid:'+ (s?.id ?? '')) ?? undefined : undefined;
  const iAmFacilitator = Boolean(myPid && s && s.facilitatorId === myPid);

  const [joining, setJoining] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const notJoined = typeof window !== 'undefined' ? !localStorage.getItem('pid:' + (s?.id ?? '')) : true;
  async function selfJoin() {
    if (!s || joining) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/session/${s.id}/self-join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: displayName || 'Guest' }) });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('pid:' + s.id, data.participantId);
        await mutate();
      }
    } finally {
      setJoining(false);
    }
  }

  async function vote(v: string | number) {
    if (!myPid) return;
    await fetch(`/api/session/${s!.id}/vote`, {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ participantId: myPid, value: v })
    });
  }

  async function startRound() {
    if (!iAmFacilitator) return;
    const title = prompt('Work item title') || '';
    const description = prompt('Description (optional)') || '';
    const ac = prompt('Acceptance criteria (optional)') || '';
    await fetch(`/api/session/${s!.id}/round`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'start', itemTitle:title, itemDescription:description, acceptanceCriteria: ac, actorParticipantId: myPid }) });
  }
  async function reveal() { if (iAmFacilitator) await fetch(`/api/session/${s!.id}/round`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'reveal', actorParticipantId: myPid }) }); }
  async function revote() { if (iAmFacilitator) await fetch(`/api/session/${s!.id}/round`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'revote', actorParticipantId: myPid }) }); }

  return (
    <div className="grid grid-cols-12 gap-4">
      <aside className="col-span-3 border rounded p-3">
        <h2 className="font-semibold mb-2">Participants</h2>
        <ul className="text-sm space-y-1">
          {s.participants.map((p: any) => (
            <li key={p.id} className={p.id===s.facilitatorId? 'font-semibold' : ''}>
              {p.name ?? 'Member'}{p.id===myPid ? ' (You)' : ''}
              {iAmFacilitator && p.id !== s.facilitatorId && (
                <button className="ml-2 text-xs underline" onClick={async ()=>{ await fetch(`/api/session/${s.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'transfer_facilitator', toParticipantId: p.id, actorParticipantId: myPid }) }); }}>make facilitator</button>
              )}
            </li>
          ))}
        </ul>
        <div className="text-xs text-gray-500 mt-2">Share: <Link href={shareLink} className="underline">{shareLink}</Link></div>
        <div className="text-xs text-gray-500">Code: {s.code}</div>
        {notJoined && (
          <div className="mt-3 space-y-2">
            <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Your name" value={displayName} onChange={e=>setDisplayName(e.target.value)} />
            <button disabled={joining} className="w-full border rounded px-3 py-2 disabled:opacity-50" onClick={selfJoin}>{joining ? 'Joining…' : 'Join Session'}</button>
          </div>
        )}
        {iAmFacilitator && (
          <div className="mt-3">
            <button className="border rounded px-3 py-2 w-full" onClick={startRound}>New Work Item</button>
          </div>
        )}
      </aside>

      <main className="col-span-6 border rounded p-3">
        <Suspense fallback={null}>{/* avoid hook ordering issues caused by dynamic imports */}</Suspense>
        <h2 className="font-semibold mb-2">{isBusiness ? "Business Value Sizing" : "Refinement Poker"}</h2>
        {s.round.itemTitle && (
          <div className="mb-3">
            <div className="font-medium">{s.round.itemTitle}</div>
            {s.round.itemDescription && <div className="text-sm text-neutral-600 whitespace-pre-wrap">{s.round.itemDescription}</div>}
            {s.round.acceptanceCriteria && (
              <div className="mt-1">
                <div className="text-xs font-medium">Acceptance Criteria</div>
                <div className="text-sm text-neutral-600 whitespace-pre-wrap">{s.round.acceptanceCriteria}</div>
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2">
          {deck.map(v => {
            const selected = myPid && s.participants.some((p: any)=> p.id===myPid && String(p.vote)===String(v));
            return (
              <button
                key={String(v)}
                className={`flex-1 border rounded py-6 text-lg ${selected? 'bg-white text-green-600 border-green-600': ''}`}
                aria-label={`vote ${v}`}
                onClick={()=>vote(v as any)}
              >
                {String(v)}
              </button>
            );
          })}
        </div>

        {isBusiness && (
          <div className="mt-3">
            <label className="block text-sm font-medium">Business Value</label>
            <div className="flex gap-2 text-sm">
              {["Not Sure","Very Low","Low","High","Very High"].map(b => (
                <button key={b} className="border rounded px-3 py-2">{b}</button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button className="border rounded px-3 py-2 disabled:opacity-50" disabled={!iAmFacilitator} onClick={reveal}>Reveal</button>
          <button className="border rounded px-3 py-2 disabled:opacity-50" disabled={!iAmFacilitator} onClick={revote}>Revote</button>
        </div>
      </main>

      <aside className="col-span-3 border rounded p-3">
        <h2 className="font-semibold mb-2">Similar Items</h2>
        <p className="text-sm text-gray-500">Model suggestion and neighbors…</p>
        {s.finalizedItems && s.finalizedItems.length > 0 && (
          <div className="mt-3">
            <div className="text-sm font-medium mb-1">Finalized</div>
            <ul className="space-y-2 text-sm">
              {s.finalizedItems.map((fi, idx) => (
                <li key={idx} className="border rounded p-2">
                  <div className="font-medium">{fi.title}</div>
                  <div className="text-xs text-neutral-600">Value: {fi.value} (avg {fi.average.toFixed(1)})</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}


