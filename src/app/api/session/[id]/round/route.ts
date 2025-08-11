export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import type { Session } from "@/lib/types";
import { getSql, ensureSessionsTable } from "@/lib/db";

export async function POST(req: NextRequest, ctx: any) {
  const { params } = ctx as { params: { id: string } };
  const body = await req.json();
  await ensureSessionsTable();
  const sql = getSql();
  const rows = (await sql`select data from sessions where id = ${params.id} and (expires_at is null or expires_at > now()) limit 1`) as Array<{ data: Session }>;
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  const s = rows[0].data;

  if (body.action === "start") {
    if (!body.actorParticipantId || s.facilitatorId !== body.actorParticipantId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    s.round = {
      status: "voting",
      itemTitle: String(body.itemTitle || "").slice(0, 200),
      itemDescription: String(body.itemDescription || "").slice(0, 5000),
      acceptanceCriteria: String(body.acceptanceCriteria || "").slice(0, 5000),
    };
    s.participants = s.participants.map(p=>({ ...p, voted:false, vote: undefined }));
    s.round.results = undefined;
  } else if (body.action === "reveal") {
    if (!body.actorParticipantId || s.facilitatorId !== body.actorParticipantId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    s.round.status = "revealed";

    if (s.method === "refinement_poker") {
      const numericVotes = s.participants
        .map(p => (p.vote !== undefined ? Number(p.vote) : NaN))
        .filter(v => Number.isFinite(v)) as number[];

      const allVoted = s.participants.length > 0 && s.participants.every(p => p.voted && p.vote !== undefined && !Number.isNaN(Number(p.vote)));
      if (allVoted) {
        const fibDeck = [0,1,2,3,5,8,13,21,34,55];
        const indexOf = (n: number) => fibDeck.findIndex(x => x === n);
        const indices = numericVotes.map(indexOf).filter(i => i >= 0).sort((a,b)=>a-b);
        const withinThreeWindow = indices.length > 0 && (indices[indices.length - 1] - indices[0] <= 2);
        const unanimous = numericVotes.every(v => v === numericVotes[0]);

        const avg = numericVotes.reduce((a,b)=>a+b,0) / numericVotes.length;
        const roundedUp = Math.ceil(avg);
        s.round.results = { allVoted, withinWindow: withinThreeWindow, average: avg, rounded: roundedUp, unanimous };

        if (withinThreeWindow) {
          // Do NOT auto-finalize. Require facilitator confirmation via a separate action.
          // Result summary already recorded in s.round.results
        }
      }
    }
  } else if (body.action === "revote") {
    if (!body.actorParticipantId || s.facilitatorId !== body.actorParticipantId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (s.round.itemTitle) {
      s.round.status = "voting";
      s.round.results = undefined;
      s.participants = s.participants.map(p=>({ ...p, voted:false, vote: undefined }));
    }
  }

  if (body.action === 'update') {
    const { itemTitle, itemDescription, acceptanceCriteria, by } = body as { itemTitle?: string; itemDescription?: string; acceptanceCriteria?: string; by?: string };
    // Allow facilitator or granted editor to update
    const isFac = !!s.facilitatorId && s.facilitatorId === by;
    const isGranted = s.round.editorId && s.round.editorId === by && s.round.editStatus === 'granted';
    if (!isFac && !isGranted) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    if (typeof itemTitle === 'string') s.round.itemTitle = String(itemTitle).slice(0, 200);
    if (typeof itemDescription === 'string') s.round.itemDescription = String(itemDescription).slice(0, 5000);
    if (typeof acceptanceCriteria === 'string') s.round.acceptanceCriteria = String(acceptanceCriteria).slice(0, 5000);
  }

  if (body.action === "finalize_confirm") {
    if (!body.actorParticipantId || s.facilitatorId !== body.actorParticipantId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const res = s.round.results;
    if (!res || !res.allVoted || !res.withinWindow || res.rounded === undefined) {
      return NextResponse.json({ error: "not_finalizable" }, { status: 400 });
    }
    s.finalizedItems = s.finalizedItems ?? [];
    s.finalizedItems.push({
      title: s.round.itemTitle ?? s.title,
      description: s.round.itemDescription,
      acceptanceCriteria: s.round.acceptanceCriteria,
      value: String(res.rounded),
      average: res.average ?? 0,
      decidedAt: Date.now(),
    });
    s.round = { status: "idle" };
    s.participants = s.participants.map(p=>({ ...p, voted:false, vote: undefined }));
  }

  await sql`update sessions set data = ${JSON.stringify(s)}::jsonb where id = ${params.id}`;
  return NextResponse.json({ ok: true });
}


