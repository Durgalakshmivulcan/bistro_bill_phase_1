import { useState, useEffect } from "react";
import AccordionItem from "./AccordionItem";
import CustomerDetails from "./AccordionDetails.tsx/CustomerDetails";
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

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getSubscriptionPlans({ status: "active" });
        if (response.success && response.data) {
          setPlans(response.data.plans);
        } else {
          setError(response.error?.message || "Failed to load subscription plans");
        }
      } catch (err) {
        setError("An error occurred while loading subscription plans");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return (
    <>
      <AccordionItem
        title="Subscription Plan"
        isOpen={openAccordion === "plan"}
        onToggle={() => toggle("plan")}
      >
        <div className="space-y-4">
          {loading ? (
            <div className="text-bb-textSoft text-sm">Loading plans...</div>
          ) : error ? (
            <div className="text-bb-danger text-sm">{error}</div>
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
