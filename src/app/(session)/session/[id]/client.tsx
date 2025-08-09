"use client";
import { useEffect } from 'react';
import { connect } from './realtime';
import type { RealtimeEvent } from '@/server/realtime/events';

export function RealtimeClient({ sessionId }: { sessionId: string }) {
  useEffect(() => {
    const ws = connect(sessionId);
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


