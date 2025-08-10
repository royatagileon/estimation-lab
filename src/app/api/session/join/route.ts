export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import type { Session } from "@/lib/types";
import { getSql, ensureSessionsTable } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { code, name } = await req.json();
  await ensureSessionsTable();
  const sql = getSql();
  const rows = (await sql`select id, data from sessions where (data->>'code') = ${String(code)} and (expires_at is null or expires_at > now()) limit 1`) as Array<{ id: string; data: Session }>;
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { id, data: s } = rows[0];

  const participantId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  s.participants.push({ id: participantId, name: String(name || "Guest").slice(0, 40), voted: false });

  await sql`update sessions set data = ${JSON.stringify(s)}::jsonb where id = ${id}`;

  return NextResponse.json({ sessionId: id, participantId });
}


