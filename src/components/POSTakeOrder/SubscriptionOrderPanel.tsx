import { useState, useEffect } from "react";
import AccordionItem from "./AccordionItem";
import CustomerDetails from "./AccordionDetails.tsx/CustomerDetails";
import AddItems from "./AccordionDetails.tsx/AddItems";
import PaymentSummary from "./AccordionDetails.tsx/PaymentSummary";
import { getSubscriptionPlans, SubscriptionPlan } from "../../services/settingsService";
import { useOrder } from "../../contexts/OrderContext";

const SubscriptionOrderPanel = () => {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { subscriptionPlanId, setSubscriptionPlanId } = useOrder();

  const toggle = (key: string) => {
    setOpenAccordion(prev => (prev === key ? null : key));
  };

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSubscriptionPlans({ status: "active" });
      if (response.success && response.data) {
        setPlans(response.data.plans);
      } else {
        setError(response.error?.message || "Unable to load billing details.");
      }
    } catch (err) {
      setError("Unable to load billing details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <>
      <AccordionItem
        title="Billing Details"
        isOpen={openAccordion === "plan"}
        onToggle={() => toggle("plan")}
      >
        <div className="space-y-4">
          {loading ? (
            <div className="text-bb-textSoft text-sm">Loading plans...</div>
          ) : error ? (
            <div className="flex items-center justify-between text-sm text-bb-danger bg-bb-bgSoft border border-bb-danger/40 rounded-lg px-3 py-2">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchPlans}
                className="text-xs font-semibold px-2 py-1 border border-bb-danger rounded-md hover:bg-bb-danger hover:text-white transition"
              >
                Retry
              </button>
            </div>
          ) : (
            <select
              className="w-full h-10 border rounded-lg px-3"
              value={subscriptionPlanId}
              onChange={(e) => setSubscriptionPlanId(e.target.value)}
            >
              <option value="">Select Plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ₹{plan.price.toFixed(2)}
                </option>
              ))}
            </select>
          )}
        </div>
      </AccordionItem>

      <AccordionItem
        title="Customer Details"
        isOpen={openAccordion === "customer"}
        onToggle={() => toggle("customer")}
      >
        <CustomerDetails />
      </AccordionItem>

      <AccordionItem
        title="Add Items"
        isOpen={openAccordion === "items"}
        onToggle={() => toggle("items")}
      >
        <AddItems />
      </AccordionItem>

      <AccordionItem
        title="Payment Summary"
        isOpen={openAccordion === "payment"}
        onToggle={() => toggle("payment")}
      >
        <PaymentSummary />
      </AccordionItem>
    </>
  );
};

export default SubscriptionOrderPanel;
