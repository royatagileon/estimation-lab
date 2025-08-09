import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import kv from "@/lib/kv";
import type { Session } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { code, name } = await req.json();
  const id = await kv.get<string>(`code:${code}`);
  if (!id) return NextResponse.json({ error: "not found" }, { status: 404 });
  const s = await kv.get<Session>(`sess:${id}`);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });

  const participantId = randomUUID();
  s.participants.push({ id: participantId, name: String(name||"Guest").slice(0,40), voted: false });
  await kv.set(`sess:${id}`, s);

  return NextResponse.json({ sessionId: id, participantId });
}


