import { RealtimeClient } from './client';
import { SessionView } from './view';

export default async function SessionBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // fetch session info client-side via tRPC provider on the page body
  return (
    <div className="space-y-4">
      <RealtimeClient sessionId={id} />
      <SessionView id={id} />
    </div>
  );
}


