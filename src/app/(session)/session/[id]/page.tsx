import NextDynamic from 'next/dynamic';
const ClientSessionView = NextDynamic(() => import('./view').then(m => m.SessionView), { ssr: false } as any);

export default async function SessionBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // header layout + share link strip per spec
  return (
    <div className="space-y-4">
      <ClientSessionView id={id} />
    </div>
  );
}

export const dynamic = 'force-dynamic';


