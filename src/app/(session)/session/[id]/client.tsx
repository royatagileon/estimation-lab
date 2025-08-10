"use client";
import { useEffect } from 'react';
import { connect } from './realtime';
import type { RealtimeEvent } from '@/server/realtime/events';

export function RealtimeClient({ sessionId }: { sessionId: string }) {
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = connect(sessionId);
    } catch (e) {
      console.warn('ws init failed', e);
      return;
    }
    ws.onopen = () => console.log('ws open');
    ws.onerror = (e) => console.warn('ws error', e);
    ws.onclose = () => console.log('ws closed');
    ws.onmessage = (ev) => {
      try {
        const e = JSON.parse(ev.data) as RealtimeEvent;
        console.log('rt', e);
      } catch {}
    };
    return () => {
      try { ws?.close(); } catch {}
      ws = null;
    };
  }, [sessionId]);
  return null;
}


