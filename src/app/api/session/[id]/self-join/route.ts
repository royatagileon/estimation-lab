export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import type { Session } from "@/lib/types";
import { getSql, ensureSessionsTable } from "@/lib/db";

export async function POST(req: NextRequest, ctx: any) {
  const { params } = ctx as { params: { id: string } };
  const { name } = await req.json();
  await ensureSessionsTable();
  const sql = getSql();
  const rows = (await sql`select data from sessions where id = ${params.id} limit 1`) as Array<{ data: Session }>;
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  const s = rows[0].data;

  const participantId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  s.participants.push({ id: participantId, name: String(name || "Guest").slice(0, 40), voted: false });
  if (!s.facilitatorId) s.facilitatorId = participantId;

  await sql`update sessions set data = ${JSON.stringify(s)}::jsonb where id = ${params.id}`;
  return NextResponse.json({ sessionId: params.id, participantId, facilitatorId: s.facilitatorId });
}


