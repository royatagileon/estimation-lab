"use client";
import { useEffect, useMemo, useState, Suspense, useRef } from "react";
import { Star, Check, X as XIcon, Trash2, Plus, MoreVertical } from "lucide-react";
const workTypeDescriptions: Record<string,string> = {
  'defect': 'bug fix for broken or regressed behavior',
  'enhancement': 'improve existing feature such as UX or performance or small additions',
  'new-request': 'net new capability not currently supported',
  'ktlo': 'maintenance and operations such as upgrades, patches, monitoring, deprecations',
  'compliance': 'regulatory or security work such as audits, policies, data retention, access controls',
  'kaizen': 'continuous improvement such as refactors, technical debt, developer experience improvements',
  'research': 'spike or feasibility or prototype',
  'testing-qa': 'tests, automation, regression runs, flaky test fixes',
};
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const notJoined = mounted ? !localStorage.getItem('pid:' + (s?.id ?? '')) : false;
  // Inline editor state (facilitator only)
  const [showEditor, setShowEditor] = useState(false);
  const [workType, setWorkType] = useState<
    'defect'|'enhancement'|'new-request'|'ktlo'|'compliance'|'kaizen'|'research'|'testing-qa'|''
  >('');
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

  function getContrastingText(bg: string | undefined): string | undefined {
    if (!bg) return undefined;
    // Handle hsl(h, s%, l%) quickly
    const hsl = bg.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i);
    if (hsl) {
      const l = parseInt(hsl[3], 10) / 100;
      return l > 0.6 ? '#111' : '#fff';
    }
    const rgb = bg.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgb) {
      const r = parseInt(rgb[1],10), g=parseInt(rgb[2],10), b=parseInt(rgb[3],10);
      const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
      return luminance > 0.6 ? '#111' : '#fff';
    }
    // Default to white text
    return '#fff';
  }

  function randomColor() {
    return `hsl(${Math.floor(Math.random()*360)}, 85%, 50%)`;
  }
  useEffect(() => {
    if (s?.round?.status === 'revealed' && unanimous) {
      fireConfettiOnce(`round-${s.id}-${s.createdAt}-${s.finalizedItems?.length ?? 0}`);
    }
  }, [s?.round?.status, unanimous, s?.id, s?.createdAt, s?.finalizedItems?.length]);

  // Secret mini-game disabled for stability
  const secretUnlocked = false;
  const secretActive = false;
  const ariaMessage = '';

  // removed mini-game helpers

  function enterGame() { /* disabled */ }
  function exitGame() { /* disabled */ }

  // Expose control API for facilitator override
  // removed external API

  // Auto-exit when voting starts
  //

  function processUnlockClick(_: string | number) { /* disabled */ }

  // Blackjack removed
  // Reactions removed

  //

  function fibSymbolAt(index: number) {
    const arr = [0,1,2,3,5,8,13,21,34,55,'?','X'] as any[];
    return arr[index];
  }

  // Consume blackjack events from activity
  // Removed blackjack event handling

  //

  // (Removed older floating burst animation in favor of inline emoji with timeout)


  async function handleTileClickGame(_: number) { /* disabled */ }

  //

  if (isLoading) return <div>Loading session…</div>;
  if (!s) return <div>Session not found.</div>;

  const isBusiness = s.method === "business_value";
  const fib = [0,1,2,3,5,8,13,21,34,55,"?","X"] as const;
  const tshirt = ["XS","S","M","L","XL"] as const;
  const deck = isBusiness ? tshirt : fib;

  const slugKey = slugifyTeam(s.teamName) ? `${slugifyTeam(s.teamName)}-${s.code}` : s.code;
  const shareLink = `/s/${slugKey}`;

  const myPid = mounted ? (localStorage.getItem('pid:'+ (s?.id ?? '')) ?? undefined) : undefined;
  const iAmFacilitator = Boolean(myPid && s && s.facilitatorId === myPid);
  const iCanEditWorkItem = iAmFacilitator || (s.round.editStatus === 'granted' && s.round.editorId === myPid);
  const [assignMode, setAssignMode] = useState(false);
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
    setWorkType((s?.round.workType as any) || '');
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
      ? { action:'update', workType: workType || undefined, itemTitle:title, itemDescription:description, acceptanceCriteria: ac, by: myPid }
      : { action:'start', workType: workType || undefined, itemTitle:title, itemDescription:description, acceptanceCriteria: ac, actorParticipantId: myPid };
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
        <h2 className="font-semibold mb-2">Participants <span className="text-xs text-slate-500">({s.participants.length})</span></h2>
        <div className="max-h-48 overflow-auto pr-1">
          <ul className="space-y-2">
            {s.participants.map((p: any) => {
              const isFac = p.id===s.facilitatorId;
              const canShowMenu = (p.id===myPid) || (iAmFacilitator && !isFac);
              return (
                <li key={p.id} className="group relative" data-participant-id={p.id}>
                  <div className={`flex items-center gap-2 rounded-full border px-3 py-2 min-h-11 ${
                    (s.round.status==='voting' && p.voted) ? 'bg-emerald-500 text-white border-emerald-600' : ''
                  }`}
                    title={assignMode && iAmFacilitator ? 'Click to assign facilitator' : undefined}
                    onClick={async()=>{
                      if (assignMode && iAmFacilitator && p.id !== s.facilitatorId) {
                        await fetch(`/api/session/${s.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'transfer_facilitator', toParticipantId: p.id, actorParticipantId: myPid }) });
                        setAssignMode(false);
                        mutate();
                        return;
                      }
                    }}
                  >
                    {isFac ? (
                      <span className={`inline-grid h-6 w-6 place-items-center rounded-full ${p.handRaised ? 'bg-yellow-500' : 'bg-yellow-400'} text-white`} title={p.handRaised ? 'Hand raised' : 'Facilitator'}>
                        <Star className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span
                        className="inline-grid h-6 w-6 place-items-center rounded-full border text-xs"
                        aria-hidden
                        style={{ backgroundColor: p.color || undefined, color: p.color ? getContrastingText(p.color) : undefined }}
                        title="Click to cycle color"
                        onClick={async()=>{
                          if (p.id !== myPid) return;
                          const nextColor = randomColor();
                          await fetch(`/api/session/${s.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'set_participant_color', actorParticipantId: myPid, color: nextColor }) });
                          mutate();
                        }}
                      > {p.name?.[0]?.toUpperCase() || 'P'} </span>
                    )}
                    <span className="flex-1 truncate">{p.name ?? 'Member'}{p.id===myPid ? ' (You)' : ''}</span>
                    <div className="flex items-center gap-2">
                      {p.handRaised && <span title="Hand raised" aria-label="Hand raised">✋</span>}
                      {/* reactions removed */}
                      {canShowMenu && (
                        <div
                          className="opacity-60 hover:opacity-100 transition cursor-pointer"
                          role="button"
                          aria-label="Participant actions"
                          tabIndex={0}
                          onClick={(e)=>{
                            const host = (e.currentTarget.closest('li')) as HTMLElement | null;
                            if (!host) return;
                            const menu = host.querySelector('[data-participant-menu]') as HTMLElement | null;
                            if (menu) menu.classList.toggle('hidden');
                          }}
                          onKeyDown={(e)=>{ if (e.key==='Enter' || e.key===' ') (e.currentTarget as HTMLElement).click(); }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    {/* Inline popover menu */}
                    <div data-participant-menu className="hidden absolute right-2 top-1/2 -translate-y-1/2 bg-white/95 border rounded-full px-2 py-1 shadow flex items-center gap-2">
                      {p.id===myPid && !p.handRaised && (
                        <button title="Raise hand" onClick={async()=>{ await fetch(`/api/session/${s.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'raise_hand', actorParticipantId: myPid }) }); mutate(); }}>✋</button>
                      )}
                      {p.handRaised && (
                        <>
                          {iAmFacilitator && p.id!==myPid && (
                            <button title="Lower hand" onClick={async()=>{ await fetch(`/api/session/${s.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'lower_hand', targetParticipantId: p.id, actorParticipantId: myPid }) }); mutate(); }}>⬇️</button>
                          )}
                          {p.id===myPid && (
                            <button title="Lower hand" onClick={async()=>{ await fetch(`/api/session/${s.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'lower_hand', targetParticipantId: p.id, actorParticipantId: myPid }) }); mutate(); }}>⬇️</button>
                          )}
                        </>
                      )}
                      {/* celebrate/thumbs removed */}
                      {iAmFacilitator && !isFac && (
                        <button title="Assign Facilitator (then click a name)" onClick={()=>{ setAssignMode(true); const host = document.querySelector(`[data-participant-id="${p.id}"]`)?.querySelector('[data-participant-menu]') as HTMLElement | null; if (host) host.classList.add('hidden'); }}>⭐</button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
        </ul>
          {/* Rejoin Requests */}
          {Boolean((s as any).rejoinRequests?.length) && (
            <div className="mt-3 space-y-2">
              {((s as any).rejoinRequests as any[]).map((r:any)=>(
                <div key={r.id} className="flex items-center gap-2 rounded-full border px-3 py-2 min-h-11 bg-orange-100 text-orange-900">
                  <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-orange-400 text-white" aria-hidden>!</span>
                  <span className="flex-1 truncate">{r.name} requests to rejoin</span>
                  {iAmFacilitator && (
                    <button className="rounded-full bg-orange-500 text-white px-3 py-1 text-xs" onClick={async()=>{
                      await fetch(`/api/session/${s.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'approve_rejoin', targetParticipantId: r.id, actorParticipantId: myPid }) });
                      mutate();
                    }}>Approve</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Session code intentionally hidden per request */}
        {notJoined && (
          <div className="mt-3">
            <div className="flex items-center gap-2 rounded-full border px-3 py-2 min-h-11">
              <input className="flex-1 bg-transparent outline-none placeholder:italic placeholder:text-slate-400" placeholder="Enter your name" value={displayName} onChange={e=>setDisplayName(e.target.value)} />
              {Boolean((s as any).removedList?.length) ? (
                <button className="rounded-full bg-orange-500 text-white px-3 py-1.5 text-sm" onClick={async()=>{
                  const last = ((s as any).removedList as any[]).find((r:any)=> r.id === (localStorage.getItem('pid:'+s.id) || 'anon'));
                  if (!last) return;
                  const now = Date.now();
                  if (now - (last.removedAt||0) >= 24*60*60*1000) {
                    selfJoin();
                    return;
                  }
                  await fetch(`/api/session/${s.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'request_rejoin', participantId: localStorage.getItem('pid:'+s.id) || 'anon', name: displayName || 'Guest' }) });
                  mutate();
                }}>Request</button>
              ) : (
                <button disabled={joining || !displayName.trim()} className="rounded-full bg-emerald-500 text-white px-4 py-1.5 text-sm disabled:opacity-60" onClick={selfJoin}>{joining ? 'Joining…' : 'Join'}</button>
              )}
            </div>
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
                    <label htmlFor="work-type" className="block text-sm font-medium mb-1">Work Type</label>
                    <select
                      id="work-type"
                      className="w-full rounded-xl border px-3 py-2 focus-ring"
                      aria-describedby="work-type-help"
                      value={workType}
                      onChange={(e)=> setWorkType(e.target.value as any)}
                      title={workType ? workTypeDescriptions[workType] : 'Select work type'}
                    >
                      <option value="" disabled>Select work type</option>
                      <option value="defect">Defect</option>
                      <option value="enhancement">Enhancement</option>
                      <option value="new-request">New Request</option>
                      <option value="ktlo">KTLO</option>
                      <option value="compliance">Compliance</option>
                      <option value="kaizen">Kaizen</option>
                      <option value="research">Research</option>
                      <option value="testing-qa">Testing/QA</option>
                    </select>
                    <p id="work-type-help" className="text-xs text-slate-500 mt-1">{workType ? workTypeDescriptions[workType] : 'Choose the most appropriate type for this work item.'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      className="w-full rounded-xl border px-3 py-2 focus-ring placeholder:italic placeholder:text-slate-400"
                      value={editTitle}
                      placeholder="Brief title of work item (e.g., 'Add date filter')"
                      onChange={e=>setEditTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      className="w-full rounded-xl border px-3 py-2 focus-ring min-h-40 placeholder:italic placeholder:text-slate-400"
                      placeholder="Details and context (e.g., 'Users need to filter results by date to speed searches')."
                      value={editDesc}
                      onChange={e=>setEditDesc(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Acceptance criteria</label>
                    <div className="space-y-2">
                      {criteria.map((c, idx) => {
                        const confirm = confirmRemoveCriteriaIdx === idx;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className={`flex items-center gap-2 ${confirm ? 'bg-red-50 dark:bg-red-900/20 rounded-lg p-1' : ''}`}>
                              <input
                                className="w-full rounded-xl border px-3 py-2 focus-ring placeholder:italic placeholder:text-slate-400"
                                placeholder="Completion conditions (e.g., 'Date filter works')."
                                value={c}
                                onChange={e=>{ const next=[...criteria]; next[idx]=e.target.value; setCriteria(next); }}
                              />
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
                      <textarea
                        className="w-full px-2 py-1 bg-transparent outline-none resize-y min-h-[40px] placeholder:italic placeholder:text-slate-400"
                        placeholder="enter text here…"
                        value={taskDrafts[t.id] ?? t.text}
                        onChange={e=>setTaskDrafts(prev=>({ ...prev, [t.id]: (e.target as HTMLTextAreaElement).value }))}
                        onBlur={async(e)=>{
                        const val = (e.target as HTMLTextAreaElement).value;
                        await fetch(`/api/session/${s.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'edit_task', taskId: t.id, text: val }) });
                        setTaskDrafts(prev=>{ const n={...prev}; delete n[t.id]; return n; });
                        mutate();
                      }}
                      />
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
        {/* blackjack UI removed */}
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
                data-value={String(v)}
                data-testid={`vote-tile-${String(v)}`}
                className={`h-16 min-w-[56px] px-4 rounded-xl border text-base font-semibold select-none focus-ring grid place-items-center shadow transition ${
                  selected
                    ? 'bg-green-500 text-white border-green-600'
                    : s.round.status==='voting'
                      ? 'bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100'
                      : 'bg-white/70 dark:bg-neutral-900/70 text-neutral-800 dark:text-neutral-100 hover:bg-white dark:hover:bg-neutral-900'
                }`}
                aria-label={`vote ${v}`}
                onClick={()=>{
                  processUnlockClick(v as any);
                  vote(v as any);
                }}
              >
                <span className="inline-flex items-center gap-2">
                  {String(v)}
                </span>
              </motion.button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <small className="muted">Tap your selection again to clear</small>
            <span className="sr-only" role="status" aria-live="polite"></span>
          </div>
          <div>
            {/* secret game controls removed */}
          </div>
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
                <span>Awaiting facilitator to start the poker round…</span>
                {iAmFacilitator && (
                  <button className="rounded px-2 py-1 text-xs bg-emerald-500 text-white" onClick={async()=>{
                    await fetch(`/api/session/${s.id}/round`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'start_voting', actorParticipantId: myPid }) });
                    mutate();
                  }}>Play Poker</button>
                )}
              </div>
            )}
            {iAmFacilitator && s.round.status==='voting' && (
              <div className="flex items-center gap-2">
                <span>If you would like to refine the work item more…</span>
                <button className="rounded px-2 py-1 text-xs bg-red-500 text-white" onClick={async()=>{
                  await fetch(`/api/session/${s.id}/round`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'end_voting', actorParticipantId: myPid }) });
                  mutate();
                }}>Stop Poker</button>
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

