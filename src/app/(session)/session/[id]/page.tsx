import { SessionView } from './view';
import Link from 'next/link';
import { ThemeSwitcher } from '@/app/components/ThemeSwitcher';
import { Copy, CircleUserRound } from 'lucide-react';
import { headers } from 'next/headers';

export default async function SessionBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // header layout + share link strip per spec
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-full bg-slate-700/50 grid place-items-center text-slate-200"><CircleUserRound className="h-4 w-4" /></div>
          <div>
            <div className="text-sm font-medium">Estimation Lab</div>
            <div className="text-xs text-slate-500">Session {id.slice(0, 6)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher showLabel />
          <button aria-label="Copy link" className="rounded-full border px-3 py-1.5 text-sm hover:bg-muted inline-flex items-center gap-2" onClick={async()=>{
            const href = window.location.href;
            await navigator.clipboard?.writeText(href);
          }}>
            <Copy className="h-4 w-4" /> Copy link
          </button>
        </div>
      </div>
      <div className="rounded-xl border px-4 py-2 text-sm text-slate-300">
        Share link: <span className="font-mono text-slate-200">{typeof window === 'undefined' ? '' : window.location.href}</span>
      </div>
      <SessionView id={id} />
    </div>
  );
}


