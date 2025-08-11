"use client";
import { ThemeSwitcher } from '@/app/components/ThemeSwitcher';
import { Copy, CircleUserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

export function SessionTopbar({ sessionId }: { sessionId: string }) {
  const [link, setLink] = useState('');
  useEffect(() => { setLink(window.location.href); }, []);
  async function copy() {
    await navigator.clipboard?.writeText(link);
    toast.success('Link copied');
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-full bg-slate-700/50 grid place-items-center text-slate-200"><CircleUserRound className="h-4 w-4" /></div>
          <div>
            <div className="text-sm font-medium">Estimation Lab</div>
            <div className="text-xs text-slate-500">Session {sessionId.slice(0, 6)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher showLabel />
          <button aria-label="Copy link" className="rounded-full border px-3 py-1.5 text-sm hover:bg-muted inline-flex items-center gap-2" onClick={copy}>
            <Copy className="h-4 w-4" /> Copy link
          </button>
        </div>
      </div>
      <div className="rounded-xl border px-4 py-2 text-sm text-slate-700 dark:text-slate-400 overflow-x-auto">
        Share link: <span className="font-mono text-slate-800 dark:text-slate-100" suppressHydrationWarning>{link}</span>
      </div>
    </div>
  );
}


