import { NextRequest, NextResponse } from "next/server";
import kv from "@/lib/kv";
import type { Session, FibCard } from "@/lib/types";

export async function POST(req: NextRequest, { params }:{ params:{ id:string }}) {
  const { participantId, value } = await req.json();
  const s = await kv.get<Session>(`sess:${params.id}`);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  const p = s.participants.find(x=>x.id===participantId);
  if (!p) return NextResponse.json({ error: "participant" }, { status: 404 });
  if (s.round.status !== "voting") return NextResponse.json({ ok: true });
  p.voted = true;
  p.vote = value as FibCard;
  await kv.set(`sess:${params.id}`, s);
  return NextResponse.json({ ok: true });
}


