"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function GlobalHeader() {
  const pathname = usePathname();
  const isSession = pathname?.startsWith('/session/');
  const [mounted, setMounted] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareCapable, setShareCapable] = useState(false);
  useEffect(() => {
    setMounted(true);
    setShareUrl(window.location.href);
    setShareCapable(!!navigator.share);
  }, []);
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/80 border-b">
      <div className="mx-auto max-w-7xl px-4 h-12 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">Estimation Lab</Link>
        <div className="flex items-center gap-2">
          {mounted && isSession && shareCapable && (
            <button className="rounded-full border px-3 py-1.5 text-sm inline-flex items-center gap-2" onClick={()=>navigator.share?.({ url: shareUrl })}><Share2 className="h-4 w-4"/> Share</button>
          )}
          {/* Removed theme switcher per request */}
        </div>
      </div>
    </header>
  );
}


