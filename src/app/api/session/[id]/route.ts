import { NextResponse } from "next/server";
import kv from "@/lib/kv";
import type { Session } from "@/lib/types";

export async function GET(_: Request, ctx: any) {
  const { params } = ctx as { params: { id: string } };
  const s = await kv.get<Session>(`sess:${params.id}`);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(s);
}


