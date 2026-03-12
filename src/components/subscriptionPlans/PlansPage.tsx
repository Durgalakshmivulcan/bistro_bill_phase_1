import { useState, useEffect, useCallback } from "react";
import PlansHeader from "./PlansHeader";
import PlansFilter from "./PlansFilter";
import PlansTable from "./PlansTable";
import { getSubscriptionPlans, SubscriptionPlan } from "../../services/settingsService";
import type { Plan, PlanStatus } from "../../types/plan";

function durationLabel(months: number): string {
  if (months >= 9999) return "Lifetime";
  if (months === 12) return "1 Year";
  if (months === 1) return "Monthly";
  return `${months} Months`;
}

function mapToPlan(sp: SubscriptionPlan): Plan {
  const price = Number(sp.price);
  return {
    id: sp.id,
    name: sp.name,
    duration: durationLabel(sp.duration),
    price: price === 0 ? "---" : `₹${price.toLocaleString("en-IN")}`,
    trialDays: sp.trialDays || "---",
    status: sp.status as PlanStatus,
  };
}

const PlansPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter ? { status: statusFilter } : undefined;
      const response = await getSubscriptionPlans(params);
      if (response.success && response.data) {
        setPlans(response.data.plans.map(mapToPlan));
      } else {
        setError(response.message || "Failed to load plans");
      }
    } catch {
      setError("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);
const filteredPlans = plans.filter((plan) => {
  if (!searchTerm) return true;

  const q = searchTerm.toLowerCase();

  return (
    plan.name.toLowerCase().includes(q) ||
    plan.duration.toLowerCase().includes(q) ||
    String(plan.price).toLowerCase().includes(q) ||
    plan.status.toLowerCase().includes(q)
  );
});

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  return (
    <div className="space-y-6">
      <PlansHeader
  searchTerm={searchTerm}
  onSearchChange={setSearchTerm}
/>

      <PlansFilter
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onClear={() => setStatusFilter("")}
      />

      {loading && <div className="text-center py-8 text-bb-textSoft">Loading plans...</div>}
      {error && <div className="text-center py-8 text-red-500">{error}</div>}
      {!loading && !error && <PlansTable plans={filteredPlans} onDeleted={loadPlans} />
}
    </div>
  );
};

export default PlansPage;
