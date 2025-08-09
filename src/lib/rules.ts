import { getDeckValues } from './deck';

export function computeMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

export function findOutliersBySteps(deck: string[], votes: string[], stepsAway = 2): {
  low: Set<string>;
  high: Set<string>;
} {
  const deckIndex = new Map(deck.map((v, i) => [v, i] as const));
  const validVotes = votes.filter((v) => deckIndex.has(v));
  if (validVotes.length === 0) return { low: new Set(), high: new Set() };
  const numeric = validVotes.map((v) => Number(v));
  const median = computeMedian(numeric);
  const medianDeckValue = deck.reduce((prev, curr) => {
    return Math.abs(Number(curr) - median) < Math.abs(Number(prev) - median) ? curr : prev;
  }, deck[0]);
  const medianIdx = deckIndex.get(medianDeckValue)!;
  const low = new Set<string>();
  const high = new Set<string>();
  for (const v of validVotes) {
    const idx = deckIndex.get(v)!;
    if (idx <= medianIdx - stepsAway) low.add(v);
    if (idx >= medianIdx + stepsAway) high.add(v);
  }
  return { low, high };
}

export function canFinalize({
  deck,
  participantIdToVote,
  participantIdToReasons,
}: {
  deck: string[];
  participantIdToVote: Record<string, string | undefined>;
  participantIdToReasons: Record<string, { HIGH?: string; LOW?: string } | undefined>;
}): { ok: boolean; missingReasons: string[] } {
  const votes = Object.values(participantIdToVote).filter(Boolean) as string[];
  const { low, high } = findOutliersBySteps(deck, votes, 2);
  const missingReasons: string[] = [];
  for (const [participantId, vote] of Object.entries(participantIdToVote)) {
    if (!vote) continue;
    if (low.has(vote)) {
      if (!participantIdToReasons[participantId]?.LOW) missingReasons.push(participantId);
    }
    if (high.has(vote)) {
      if (!participantIdToReasons[participantId]?.HIGH) missingReasons.push(participantId);
    }
  }
  return { ok: missingReasons.length === 0, missingReasons };
}

export function validateVote(deck: string[], value: string): boolean {
  return deck.includes(value) || value === 'ABSTAIN';
}

export function summarizeReasons(
  participantIdToReasons: Record<string, { HIGH?: string; LOW?: string } | undefined>,
): string {
  const pieces: string[] = [];
  for (const [pid, r] of Object.entries(participantIdToReasons)) {
    if (!r) continue;
    if (r.HIGH) pieces.push(`${pid}: HIGH ${r.HIGH}`);
    if (r.LOW) pieces.push(`${pid}: LOW ${r.LOW}`);
  }
  return pieces.join(' | ');
}


