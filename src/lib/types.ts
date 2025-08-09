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
};

export type SessionState = Session;


