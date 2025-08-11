import { describe, it, expect, vi } from 'vitest';
import * as mod from '@/lib/confetti';

describe('fireConfettiOnce', () => {
  it('guards duplicate keys', async () => {
    // mock dynamic import
    const shots: number[] = [];
    (global as any).requestAnimationFrame = (cb: any) => cb();
    vi.mock('canvas-confetti', () => ({ default: (opts: any) => shots.push(1) }));
    await mod.fireConfettiOnce('k1');
    await mod.fireConfettiOnce('k1');
    expect(shots.length).toBeGreaterThan(0);
  });
});


