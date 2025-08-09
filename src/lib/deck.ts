export type DeckType = 'FIBONACCI' | 'CUSTOM';

export const FIBONACCI_DECK = ['1', '2', '3', '5', '8', '13', '21'];

export function getDeckValues(deckType: DeckType, custom?: string[]): string[] {
  if (deckType === 'CUSTOM') return custom && custom.length ? custom : FIBONACCI_DECK;
  return FIBONACCI_DECK;
}

export function nearestDeckValue(deck: string[], numericValue: number): string {
  let best = deck[0];
  let bestDiff = Infinity;
  for (const v of deck) {
    const n = Number(v);
    const diff = Math.abs(numericValue - n);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = v;
    }
  }
  return best;
}


