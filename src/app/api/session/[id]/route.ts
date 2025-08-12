export const runtime = "edge";
import { NextResponse } from "next/server";
import type { Session } from "@/lib/types";
import { getSql, ensureSessionsTable } from "@/lib/db";

export async function GET(_: Request, ctx: any) {
  const { params } = ctx as { params: { id: string } };
  await ensureSessionsTable();
  const sql = getSql();
  const rows = (await sql`select data from sessions where id = ${params.id} and (expires_at is null or expires_at > now()) limit 1`) as Array<{ data: Session }>;
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(rows[0].data);
}

export async function POST(req: Request, ctx: any) {
  const { params } = ctx as { params: { id: string } };
  const body = await req.json();
  await ensureSessionsTable();
  const sql = getSql();
  const rows = (await sql`select data from sessions where id = ${params.id} limit 1`) as Array<{ data: Session }>;
  if (!rows.length) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const s = rows[0].data;

  if (body.action === 'transfer_facilitator') {
    const { toParticipantId, actorParticipantId } = body as { toParticipantId: string; actorParticipantId: string };
    if (!actorParticipantId || s.facilitatorId !== actorParticipantId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    if (!s.participants.some(p=>p.id===toParticipantId)) return NextResponse.json({ error: 'participant' }, { status: 400 });
    s.facilitatorId = toParticipantId;
  } else if (body.action === 'suggest_edit') {
    const { by, title, description, criteria } = body as { by: string; title?: string; description?: string; criteria?: string };
    s.round.suggestions = s.round.suggestions ?? [];
    s.round.suggestions.push({ id: String(Date.now()), by, title, description, criteria, createdAt: Date.now() });
    s.round.editStatus = 'requested';
    s.round.editRequestedBy = by;
  } else if (body.action === 'add_task') {
    const { by, text } = body as { by: string; text: string };
    s.round.tasks = s.round.tasks ?? [];
    s.round.tasks.push({ id: String(Date.now()), text: String(text).slice(0, 200), by, status: 'pending', createdAt: Date.now() });
  } else if (body.action === 'approve_task') {
    const { taskId, actorParticipantId } = body as { taskId: string; actorParticipantId: string };
    if (!actorParticipantId || s.facilitatorId !== actorParticipantId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    s.round.tasks = (s.round.tasks ?? []).map(t => t.id===taskId ? { ...t, status: 'approved' } : t);
  } else if (body.action === 'reject_task') {
    const { taskId, actorParticipantId } = body as { taskId: string; actorParticipantId: string };
    if (!actorParticipantId || s.facilitatorId !== actorParticipantId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    s.round.tasks = (s.round.tasks ?? []).map(t => t.id===taskId ? { ...t, status: 'rejected' } : t);
  } else if (body.action === 'remove_task') {
    const { taskId, actorParticipantId } = body as { taskId: string; actorParticipantId: string };
    if (!actorParticipantId || s.facilitatorId !== actorParticipantId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    s.round.tasks = (s.round.tasks ?? []).filter(t => t.id !== taskId);
  } else if (body.action === 'edit_task') {
    const { taskId, text } = body as { taskId: string; text: string };
    s.round.tasks = (s.round.tasks ?? []).map(t => t.id===taskId ? { ...t, text: String(text).slice(0, 200) } : t);
  } else if (body.action === 'grant_edit') {
    const { actorParticipantId, toParticipantId } = body as { actorParticipantId: string; toParticipantId: string };
    if (!actorParticipantId || s.facilitatorId !== actorParticipantId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    s.round.editStatus = 'granted';
    s.round.editorId = toParticipantId;
  } else if (body.action === 'finish_edit') {
    const { by } = body as { by: string };
    if (s.round.editorId !== by) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    s.round.editStatus = 'idle';
    s.round.editorId = undefined;
    s.round.editRequestedBy = undefined;
  } else if (body.action === 'raise_hand') {
    const { actorParticipantId } = body as { actorParticipantId: string };
    if (!actorParticipantId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    s.participants = s.participants.map(p => p.id===actorParticipantId ? { ...p, handRaised: true } : p);
  } else if (body.action === 'lower_hand') {
    const { targetParticipantId, actorParticipantId } = body as { targetParticipantId?: string; actorParticipantId: string };
    const target = targetParticipantId || actorParticipantId;
    if (!target) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    // Allow facilitator to lower anyone's hand; others only themselves
    if (targetParticipantId && s.facilitatorId !== actorParticipantId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    s.participants = s.participants.map(p => p.id===target ? { ...p, handRaised: false } : p);
  } else if (body.action === 'burst') {
    // Reactions removed: no-op
    return NextResponse.json({ ok: true });
  } else if (body.action === 'request_rejoin') {
    const { participantId, name } = body as { participantId: string; name?: string };
    const now = Date.now();
    (s as any).removedList = ((s as any).removedList ?? []).filter((r:any)=> now - (r.removedAt||0) < 24*60*60*1000);
    const wasRemoved = ((s as any).removedList as any[]).some((r:any)=> r.id===participantId);
    if (!wasRemoved) return NextResponse.json({ error: 'not_removed' }, { status: 400 });
    (s as any).rejoinRequests = (s as any).rejoinRequests ?? [];
    const exists = (s as any).rejoinRequests.some((r:any)=>r.id===participantId);
    if (!exists) (s as any).rejoinRequests.push({ id: participantId, name: name || 'Guest', at: now });
  } else if (body.action === 'approve_rejoin') {
    const { targetParticipantId, actorParticipantId } = body as { targetParticipantId: string; actorParticipantId: string };
    if (!actorParticipantId || s.facilitatorId !== actorParticipantId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const reqs = ((s as any).rejoinRequests ?? []) as any[];
    const req = reqs.find(r=>r.id===targetParticipantId);
    (s as any).rejoinRequests = reqs.filter((r:any)=>r.id!==targetParticipantId);
    (s as any).removedList = ((s as any).removedList ?? []).filter((r:any)=>r.id!==targetParticipantId);
    // Re-add participant with requested name
    s.participants.push({ id: targetParticipantId, name: (req?.name || 'Guest'), voted: false });
  } else if (body.action === 'decline_rejoin') {
    const { targetParticipantId, actorParticipantId } = body as { targetParticipantId: string; actorParticipantId: string };
    if (!actorParticipantId || s.facilitatorId !== actorParticipantId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    (s as any).rejoinRequests = ((s as any).rejoinRequests ?? []).filter((r:any)=>r.id!==targetParticipantId);
  } else if (body.action === 'set_participant_color') {
    const { actorParticipantId, color } = body as { actorParticipantId: string; color: string };
    if (!actorParticipantId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    s.participants = s.participants.map(p => p.id===actorParticipantId ? { ...p, color: String(color).slice(0, 64) } : p);
  } else if (body.action === 'blackjack_event') {
    // Blackjack removed: ignore
    return NextResponse.json({ ok: true });
  } else {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  await sql`update sessions set data = ${JSON.stringify(s)}::jsonb where id = ${params.id}`;
  return NextResponse.json({ ok: true });
}


