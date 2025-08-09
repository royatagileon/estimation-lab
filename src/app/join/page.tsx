"use client";
import { useState } from 'react';

export default function JoinPage() {
  const [code, setCode] = useState("");
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Join a session</h1>
      <form action={`/join/${code}`}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
          placeholder="Enter 6-digit code"
          className="w-full border px-3 py-2 rounded"
          aria-label="Join code"
        />
        <button className="mt-3 inline-flex rounded bg-black text-white px-4 py-2" disabled={code.length !== 6}>
          Continue
        </button>
      </form>
    </div>
  );
}


