export const runtime = "edge";
import { NextResponse } from "next/server";
import { getSql, ensureSessionsTable } from "@/lib/db";

export async function GET(_: Request, ctx: any) {
  const { params } = ctx as { params: { slug: string } };
  await ensureSessionsTable();
  const sql = getSql();
  const rows = (await sql`select id from sessions where (
        case when (data->>'teamName') is null or (data->>'teamName') = '' then (data->>'code') else lower(regexp_replace((data->>'teamName'), '\\s+', '-', 'g')) || '-' || (data->>'code') end
      ) = ${params.slug} and (expires_at is null or expires_at > now()) limit 1`) as Array<{ id: string }>;
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ id: rows[0].id });
}


