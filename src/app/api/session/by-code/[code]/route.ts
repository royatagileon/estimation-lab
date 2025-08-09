import { NextResponse } from "next/server";
import kv from "@/lib/kv";

export async function GET(_: Request, ctx: any) {
  const { params } = ctx as { params: { code: string } };
  const id = await kv.get<string>(`code:${params.code}`);
  if (!id) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ id });
}


