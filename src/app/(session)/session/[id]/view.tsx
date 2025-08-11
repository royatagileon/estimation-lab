"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import Link from "next/link";
import type { Session } from "@/lib/types";

const fetcher = (u: string) => fetch(u).then(r => r.json());

function slugifyTeam(team?: string) {
  if (!team) return "";
  return team.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "").slice(0, 40);
}

export function SessionView({ id }: { id: string }) {
  // All hooks must run before any early returns to satisfy React rules
  const { data: s, isLoading, mutate } = useSWR<Session>(`/api/session/${id}`, fetcher, { refreshInterval: 1000 });
  const [joining, setJoining] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const notJoined = typeof window !== 'undefined' ? !localStorage.getItem('pid:' + (s?.id ?? '')) : true;
  // Inline editor state (facilitator only)
  const [showEditor, setShowEditor] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [criteria, setCriteria] = useState<string[]>([]);

  // Derivations and effects must be declared before any return
  const numericVotes = useMemo(() => {
    const participants = (s?.participants ?? []) as Array<any>;
    return participants
      .map((p:any)=> Number(p.vote))
      .filter((v:number)=> !isNaN(v) && v>0);
  }, [s?.participants]);
  const unanimous = useMemo(() => numericVotes.length>0 && numericVotes.every(v=>v===numericVotes[0]), [numericVotes]);
  useEffect(() => {
    if (s?.round?.status === 'revealed' && unanimous) {
      import('canvas-confetti').then(({ default: confetti }) => {
        const duration = 1200;
        const end = Date.now() + duration;
        const frame = () => {
          confetti({ particleCount: 120, spread: 100, startVelocity: 40, scalar: 1, ticks: 200, origin: { x: Math.random(), y: Math.random()*0.2 + 0.1 } });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
      }).catch(() => {});
    }
  }, [s?.round?.status, unanimous]);

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
    await mutate(async (curr) => {
      if (!curr) return curr as any;
      const next = { ...curr } as Session;
      next.participants = next.participants.map(p => p.id===myPid ? { ...p, voted: true, vote: v as any } : p);
      return next as any;
    }, { revalidate: false });
    await fetch(`/api/session/${s!.id}/vote`, {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ participantId: myPid, value: v })
    });
    mutate();
  }
  async function unvote() {
    if (!myPid) return;
    await fetch(`/api/session/${s!.id}/vote`, {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ participantId: myPid, value: null })
    });
  }

  function openEditor() {
    if (!iAmFacilitator) return;
    setEditTitle(s?.round.itemTitle || '');
    setEditDesc(s?.round.itemDescription || '');
    setCriteria((s?.round.acceptanceCriteria || '').split('\n').filter(Boolean));
    setShowEditor(true);
  }
  async function submitEditor() {
    if (!iAmFacilitator) return;
    const title = editTitle.trim();
    const description = editDesc.trim();
    const list = criteria.map(c => c.trim()).filter(Boolean);
    if (!title || !description || list.length === 0) return;
    const ac = list.join('\n');
    await fetch(`/api/session/${s!.id}/round`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'start', itemTitle:title, itemDescription:description, acceptanceCriteria: ac, actorParticipantId: myPid }) });
    setShowEditor(false);
    mutate();
  }
  async function reveal() { if (iAmFacilitator) await fetch(`/api/session/${s!.id}/round`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'reveal', actorParticipantId: myPid }) }); }
  async function revote() { if (iAmFacilitator) await fetch(`/api/session/${s!.id}/round`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'revote', actorParticipantId: myPid }) }); }

  // numericVotes/unanimous/useEffect already declared above for stable hook order

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <aside className="md:col-span-4 surface p-5 rounded-2xl">
        <h2 className="font-semibold mb-2">Participants</h2>
        <ul className="text-sm space-y-1">
          {s.participants.map((p: any) => (
            <li key={p.id} className={p.id===s.facilitatorId? 'font-semibold' : ''}>
              {p.name ?? 'Member'}{p.id===myPid ? ' (You)' : ''} {p.id===s.facilitatorId && <span aria-label="Facilitator" title="Facilitator">👑</span>}
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
        <div className="mt-5">
          <h3 className="text-sm font-medium mb-2">Work item</h3>
          {iAmFacilitator ? (
            <div>
              {!showEditor && (
                <>
                  <button className="border rounded px-3 py-2 w-full" onClick={openEditor}>New Work Item</button>
                  {s.round.itemTitle && (
                    <div className="mt-3 text-sm text-neutral-600">
                      <div className="font-medium">{s.round.itemTitle}</div>
                      {s.round.itemDescription && <div className="whitespace-pre-wrap">{s.round.itemDescription}</div>}
                      {s.round.acceptanceCriteria && (
                        <div className="mt-1">
                          <div className="text-xs font-medium">Acceptance Criteria</div>
                          <div className="whitespace-pre-wrap">{s.round.acceptanceCriteria}</div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              {showEditor && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input className="w-full rounded-xl border px-3 py-2 focus-ring" value={editTitle} onChange={e=>setEditTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea className="w-full rounded-xl border px-3 py-2 focus-ring min-h-40" value={editDesc} onChange={e=>setEditDesc(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Acceptance criteria</label>
                    <div className="space-y-2">
                      {criteria.map((c, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input className="flex-1 rounded-xl border px-3 py-2 focus-ring" value={c} onChange={e=>{ const next=[...criteria]; next[idx]=e.target.value; setCriteria(next); }} />
                          <button className="text-xs underline" onClick={()=>{ const next=criteria.slice(); next.splice(idx,1); setCriteria(next); }}>Remove</button>
                        </div>
                      ))}
                      <button className="rounded-full border px-3 py-1.5 text-sm" onClick={()=>setCriteria([...criteria, ''])}>Add criteria</button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-xl bg-accent text-white px-4 py-2 text-sm disabled:opacity-60" onClick={submitEditor} disabled={!editTitle.trim() || !editDesc.trim() || criteria.filter(c=>c.trim()).length===0}>Start</button>
                    <button className="rounded-xl border px-4 py-2 text-sm" onClick={()=>setShowEditor(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-neutral-600">
              {s.round.itemTitle && (
                <div className="space-y-2">
                  <div className="font-medium">{s.round.itemTitle}</div>
                  {s.round.itemDescription && <div className="whitespace-pre-wrap">{s.round.itemDescription}</div>}
                  {s.round.acceptanceCriteria && (
                    <div>
                      <div className="text-xs font-medium">Acceptance Criteria</div>
                      <div className="whitespace-pre-wrap">{s.round.acceptanceCriteria}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      <main className="md:col-span-4 surface p-5 rounded-2xl">
        <Suspense fallback={null}>{/* avoid hook ordering issues caused by dynamic imports */}</Suspense>
        <h2 className="font-semibold mb-2">{isBusiness ? "Business Value Sizing" : "Refinement Poker"}</h2>
        {showEditor ? (
          <div className="mb-4 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input className="w-full rounded-xl border px-3 py-2 focus-ring" value={editTitle} onChange={e=>setEditTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea className="w-full rounded-xl border px-3 py-2 focus-ring min-h-40" value={editDesc} onChange={e=>setEditDesc(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Acceptance criteria</label>
              <div className="space-y-2">
                {criteria.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input className="flex-1 rounded-xl border px-3 py-2 focus-ring" value={c} onChange={e=>{
                      const next=[...criteria]; next[idx]=e.target.value; setCriteria(next);
                    }} />
                    <button className="text-xs underline" onClick={()=>{ const next=criteria.slice(); next.splice(idx,1); setCriteria(next); }}>Remove</button>
                  </div>
                ))}
                <button className="rounded-full border px-3 py-1.5 text-sm" onClick={()=>setCriteria([...criteria, ''])}>Add criteria</button>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="rounded-xl bg-accent text-white px-4 py-2 text-sm disabled:opacity-60" onClick={submitEditor} disabled={!editTitle.trim() || !editDesc.trim() || criteria.filter(c=>c.trim()).length===0}>Start</button>
              <button className="rounded-xl border px-4 py-2 text-sm" onClick={()=>setShowEditor(false)}>Cancel</button>
            </div>
          </div>
        ) : s.round.itemTitle && (
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
        <div className="grid grid-cols-4 gap-3">
          {deck.map(v => {
            const selected = myPid && s.participants.some((p: any)=> p.id===myPid && String(p.vote)===String(v));
            return (
              <motion.button
                key={String(v)}
                whileTap={{ scale: 0.98 }}
                className={`h-11 rounded-xl border text-sm font-medium select-none focus-ring grid place-items-center ${selected? 'bg-green-500 text-white border-green-500': 'hover:bg-slate-800/40'}`}
                aria-label={`vote ${v}`}
                onClick={()=>vote(v as any)}
              >
                <span className="inline-flex items-center gap-2">{String(v)}</span>
              </motion.button>
            );
          })}
        </div>
        <div className="mt-2 text-right">
          <button className="text-xs underline" onClick={unvote}>Clear selection</button>
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

        <div className="mt-3 flex gap-2 items-center">
          <button className="border rounded px-3 py-2 disabled:opacity-50" disabled={!iAmFacilitator} onClick={reveal} title={!iAmFacilitator? 'Facilitator only': undefined}>Reveal</button>
          <button className="border rounded px-3 py-2 disabled:opacity-50" disabled={!iAmFacilitator} onClick={revote} title={!iAmFacilitator? 'Facilitator only': undefined}>Revote</button>
          <span className="text-xs text-slate-500 ml-auto">{s.round.status}</span>
        </div>

        {/* Results box (persistent) */}
        <div className="mt-3">
          <motion.div initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border p-3 text-sm bg-[--color-warn-bg] text-[--color-warn-fg] dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30">
            <div className="text-xs font-medium mb-1">Results</div>
            {s.round.status === 'revealed' && s.round.results?.allVoted && (
              <div>
                {s.round.results.unanimous ? (
                  <div className="text-emerald-700 dark:text-emerald-300">Unanimous! Everyone selected the same card.</div>
                ) : s.round.results.withinWindow ? (
                  <div className="text-emerald-700 dark:text-emerald-300">Ready to finalize at {s.round.results.rounded}. Average {s.round.results.average?.toFixed(1)}.</div>
                ) : (
                  <div className="text-[--color-warn-fg] dark:text-amber-200">Spread detected. Consider a short discussion, then press Revote.</div>
                )}
              </div>
            )}
            {s.round.status !== 'revealed' && <div className="text-slate-400">Waiting for Reveal…</div>}
            {iAmFacilitator && s.round.status === 'revealed' && s.round.results?.withinWindow && (
              <div className="mt-2">
                <button className="rounded-xl bg-emerald-500 text-white px-3 py-1.5 text-sm" onClick={async()=>{
                  await fetch(`/api/session/${s.id}/round`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'finalize_confirm', actorParticipantId: myPid }) });
                  mutate();
                }}>Confirm finalize</button>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <aside className="md:col-span-4 surface p-5 rounded-2xl">
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


