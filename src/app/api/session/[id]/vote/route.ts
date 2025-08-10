export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import type { Session, FibCard } from "@/lib/types";
import { getSql, ensureSessionsTable } from "@/lib/db";

export async function POST(req: NextRequest, ctx: any) {
  const { params } = ctx as { params: { id: string } };
  const { participantId, value } = await req.json();
  await ensureSessionsTable();
  const sql = getSql();
  const rows = (await sql`select data from sessions where id = ${params.id} and (expires_at is null or expires_at > now()) limit 1`) as Array<{ data: Session }>;
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  const s = rows[0].data;
  const p = s.participants.find((x) => x.id === participantId);
  if (!p) return NextResponse.json({ error: "participant" }, { status: 404 });
  if (s.round.status !== "voting") return NextResponse.json({ ok: true });
  p.voted = true;
  p.vote = value as FibCard;
  await sql`update sessions set data = ${JSON.stringify(s)}::jsonb where id = ${params.id}`;
  return NextResponse.json({ ok: true });
}


