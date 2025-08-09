import { RealtimeClient } from './client';

export default function SessionBoardPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return (
    <div className="grid grid-cols-12 gap-4">
      <RealtimeClient sessionId={id} />
      <aside className="col-span-3 border rounded p-3">
        <h2 className="font-semibold mb-2">Participants</h2>
        <p className="text-sm text-gray-500">Avatars and presence…</p>
      </aside>
      <main className="col-span-6 border rounded p-3">
        <h2 className="font-semibold mb-2">Work Item</h2>
        <div className="h-48 border rounded mb-3"></div>
        <div className="flex gap-2">
          {['1','2','3','5','8','13','21'].map((v) => (
            <button key={v} className="flex-1 border rounded py-6 text-lg" aria-label={`vote ${v}`}>{v}</button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button className="border rounded px-3 py-2">Reveal</button>
          <button className="border rounded px-3 py-2">Revote</button>
          <button className="border rounded px-3 py-2">Finalize</button>
        </div>
      </main>
      <aside className="col-span-3 border rounded p-3">
        <h2 className="font-semibold mb-2">Similar Items</h2>
        <p className="text-sm text-gray-500">Model suggestion and neighbors…</p>
      </aside>
    </div>
  );
}


