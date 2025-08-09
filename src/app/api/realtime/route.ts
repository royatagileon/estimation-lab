export const runtime = 'edge';

import { NextRequest } from 'next/server';
import { RealtimeEvent } from '@/server/realtime/events';

const sessions = new Map<string, Set<WebSocket>>();

function broadcast(sessionId: string, data: RealtimeEvent) {
  const peers = sessions.get(sessionId);
  if (!peers) return;
  const payload = JSON.stringify(data);
  for (const ws of peers) {
    try {
      ws.send(payload);
    } catch {}
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return new Response('missing sessionId', { status: 400 });

  // @ts-expect-error WebSocketPair is provided in the Edge runtime
  const { 0: client, 1: server } = new WebSocketPair();
  const peerSet = sessions.get(sessionId) ?? new Set<WebSocket>();
  sessions.set(sessionId, peerSet);

  // @ts-expect-error Edge runtime types
  server.accept();
  // @ts-expect-error Edge runtime types
  server.addEventListener('message', (event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data as string) as RealtimeEvent;
      // fan-out restricted to session
      if ('sessionId' in msg && msg.sessionId === sessionId) {
        broadcast(sessionId, msg);
      }
    } catch {}
  });
  // @ts-expect-error Edge runtime types
  server.addEventListener('close', () => {
    // keep map lightweight; clients removed on error/send too
  });

  peerSet.add(server as unknown as WebSocket);

  return new Response(null, { status: 101, webSocket: client });
}


