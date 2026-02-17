export type ActivityType =
  | "CREATED"
  | "KOT"
  | "MODIFIED"
  | "PARTIAL_PAYMENT"
  | "FULL_PAYMENT"
  | "RETURN"
  | "CANCELLED";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  time: string;
  completed: boolean;
};
