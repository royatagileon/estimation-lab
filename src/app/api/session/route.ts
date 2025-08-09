import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import kv from "@/lib/kv";
import type { Session } from "@/lib/types";

function genCode(pref?: string) {
  if (pref && /^\d{6}$/.test(pref)) return pref;
  return String(Math.floor(100000 + Math.random()*900000));
}
function slugifyTeam(team?: string) {
  if (!team) return "";
  return team.trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9\-]/g,"").slice(0,40);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = randomUUID();
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
    createdAt: Date.now()
  };
  await kv.set(`sess:${id}`, session);
  await kv.set(`code:${code}`, id);
  const slugKey = teamSlug ? `${teamSlug}-${code}` : code;
  await kv.set(`slug:${slugKey}`, id);

  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://estimation-lab.vercel.app";
  const sharePath = `/s/${slugKey}`;
  const joinUrl = `${base}${sharePath}`;
  const facilitatorToken = randomUUID();
  await kv.set(`fac:${id}`, facilitatorToken, { ex: 60*60*24*7 });

  return NextResponse.json({ id, code, teamName: session.teamName, joinUrl, facilitatorToken });
}


