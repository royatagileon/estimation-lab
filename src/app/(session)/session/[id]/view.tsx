"use client";
import useSWR from "swr";
import Link from "next/link";
import type { Session } from "@/lib/types";

const fetcher = (u: string) => fetch(u).then(r => r.json());

function slugifyTeam(team?: string) {
  if (!team) return "";
  return team.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "").slice(0, 40);
}

export function SessionView({ id }: { id: string }) {
  const { data: s, isLoading } = useSWR<Session>(`/api/session/${id}`, fetcher, { refreshInterval: 1000 });
  if (isLoading) return <div>Loading session…</div>;
  if (!s) return <div>Session not found.</div>;

  const isBusiness = s.method === "business_value";
  const fib = [0,1,2,3,5,8,13,21,34,55,"?","X"] as const;
  const tshirt = ["XS","S","M","L","XL"] as const;
  const deck = isBusiness ? tshirt : fib;

  const slugKey = slugifyTeam(s.teamName) ? `${slugifyTeam(s.teamName)}-${s.code}` : s.code;
  const shareLink = `/s/${slugKey}`;

  return (
    <div className="grid grid-cols-12 gap-4">
      <aside className="col-span-3 border rounded p-3">
        <h2 className="font-semibold mb-2">Participants</h2>
        <ul className="text-sm space-y-1">
          {s.participants.map((p: any) => <li key={p.id}>{p.name ?? "Member"}</li>)}
        </ul>
        <div className="text-xs text-gray-500 mt-2">Share: <Link href={shareLink} className="underline">{shareLink}</Link></div>
        <div className="text-xs text-gray-500">Code: {s.code}</div>
      </aside>

      <main className="col-span-6 border rounded p-3">
        <h2 className="font-semibold mb-2">{isBusiness ? "Business Value Sizing" : "Refinement Poker"}</h2>
        <div className="flex gap-2">
          {deck.map(v => (
            <button key={String(v)} className="flex-1 border rounded py-6 text-lg" aria-label={`vote ${v}`}>{String(v)}</button>
          ))}
        </div>

        {isBusiness && (
          <div className="mt-3">
            <label className="block text-sm font-medium">Business Value</label>
            <div className="flex gap-2 text-sm">
              {["Not Sure","Very Low","Low","High","Very High"].map(b => (
                <button key={b} className="border rounded px-3 py-2">{b}</button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button className="border rounded px-3 py-2">Reveal</button>
          <button className="border rounded px-3 py-2">Revote</button>
        </div>
      </main>

      <aside className="col-span-3 border rounded p-3">
        <h2 className="font-semibold mb-2">Similar Items</h2>
        <p className="text-sm text-gray-500">Model suggestion and neighbors…</p>
      </aside>
    </div>
  );
}


