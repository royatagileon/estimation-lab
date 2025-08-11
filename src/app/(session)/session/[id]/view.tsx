"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { Crown, Check, X as XIcon, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fireConfettiOnce } from '@/lib/confetti';
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
  const [taskDrafts, setTaskDrafts] = useState<Record<string,string>>({});
  const [showOtherTasks, setShowOtherTasks] = useState(false);
  const [confirmRemoveCriteriaIdx, setConfirmRemoveCriteriaIdx] = useState<number|null>(null);

  // Derivations and effects must be declared before any return
  const numericVotes = useMemo(() => {
    const participants = (s?.participants ?? []) as Array<any>;
    return participants
      .map((p:any)=> Number(p.vote))
      .filter((v:number)=> !isNaN(v) && v>0);
  }, [s?.participants]);
  const unanimous = useMemo(() => numericVotes.length>0 && numericVotes.every(v=>v===numericVotes[0]), [numericVotes]);
  const highLow = useMemo(() => {
    const parts = (s?.participants ?? []) as Array<any>;
    const nums = parts.map(p => ({ id: p.id, name: p.name, v: Number(p.vote) })).filter(x => Number.isFinite(x.v));
    if (nums.length === 0) return null as null | { high: { name: string; v: number }; low: { name: string; v: number } };
    const maxV = Math.max(...nums.map(n=>n.v));
    const minV = Math.min(...nums.map(n=>n.v));
    const low = parts.find(p => Number(p.vote) === minV);
    const high = parts.find(p => Number(p.vote) === maxV);
    return { high: { name: high?.name ?? '—', v: maxV }, low: { name: low?.name ?? '—', v: minV } };
  }, [s?.participants]);
  useEffect(() => {
    if (s?.round?.status === 'revealed' && unanimous) {
      fireConfettiOnce(`round-${s.id}-${s.createdAt}-${s.finalizedItems?.length ?? 0}`);
    }
  }, [s?.round?.status, unanimous, s?.id, s?.createdAt, s?.finalizedItems?.length]);

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
  const iCanEditWorkItem = iAmFacilitator || (s.round.editStatus === 'granted' && s.round.editorId === myPid);
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
    // tap again to clear
    const myCurrent = s?.participants.find((p:any)=>p.id===myPid)?.vote;
    if (String(myCurrent) === String(v)) {
      await fetch(`/api/session/${s!.id}/vote`, {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ participantId: myPid, value: null })
      });
      mutate();
      return;
    }
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
    const canEdit = iAmFacilitator || (s?.round.editStatus === 'granted' && s?.round.editorId === myPid);
    if (!canEdit) return;
    setEditTitle(s?.round.itemTitle || '');
    setEditDesc(s?.round.itemDescription || '');
    setCriteria((s?.round.acceptanceCriteria || '').split('\n').filter(Boolean));
    setShowEditor(true);
  }
  async function submitEditor() {
    const canEdit = iAmFacilitator || (s?.round.editStatus === 'granted' && s?.round.editorId === myPid);
    if (!canEdit) return;
    const title = editTitle.trim();
    const description = editDesc.trim();
    const list = criteria.map(c => c.trim()).filter(Boolean);
    if (!title || !description || list.length === 0) return;
    const ac = list.join('\n');
    // If an item already exists, update it; otherwise start a new round
    const isUpdate = Boolean(s?.round.itemTitle);
    const payload = isUpdate
      ? { action:'update', itemTitle:title, itemDescription:description, acceptanceCriteria: ac, by: myPid }
      : { action:'start', itemTitle:title, itemDescription:description, acceptanceCriteria: ac, actorParticipantId: myPid };
    await fetch(`/api/session/${s!.id}/round`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    setShowEditor(false);
    mutate();
  }
  async function reveal() { if (iAmFacilitator) await fetch(`/api/session/${s!.id}/round`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'reveal', actorParticipantId: myPid }) }); }
  async function revote() { if (iAmFacilitator) await fetch(`/api/session/${s!.id}/round`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'revote', actorParticipantId: myPid }) }); }

  // numericVotes/unanimous/useEffect already declared above for stable hook order

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <aside className="md:col-span-4 rounded-2xl border border-white/20 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950/60 backdrop-blur p-5">
        <h2 className="font-semibold mb-2">Participants</h2>
        <div className="max-h-56 md:max-h-64 overflow-auto pr-1">
          <ul className="text-sm space-y-1">
            {s.participants.map((p: any) => {
              const votedClass = p.voted ? 'text-emerald-700 dark:text-emerald-300' : '';
              return (
                <li key={p.id} className={`${p.id===s.facilitatorId? 'font-semibold' : ''} ${votedClass}`}>
                  {p.name ?? 'Member'}{p.id===myPid ? ' (You)' : ''} {p.id===s.facilitatorId && <span aria-label="Facilitator" title="Facilitator">👑</span>}
                  {iAmFacilitator && p.id !== s.facilitatorId && (
                    <button className="ml-2 text-xs underline" onClick={async ()=>{ await fetch(`/api/session/${s.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'transfer_facilitator', toParticipantId: p.id, actorParticipantId: myPid }) }); }}>make facilitator</button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="text-xs text-gray-500">Code: {s.code}</div>
        {notJoined && (
          <div className="mt-3 space-y-2">
            <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Your name" value={displayName} onChange={e=>setDisplayName(e.target.value)} />
            <button disabled={joining} className="w-full border rounded px-3 py-2 disabled:opacity-50" onClick={selfJoin}>{joining ? 'Joining…' : 'Join Session'}</button>
          </div>
        )}
        <div className="mt-5">
          <h3 className="text-sm font-medium mb-2">Ready for Refinement</h3>
          {iCanEditWorkItem ? (
            <div>
              {!showEditor && (
                <>
                  <div className="flex gap-2">
                    <button className="border rounded px-3 py-2 w-full" onClick={openEditor}>{s.round.itemTitle ? 'Edit' : 'New Work Item'}</button>
                    {s.round.editStatus==='requested' && iAmFacilitator && (
                      <button className="rounded-xl border px-3 py-2 text-sm" onClick={async()=>{
                        await fetch(`/api/session/${s.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'grant_edit', actorParticipantId: myPid, toParticipantId: s.round.editRequestedBy }) });
                        mutate();
                      }}>Grant edit</button>
                    )}
                  </div>
                  {s.round.itemTitle && (
                    <div className="mt-3 rounded-xl border p-3">
                      <div className="font-medium mb-1">{s.round.itemTitle}</div>
                      {s.round.itemDescription && <div className="whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-300">{s.round.itemDescription}</div>}
                      {s.round.acceptanceCriteria && (
                        <div className="mt-2">
                          <div className="text-xs font-medium">Acceptance Criteria</div>
                          <div className="whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-300">{s.round.acceptanceCriteria}</div>
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
                      {criteria.map((c, idx) => {
                        const confirm = confirmRemoveCriteriaIdx === idx;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className={`flex items-center gap-2 ${confirm ? 'bg-red-50 dark:bg-red-900/20 rounded-lg p-1' : ''}`}>
                              <input className="w-full rounded-xl border px-3 py-2 focus-ring" value={c} onChange={e=>{ const next=[...criteria]; next[idx]=e.target.value; setCriteria(next); }} />
                              <button
                                type="button"
                                aria-label="Add criteria below"
                                className="h-8 w-8 rounded-full grid place-items-center bg-emerald-500 text-white"
                                onClick={()=>{
                                  const next = criteria.slice();
                                  next.splice(idx+1, 0, '');
                                  setCriteria(next);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                aria-label={confirm ? 'Confirm remove criteria' : 'Remove criteria'}
                                className="h-8 w-8 rounded-full grid place-items-center bg-red-500 text-white"
                                onClick={()=>{
                                  if (confirm) {
                                    const next = criteria.slice();
                                    next.splice(idx,1);
                                    setCriteria(next);
                                    setConfirmRemoveCriteriaIdx(null);
                                  } else {
                                    setConfirmRemoveCriteriaIdx(idx);
                                  }
                                }}
                              >
                                <XIcon className="h-4 w-4" />
                              </button>
                            </div>
                            {confirm && (
                              <div className="text-xs text-red-600 dark:text-red-300">Click X to remove</div>
                            )}
                          </div>
                        );
                      })}
                      <div>
                        <button type="button" className="rounded-xl border px-3 py-2 text-sm" onClick={()=>setCriteria([...criteria, ''])}>Add criteria</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-xl bg-accent text-white px-4 py-2 text-sm disabled:opacity-60 transition hover:scale-[1.01]" onClick={submitEditor} disabled={!editTitle.trim() || !editDesc.trim() || criteria.filter(c=>c.trim()).length===0}>{s.round.itemTitle? 'Next' : 'Next'}</button>
                    <button className="rounded-xl border px-4 py-2 text-sm" onClick={()=>setShowEditor(false)}>Cancel</button>
                    {s.round.editStatus==='granted' && s.round.editorId===myPid && (
                      <button className="rounded-xl border px-4 py-2 text-sm" onClick={async()=>{
                        await fetch(`/api/session/${s.id}/round`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'finish_edit', by: myPid }) });
                        mutate();
                      }}>Finish</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-neutral-600 dark:text-neutral-300">
              {s.round.itemTitle && (
                <div className="space-y-2 rounded-xl border p-3">
                  <div className="font-medium mb-1">{s.round.itemTitle}</div>
                  {s.round.itemDescription && <div className="whitespace-pre-wrap text-sm">{s.round.itemDescription}</div>}
                  {s.round.acceptanceCriteria && (
                    <div>
                      <div className="text-xs font-medium">Acceptance Criteria</div>
                      <div className="whitespace-pre-wrap text-sm">{s.round.acceptanceCriteria}</div>
                    </div>
                  )}
                  {!iCanEditWorkItem && (
                  <button className="rounded-full border px-3 py-1.5 text-xs" onClick={async()=>{
                    if (!myPid) return;
                    await fetch(`/api/session/${s.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'suggest_edit', by: myPid, title: s.round.itemTitle, description: s.round.itemDescription, criteria: s.round.acceptanceCriteria }) });
                    mutate();
                  }}>Request edit</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Tasks section: available after work item is shown */}
        {Boolean(s.round.itemTitle) && (
          <div className="mt-4">
            <div className="text-sm font-medium mb-1">Tasks</div>
            <div className="space-y-2">
              {(() => {
                const allTasks = (s.round.tasks ?? []) as any[];
                const order = (t:any) => t.status==='approved' ? 2 : t.status==='rejected' ? 1 : 0;
                const byCreated = (a:any,b:any) => (a.createdAt??0) - (b.createdAt??0);
                const approved = allTasks.filter(t=>t.status==='approved');
                const baseList = s.round.status === 'voting' && !showOtherTasks ? approved : allTasks;
                const list = baseList.slice().sort((a,b)=> order(a)-order(b) || byCreated(a,b));
                return list.map((t:any) => (
                  <div key={t.id} className="group text-sm border rounded-lg p-2">
                    <div className="flex items-start gap-2">
                      <textarea className="w-full rounded border px-2 py-1 bg-transparent outline-none resize-y min-h-[40px]" value={taskDrafts[t.id] ?? t.text} onChange={e=>setTaskDrafts(prev=>({ ...prev, [t.id]: (e.target as HTMLTextAreaElement).value }))} onBlur={async(e)=>{
                        const val = (e.target as HTMLTextAreaElement).value;
                        await fetch(`/api/session/${s.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'edit_task', taskId: t.id, text: val }) });
                        setTaskDrafts(prev=>{ const n={...prev}; delete n[t.id]; return n; });
                        mutate();
                      }} />
                      {iAmFacilitator && (
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {t.status!=='approved' && (
                            <button className="h-7 w-7 grid place-items-center rounded bg-emerald-500 text-white" title="Approve" onClick={async()=>{ await fetch(`/api/session/${s.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'approve_task', taskId: t.id, actorParticipantId: myPid }) }); mutate(); }}>
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {t.status!=='rejected' && (
                            <button className="h-7 w-7 grid place-items-center rounded bg-red-500 text-white" title="Reject" onClick={async()=>{ await fetch(`/api/session/${s.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'reject_task', taskId: t.id, actorParticipantId: myPid }) }); mutate(); }}>
                              <XIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button className="h-7 w-7 grid place-items-center rounded bg-slate-200 dark:bg-neutral-800" title="Remove" onClick={async()=>{ await fetch(`/api/session/${s.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'remove_task', taskId: t.id, actorParticipantId: myPid }) }); mutate(); }}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`text-xs ${t.status==='pending' ? 'text-slate-500 dark:text-slate-400' : t.status==='approved' ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ));
              })()}
              {s.round.status === 'voting' && (s.round.tasks ?? []).some((t:any)=>t.status!=='approved') && (
                <button className="text-xs underline" onClick={()=>setShowOtherTasks(v=>!v)}>
                  {showOtherTasks ? '▾ Hide pending/rejected' : '▸ Show pending/rejected'}
                </button>
              )}
              <TaskComposer sessionId={s.id} myPid={myPid} onCreated={mutate} />
            </div>
          </div>
        )}
      </aside>

      <main className="md:col-span-4 rounded-2xl border border-white/20 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950/60 backdrop-blur p-5">
        <Suspense fallback={null}>{/* avoid hook ordering issues caused by dynamic imports */}</Suspense>
        <h2 className="font-semibold mb-2">{isBusiness ? "Business Value Sizing" : "Refinement Poker"}</h2>
        <div className="grid grid-cols-4 gap-3">
          {deck.map(v => {
            const selected = myPid && s.participants.some((p: any)=> p.id===myPid && String(p.vote)===String(v));
            return (
              <motion.button
                key={String(v)}
                whileTap={{ scale: 0.98 }}
                onMouseDown={(e)=>{
                  // long press to start voting if facilitator and idle
                  if (!iAmFacilitator || s.round.status!=='idle') return;
                  const id = setTimeout(async()=>{
                    await fetch(`/api/session/${s.id}/round`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'start_voting', actorParticipantId: myPid }) });
                    mutate();
                  }, 650);
                  const clear = ()=> { clearTimeout(id); window.removeEventListener('mouseup', clear); window.removeEventListener('mouseleave', clear); };
                  window.addEventListener('mouseup', clear); window.addEventListener('mouseleave', clear);
                }}
                className={`h-16 min-w-[56px] px-4 rounded-xl border text-base font-semibold select-none focus-ring grid place-items-center shadow transition ${
                  selected
                    ? 'bg-green-500 text-white border-green-600'
                    : s.round.status==='voting'
                      ? 'bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100'
                      : 'bg-white/70 dark:bg-neutral-900/70 text-neutral-800 dark:text-neutral-100 hover:bg-white dark:hover:bg-neutral-900'
                }`}
                aria-label={`vote ${v}`}
                onClick={()=>vote(v as any)}
              >
                <span className="inline-flex items-center gap-2">{String(v)}</span>
              </motion.button>
            );
          })}
        </div>
        <div className="mt-2"><small className="muted">Tap your selection again to clear</small></div>

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
          <button className="border rounded px-3 py-2 disabled:opacity-50 transition hover:scale-[1.01]" disabled={!iAmFacilitator} onClick={reveal} title={!iAmFacilitator? 'Facilitator only': undefined}>Reveal</button>
          <button className="border rounded px-3 py-2 disabled:opacity-50 transition hover:scale-[1.01]" disabled={!iAmFacilitator} onClick={revote} title={!iAmFacilitator? 'Facilitator only': undefined}>Revote</button>
          <span className="text-xs text-slate-500 ml-auto">{s.round.status}</span>
        </div>

        {/* Notifications (formerly Results) */}
        <div className="mt-3">
          <motion.div initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border p-3 text-sm bg-[--color-warn-bg] text-[--color-warn-fg] dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30">
            <div className="text-xs font-medium mb-1">Notifications</div>
            {s.round.status === 'idle' && ((s.round.tasks??[]).some((t:any)=>t.status==='approved') || (s.round.tasks??[]).length===0) && (
              <div className="flex items-center gap-2">
                <span>Awaiting facilitator to begin the poker round…</span>
                {iAmFacilitator && (
                  <button className="rounded px-2 py-1 text-xs bg-emerald-500 text-white" onClick={async()=>{
                    await fetch(`/api/session/${s.id}/round`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'start_voting', actorParticipantId: myPid }) });
                    mutate();
                  }}>Begin</button>
                )}
              </div>
            )}
            {iAmFacilitator && s.round.status==='voting' && (
              <div className="flex items-center gap-2">
                <span>If you would like to refine the work item more…</span>
                <button className="rounded px-2 py-1 text-xs border" onClick={async()=>{
                  await fetch(`/api/session/${s.id}/round`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'end_voting', actorParticipantId: myPid }) });
                  mutate();
                }}>End poker</button>
              </div>
            )}
            {s.round.status === 'revealed' && s.round.results?.allVoted && (
              <div>
                {s.round.results.unanimous ? (
                  <div className="text-emerald-700 dark:text-emerald-300">Confetti! We all played the {(() => { const map = new Map<string,number>(); s.participants.forEach((p:any)=>{ if(p.vote) map.set(String(p.vote),(map.get(String(p.vote))||0)+1); }); const top=[...map.entries()].sort((a,b)=>b[1]-a[1])[0]; return top? top[0]: 'same card'; })()} card!</div>
                ) : s.round.results.withinWindow ? (
                  <div className="text-emerald-700 dark:text-emerald-300">Ready to finalize at {s.round.results.rounded}. Average {s.round.results.average?.toFixed(1)}.</div>
                ) : (
                  <div className="text-[--color-warn-fg] dark:text-amber-200">Spread detected. High: {highLow?.high.name} ({highLow?.high.v}) · Low: {highLow?.low.name} ({highLow?.low.v}). Consider a short discussion, then press Revote.</div>
                )}
              </div>
            )}
            {s.round.status !== 'revealed' && <div className="text-slate-400">Waiting for Reveal…</div>}
            {iAmFacilitator && s.round.status === 'revealed' && s.round.results?.withinWindow && (
              <div className="mt-2">
                <button className="rounded-xl bg-emerald-500 text-white px-3 py-1.5 text-sm" onClick={async()=>{
                  await fetch(`/api/session/${s.id}/round`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'finalize_confirm', actorParticipantId: myPid }) });
                  mutate();
                }}>Move to Ready</button>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <aside className="md:col-span-4 rounded-2xl border border-white/20 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950/60 backdrop-blur p-5">
        <h2 className="font-semibold mb-2">Ready Work Items</h2>
        {s.finalizedItems && s.finalizedItems.length > 0 && (
          <div className="mt-3">
            <ul className="space-y-2 text-sm">
              {s.finalizedItems.map((fi, idx) => (
                <details key={idx} className="border rounded p-2">
                  <summary className="cursor-pointer font-medium flex items-center justify-between">
                    <span>{fi.title}</span>
                    <span className="text-xs">Estimate: {fi.value}</span>
                  </summary>
                  <div className="mt-2 space-y-2">
                    {fi.description && <div className="text-sm whitespace-pre-wrap">{fi.description}</div>}
                    {fi.acceptanceCriteria && (
                      <div>
                        <div className="text-xs font-medium">Acceptance Criteria</div>
                        <div className="text-sm whitespace-pre-wrap">{fi.acceptanceCriteria}</div>
                      </div>
                    )}
                    {fi.tasks && fi.tasks.length>0 && (
                      <div>
                        <div className="text-xs font-medium">Tasks</div>
                        <ul className="list-disc pl-4 text-sm space-y-1">
                          {fi.tasks.map((t:any)=> (<li key={t.id}>{t.text}</li>))}
                        </ul>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}



function TaskComposer({ sessionId, myPid, onCreated }: { sessionId: string; myPid?: string; onCreated: () => void }) {
  const [text, setText] = useState("");
  return (
    <div className="flex gap-2">
      <input className="flex-1 rounded-xl border px-3 py-2 focus-ring" placeholder="Propose a task…" value={text} onChange={e=>setText(e.target.value)} />
      <button className="rounded-xl border px-3 py-2 text-sm" onClick={async()=>{
        const t = text.trim();
        if (!t) return;
        await fetch(`/api/session/${sessionId}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'add_task', by: myPid ?? '', text: t }) });
        setText("");
        onCreated();
      }}>Send</button>
    </div>
  );
}

