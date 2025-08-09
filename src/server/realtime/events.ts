// Realtime event names and payloads
// session joined: { sessionId, participantId, displayName }
// session left: { sessionId, participantId }
// round started: { sessionId, workItemId, roundId, roundNumber }
// vote cast: { sessionId, roundId, participantId }
// votes revealed: { sessionId, roundId }
// reason added: { sessionId, roundId, participantId, polarity }
// objection raised: { sessionId, roundId, participantId }
// revote called: { sessionId, workItemId, nextRoundId, roundNumber }
// decision finalized: { sessionId, workItemId, value }

export type RealtimeEvent =
  | { type: 'session_joined'; sessionId: string; participantId: string; displayName: string }
  | { type: 'session_left'; sessionId: string; participantId: string }
  | { type: 'round_started'; sessionId: string; workItemId: string; roundId: string; roundNumber: number }
  | { type: 'vote_cast'; sessionId: string; roundId: string; participantId: string }
  | { type: 'votes_revealed'; sessionId: string; roundId: string }
  | { type: 'reason_added'; sessionId: string; roundId: string; participantId: string; polarity: 'HIGH' | 'LOW' }
  | { type: 'objection_raised'; sessionId: string; roundId: string; participantId: string }
  | { type: 'revote_called'; sessionId: string; workItemId: string; nextRoundId: string; roundNumber: number }
  | { type: 'decision_finalized'; sessionId: string; workItemId: string; value: string };


