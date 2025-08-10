"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

function six() { return Math.floor(100000 + Math.random() * 900000).toString(); }

export default function NewSessionPage() {
  const r = useRouter();
  const [title,setTitle] = useState("");
  const [method,setMethod] = useState<"refinement_poker"|"business_value">("refinement_poker");
  const [teamName,setTeamName] = useState("");
  const [joinCode,setJoinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const codeValid = joinCode === "" || /^\d{6}$/.test(joinCode);
  const titleValid = title.trim().length >= 3;
  const disabled = !titleValid || !codeValid || submitting;

  useEffect(() => { if (joinCode && joinCode.length > 6) setJoinCode(joinCode.slice(0,6)); }, [joinCode]);

  async function create() {
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ title, method, teamName, joinCode: joinCode || six() })
      });
      if (!res.ok) { setError("Could not create session"); return; }
      const data = await res.json();
      if (data.facilitatorToken) { localStorage.setItem("facilitatorToken:"+data.id, data.facilitatorToken); }
      r.push(`/session/${data.id}`);
    } finally { setSubmitting(false); }
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <div className="surface p-6">
        <h1 className="text-xl font-semibold tracking-tight">New Session</h1>
        <p className="muted text-sm mt-1">Set up a session. Team can join with a link or code.</p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Session title</label>
            <input aria-invalid={!titleValid} aria-describedby="title-help" className="w-full rounded-xl border px-3 py-2 focus-ring" placeholder="Sprint planning" value={title} onChange={e=>setTitle(e.target.value)} />
            <p id="title-help" className="text-xs muted mt-1">At least 3 characters.</p>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium mb-1">Estimation method</legend>
            <label className={`flex gap-3 rounded-xl border p-3 cursor-pointer ${method==="refinement_poker"?"ring-2 ring-accent":""}`}>
              <input type="radio" name="method" checked={method==="refinement_poker"} onChange={()=>setMethod("refinement_poker")} />
              <div>
                <div className="font-medium">Refinement Poker</div>
                <div className="text-xs muted">Relative estimation with cards</div>
              </div>
            </label>
            <label className={`flex gap-3 rounded-xl border p-3 cursor-pointer ${method==="business_value"?"ring-2 ring-accent":""}`}>
              <input type="radio" name="method" checked={method==="business_value"} onChange={()=>setMethod("business_value")} />
              <div>
                <div className="font-medium">Business Value</div>
                <div className="text-xs muted">Affinity value bands</div>
              </div>
            </label>
          </fieldset>

          <div>
            <label className="block text-sm font-medium mb-1">Team</label>
            <input className="w-full rounded-xl border px-3 py-2 focus-ring" placeholder="optional" value={teamName} onChange={e=>setTeamName(e.target.value)} />
            <p className="text-xs muted mt-1">Team may appear in the share link.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Join code</label>
            <input inputMode="numeric" pattern="\d{6}" className={`w-full rounded-xl border px-3 py-2 focus-ring ${codeValid?"":"ring-2 ring-red-500"}`} placeholder="optional six digits" value={joinCode} onChange={e=>setJoinCode(e.target.value.replace(/[^0-9]/g, ''))} aria-invalid={!codeValid} aria-describedby="code-help" />
            <p id="code-help" className={`text-xs mt-1 ${codeValid?"muted":"text-red-600"}`}>{codeValid?"If empty, a code is generated.":"Six digits required."}</p>
          </div>

          {error && <div role="alert" className="text-sm text-red-600">{error}</div>}

          <motion.button whileTap={{ scale: 0.98 }} disabled={disabled} onClick={create} className="w-full rounded-xl bg-accent text-white py-2 font-medium disabled:opacity-60">
            {submitting?"Creating…":"Create Session"}
          </motion.button>
        </div>
      </div>
    </main>
  );
}


