"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const r = useRouter();
  const [code,setCode] = useState("");
  const [name,setName] = useState("");
  const [step,setStep] = useState<"code"|"name">("code");
  const [err,setErr] = useState("");

  async function findSession() {
    setErr("");
    const res = await fetch("/api/session/by-code/"+code);
    if (!res.ok) { setErr("Cannot find a session for that code"); return; }
    const data = await res.json();
    if (!data?.id) { setErr("Cannot find a session for that code"); return; }
    setStep("name");
  }

  async function join() {
    setErr("");
    const res = await fetch("/api/session/join", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ code, name })
    });
    if (!res.ok) { setErr("Could not join the session"); return; }
    const data = await res.json();
    localStorage.setItem("pid:"+data.sessionId, data.participantId);
    r.push("/session/"+data.sessionId);
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Join a Session</h1>

      {step==="code" && (
        <>
          <label className="block text-sm font-medium mb-1">Six digit code</label>
          <input className="w-full rounded border px-3 py-2" value={code} onChange={e=>setCode(e.target.value)} />
          {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          <button onClick={findSession} className="mt-4 w-full rounded bg-black text-white py-2">Continue</button>
        </>
      )}

      {step==="name" && (
        <>
          <label className="block text-sm font-medium mb-1">Display name</label>
          <input className="w-full rounded border px-3 py-2" value={name} onChange={e=>setName(e.target.value)} />
          {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
          <button onClick={join} className="mt-4 w-full rounded bg-black text-white py-2">Join</button>
        </>
      )}
    </main>
  );
}


