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
  const { action, toParticipantId } = await req.json();
  if (action !== 'transfer_facilitator' || !toParticipantId) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  await ensureSessionsTable();
  const sql = getSql();
  const rows = (await sql`select data from sessions where id = ${params.id} limit 1`) as Array<{ data: Session }>;
  if (!rows.length) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const s = rows[0].data;
  if (!s.participants.some(p=>p.id===toParticipantId)) return NextResponse.json({ error: 'participant' }, { status: 400 });
  s.facilitatorId = toParticipantId;
  await sql`update sessions set data = ${JSON.stringify(s)}::jsonb where id = ${params.id}`;
  return NextResponse.json({ ok: true });
}


