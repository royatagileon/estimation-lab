"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewSessionPage() {
  const r = useRouter();
  const [title,setTitle] = useState("");
  const [method,setMethod] = useState<"refinement_poker"|"business_value">("refinement_poker");
  const [teamName,setTeamName] = useState("");
  const [joinCode,setJoinCode] = useState("");

  const disabled = title.trim().length < 3 || (!!joinCode && !/^\d{6}$/.test(joinCode));

  async function create() {
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ title, method, teamName, joinCode })
    });
    if (!res.ok) { alert("Could not create session"); return; }
    const data = await res.json();
    if (data.facilitatorToken) {
      localStorage.setItem("facilitatorToken:"+data.id, data.facilitatorToken);
    }
    r.push(data.joinUrl);
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Create a New Session</h1>
      <p className="text-sm text-neutral-500 mb-6">Set up a session and share the link or code.</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Session Title</label>
          <input className="w-full rounded border px-3 py-2" value={title} onChange={e=>setTitle(e.target.value)} />
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium mb-1">Choose a method</legend>
          <label className={`flex gap-3 rounded border p-3 cursor-pointer ${method==="refinement_poker"?"ring-2":""}`}>
            <input type="radio" checked={method==="refinement_poker"} onChange={()=>setMethod("refinement_poker")} />
            <div>
              <div className="font-medium">Refinement Poker</div>
              <div className="text-sm text-neutral-500">Relative estimation with cards</div>
            </div>
          </label>
          <label className={`flex gap-3 rounded border p-3 cursor-pointer ${method==="business_value"?"ring-2":""}`}>
            <input type="radio" checked={method==="business_value"} onChange={()=>setMethod("business_value")} />
            <div>
              <div className="font-medium">Business Value Sizing</div>
              <div className="text-sm text-neutral-500">Affinity value bands</div>
            </div>
          </label>
        </fieldset>

        <div>
          <label className="block text-sm font-medium mb-1">Team Name</label>
          <input className="w-full rounded border px-3 py-2" placeholder="optional" value={teamName} onChange={e=>setTeamName(e.target.value)} />
          <p className="text-xs text-neutral-500 mt-1">Optional. Used in the share link with your six digit code.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Join Code</label>
          <input className="w-full rounded border px-3 py-2" placeholder="optional six digits" value={joinCode} onChange={e=>setJoinCode(e.target.value)} />
          <p className="text-xs text-neutral-500 mt-1">If not provided, one is generated.</p>
        </div>

        <button disabled={disabled} onClick={create} className="w-full rounded bg-black text-white py-2 disabled:opacity-60">Create Session</button>
      </div>
    </main>
  );
}


