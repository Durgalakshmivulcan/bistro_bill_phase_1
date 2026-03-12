import { api } from "./api";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  trialDays: number;
  maxBranches: number;
  status: string;
}

export const getSubscriptionPlans = async () => {
  return api.get<{
    success: boolean;
    data: { plans: SubscriptionPlan[] };
  }>("/super-admin/subscription-plans"); // ✅ CORRECT
};