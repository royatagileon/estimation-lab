import { SessionView } from './view';

export default async function SessionBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // header layout + share link strip per spec
  return (
    <div className="space-y-4">
      <SessionView id={id} />
    </div>
  );
}

export const dynamic = 'force-dynamic';


