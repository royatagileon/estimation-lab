let lastKey: string | null = null;
export async function fireConfettiOnce(key: string) {
  if (typeof window === 'undefined') return; // guard SSR
  if (lastKey === key) return;
  lastKey = key;
  const { default: confetti } = await import('canvas-confetti');
  const duration = 1200;
  const end = Date.now() + duration;
  const frame = () => {
    confetti({ particleCount: 120, spread: 100, startVelocity: 40, scalar: 1, ticks: 200, origin: { x: Math.random(), y: Math.random()*0.2 + 0.1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}


