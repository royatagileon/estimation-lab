"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeSwitcher } from '@/app/components/ThemeSwitcher';
import { Share2, Copy } from 'lucide-react';

export function GlobalHeader() {
  const pathname = usePathname();
  const isSession = pathname?.startsWith('/session/');
  const canShare = typeof window !== 'undefined' && !!navigator.share;
  const url = typeof window !== 'undefined' ? window.location.href : '';
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/80 border-b">
      <div className="mx-auto max-w-7xl px-4 h-12 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">Estimation Lab</Link>
        <div className="flex items-center gap-2">
          {isSession && (
            <>
              <button className="rounded-full border px-3 py-1.5 text-sm inline-flex items-center gap-2" onClick={async()=>{ try { await navigator.clipboard?.writeText(url); } catch{} }}><Copy className="h-4 w-4"/> Copy link</button>
              {canShare && <button className="rounded-full border px-3 py-1.5 text-sm inline-flex items-center gap-2" onClick={()=>navigator.share?.({ url })}><Share2 className="h-4 w-4"/> Share</button>}
            </>
          )}
          <ThemeSwitcher showLabel={false} />
        </div>
      </div>
    </header>
  );
}


