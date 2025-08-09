import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Estimation Lab</h1>
      <p className="text-gray-600">Collaborative, consent-based estimation with real-time sessions.</p>
      <div className="flex gap-3">
        <Link href="/session/new" className="inline-flex rounded bg-black text-white px-4 py-2">New Session</Link>
        <Link href="/join" className="inline-flex rounded border px-4 py-2">Join</Link>
      </div>
      <div>
        <h2 className="font-semibold mb-2">Recent sessions</h2>
        <p className="text-sm text-gray-500">Coming soon…</p>
      </div>
    </div>
  );
}
