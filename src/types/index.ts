export interface Profile {
  id: string;
  email: string;
  name: string | null;
  credits: number;
  created_at: string;
  updated_at: string;
  registered: boolean;
}

export interface EventItem {
  id: string;
  title: string;
  description?: string | null;
  event_date: string; // ISO string
  capacity: number;
  attendees_count: number;
  created_by?: string | null;
  type: "training" | "game";
}

export type TransactionType =
  | "credit_grant"
  | "credit_revoke"
  | "join_event"
  | "refund_event";
