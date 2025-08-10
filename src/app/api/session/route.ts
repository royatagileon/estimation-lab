export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import type { Session } from "@/lib/types";
import { getSql, ensureSessionsTable } from "@/lib/db";

function genCode(pref?: string) {
  if (pref && /^\d{6}$/.test(pref)) return pref;
  return String(Math.floor(100000 + Math.random() * 900000));
}

function slugifyTeam(team?: string) {
  if (!team) return "";
  return team
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .slice(0, 40);
}

function baseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://estimation-lab.vercel.app";
}

export async function POST(req: NextRequest) {
  await ensureSessionsTable();
  const sql = getSql();
  const body = await req.json();
  const id: string = body.id ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
  const code = genCode(body.joinCode);
  const teamSlug = slugifyTeam(body.teamName);

  const session: Session = {
    id,
    code,
    teamName: body.teamName || "",
    title: body.title || "Session",
    method: body.method === "business_value" ? "business_value" : "refinement_poker",
    participants: [],
    round: { status: "idle" },
    createdAt: Date.now(),
  };

  const ttlSeconds: number | undefined = typeof body.ttl === "number" ? body.ttl : undefined;
  const expiresAt = ttlSeconds ? new Date(Date.now() + Math.max(0, ttlSeconds) * 1000) : null;

  // Upsert into Neon (jsonb column)
  await sql`insert into sessions (id, data, expires_at)
     values (${id}, ${JSON.stringify(session)}::jsonb, ${expiresAt})
     on conflict (id) do update set data = excluded.data, expires_at = excluded.expires_at`;

  const slugKey = teamSlug ? `${teamSlug}-${code}` : code;
  const joinUrl = `${baseUrl()}/s/${slugKey}`;
  const facilitatorToken = globalThis.crypto?.randomUUID?.() ?? undefined;

  return NextResponse.json({ id, code, teamName: session.teamName, joinUrl, facilitatorToken });
}

export async function GET(req: NextRequest) {
  await ensureSessionsTable();
  const sql = getSql();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const rows = (await sql`select id, data, expires_at from sessions where id = ${id} and (expires_at is null or expires_at > now()) limit 1`) as Array<{
    id: string;
    data: Session;
    expires_at: string | null;
  }>;

  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(rows[0].data);
}

export async function DELETE(req: NextRequest) {
  await ensureSessionsTable();
  const sql = getSql();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  await sql`delete from sessions where id = ${id}`;
  return NextResponse.json({ ok: true });
}


