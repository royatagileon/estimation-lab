"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function JoinPage() {
  const r = useRouter();
  const [code,setCode] = useState("");
  const [name,setName] = useState("");
  const [step,setStep] = useState<"code"|"name">("code");
  const [err,setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function findSession() {
    setErr("");
    const normalized = code.trim().replace(/\s/g, "");
    if (!/^\d{6}$/.test(normalized)) { setErr("Enter a valid six digit code or link"); return; }
    setLoading(true);
    const res = await fetch("/api/session/by-code/"+normalized);
    if (!res.ok) { setErr("Cannot find a session for that code"); return; }
    const data = await res.json();
    if (!data?.id) { setErr("Cannot find a session for that code"); return; }
    setStep("name");
    setLoading(false);
  }

  async function join() {
    setErr("");
    const dupKey = `joined:${code}`;
    if (sessionStorage.getItem(dupKey)) { setErr("You already joined in this tab."); return; }
    const res = await fetch("/api/session/join", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ code, name })
    });
    if (!res.ok) { setErr("Could not join the session"); return; }
    const data = await res.json();
    localStorage.setItem("pid:"+data.sessionId, data.participantId);
    sessionStorage.setItem(dupKey, "1");
    r.push("/session/"+data.sessionId);
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="surface p-6">
        <h1 className="text-xl font-semibold tracking-tight">Join</h1>

        {step==="code" && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Six digit code or link</label>
            <input className="w-full rounded-xl border px-3 py-2 focus-ring" value={code} onChange={e=>setCode(e.target.value)} />
            {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
            <motion.button whileTap={{ scale: 0.98 }} disabled={loading} onClick={findSession} className="mt-4 w-full rounded-xl bg-accent text-white py-2 disabled:opacity-60">Continue</motion.button>
          </div>
        )}

        {step==="name" && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Display name</label>
            <input className="w-full rounded-xl border px-3 py-2 focus-ring" value={name} onChange={e=>setName(e.target.value)} />
            {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
            <motion.button whileTap={{ scale: 0.98 }} onClick={join} className="mt-4 w-full rounded-xl bg-accent text-white py-2">Join</motion.button>
          </div>
        )}
      </div>
    </main>
  );
}


