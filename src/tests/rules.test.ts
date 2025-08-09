import { describe, it, expect } from 'vitest';
import { FIBONACCI_DECK } from '@/lib/deck';
import { findOutliersBySteps, canFinalize, validateVote } from '@/lib/rules';

describe('rules', () => {
  it('finds outliers two steps from median', () => {
    const deck = FIBONACCI_DECK;
    const votes = ['1', '2', '3', '13', '21'];
    const { low, high } = findOutliersBySteps(deck, votes, 2);
    expect(low.has('1')).toBe(true);
    expect(high.has('21')).toBe(true);
  });

  it('requires reasons for outliers to finalize', () => {
    const deck = FIBONACCI_DECK;
    const participantIdToVote = { a: '1', b: '3', c: '21' } as const;
    const res1 = canFinalize({ deck, participantIdToVote, participantIdToReasons: {} });
    expect(res1.ok).toBe(false);
    const res2 = canFinalize({
      deck,
      participantIdToVote,
      participantIdToReasons: { a: { LOW: 'too small' }, c: { HIGH: 'too big' } },
    });
    expect(res2.ok).toBe(true);
  });

  it('validates deck votes', () => {
    const deck = FIBONACCI_DECK;
    expect(validateVote(deck, '8')).toBe(true);
    expect(validateVote(deck, '999')).toBe(false);
    expect(validateVote(deck, 'ABSTAIN')).toBe(true);
  });
});


