export function connect(sessionId: string) {
  const url = `/api/realtime?sessionId=${encodeURIComponent(sessionId)}`;
  const ws = new WebSocket(url);
  return ws;
}


