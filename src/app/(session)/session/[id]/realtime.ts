export function connect(sessionId: string) {
  const isSecure = typeof window !== 'undefined' ? window.location.protocol === 'https:' : true;
  const host = typeof window !== 'undefined' ? window.location.host : '';
  const url = `${isSecure ? 'wss' : 'ws'}://${host}/api/realtime?sessionId=${encodeURIComponent(sessionId)}`;
  const ws = new WebSocket(url);
  return ws;
}


