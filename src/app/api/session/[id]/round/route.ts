import { NextRequest, NextResponse } from "next/server";
import kv from "@/lib/kv";
import type { Session } from "@/lib/types";

export async function POST(req: NextRequest, ctx: any) {
  const { params } = ctx as { params: { id: string } };
  const body = await req.json();
  const s = await kv.get<Session>(`sess:${params.id}`);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (body.action === "start") {
    s.round = {
      status: "voting",
      itemTitle: String(body.itemTitle||"").slice(0,200),
      itemDescription: String(body.itemDescription||"").slice(0,5000),
      acceptanceCriteria: String(body.acceptanceCriteria||"").slice(0,5000),
    };
    s.participants = s.participants.map(p=>({ ...p, voted:false, vote: undefined }));
  } else if (body.action === "reveal") {
    s.round.status = "revealed";
  } else if (body.action === "revote") {
    if (s.round.itemTitle) {
      s.round.status = "voting";
      s.participants = s.participants.map(p=>({ ...p, voted:false, vote: undefined }));
    }
  }

  await kv.set(`sess:${params.id}`, s);
  return NextResponse.json({ ok: true });
}


