"use client";
import { useEffect } from 'react';
import { connect } from './realtime';
import type { RealtimeEvent } from '@/server/realtime/events';

export function RealtimeClient({ sessionId }: { sessionId: string }) {
  useEffect(() => {
    const ws = connect(sessionId);
    ws.onopen = () => console.log('ws open');
    ws.onerror = (e) => console.warn('ws error', e);
    ws.onclose = () => console.log('ws closed');
    ws.onmessage = (ev) => {
      try {
        const e = JSON.parse(ev.data) as RealtimeEvent;
        console.log('rt', e);
      } catch {}
    };
    return () => ws.close();
  }, [sessionId]);
  return null;
}


