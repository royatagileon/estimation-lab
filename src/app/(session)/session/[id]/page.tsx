import { SessionView } from './view';
import { SessionTopbar } from './Topbar';

export default async function SessionBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // header layout + share link strip per spec
  return (
    <div className="space-y-4">
      <SessionTopbar sessionId={id} />
      <SessionView id={id} />
    </div>
  );
}


