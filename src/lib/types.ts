export type FibCard = 0|1|2|3|5|8|13|21|34|55|"?"|"X";

export type Participant = {
  id: string;
  name: string;
  voted: boolean;
  vote?: FibCard;
};

export type Round = {
  status: "idle"|"voting"|"revealed";
  itemTitle?: string;
  itemDescription?: string;
  acceptanceCriteria?: string;
  results?: {
    allVoted: boolean;
    withinWindow: boolean;
    average?: number;
    rounded?: number; // mapped deck value for refinement poker
    unanimous?: boolean;
  };
};

export type Session = {
  id: string;
  code: string;           // six digit
  teamName?: string;      // optional
  title: string;
  method: "refinement_poker"|"business_value";
  participants: Participant[];
  round: Round;
  createdAt: number;
  facilitatorId?: string;
  facilitatorToken?: string;
  finalizedItems?: Array<{
    title: string;
    description?: string;
    acceptanceCriteria?: string;
    value: string;            // finalized deck value
    average: number;          // numeric average before rounding
    decidedAt: number;
  }>;
};

export type SessionState = Session;


