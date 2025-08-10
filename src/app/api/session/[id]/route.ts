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


