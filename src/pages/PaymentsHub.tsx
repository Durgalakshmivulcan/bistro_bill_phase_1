import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";

const PAYMENT_FEATURES = [
  {
    title: "Refund Management",
    description: "Manage refunds for online payments",
    icon: "bi-arrow-return-left",
    link: "/payments/refunds",
  },
  {
    title: "Payment Reconciliation",
    description: "Verify gateway settlements and resolve discrepancies",
    icon: "bi-clipboard-check",
    link: "/payments/reconciliation",
  },
  {
    title: "UPI AutoPay",
    description: "Manage recurring UPI subscriptions",
    icon: "bi-arrow-repeat",
    link: "/subscriptions/autopay",
  },
  {
    title: "Payment Gateway",
    description: "Configure Razorpay, Stripe, and PayU credentials",
    icon: "bi-credit-card",
    link: "/business-settings/payment-gateway",
  },
];

const PaymentsHub = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="p-6 bg-bb-bg min-h-screen">
        <h1 className="text-2xl font-semibold text-bb-text mb-6">Payments</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PAYMENT_FEATURES.map((feature) => (
            <div
              key={feature.title}
              onClick={() => navigate(feature.link)}
              className="bg-white rounded-xl shadow-bb-card p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-bb-primary/10 flex items-center justify-center mb-4">
                <i className={`bi ${feature.icon} text-xl text-bb-primary`} />
              </div>
              <h3 className="text-lg font-semibold text-bb-text mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-bb-textSoft">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentsHub;
