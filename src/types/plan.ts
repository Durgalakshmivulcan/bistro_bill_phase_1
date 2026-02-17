export type PlanStatus = "active" | "inactive";

export interface Plan {
  id: string;
  name: string;
  duration: string;
  price: string;
  trialDays: number | string;
  status: PlanStatus;
}
