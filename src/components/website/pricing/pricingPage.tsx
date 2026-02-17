import { useState } from "react";
import PublicHeader from "../../publicHeader";
import Footer from "../../footer";

import PricingCard from "../../website/pricing/pricingCard";
import PricingFeaturesModal from "../../website/pricing/pricingModal";

import { PRICING_FEATURES, PRICING_PLANS } from "../../../data/pricingData";

type PlanKey = "starter" | "professional" | "enterprise";

export default function PricingPage() {
  const [modalType, setModalType] = useState<PlanKey | null>(null);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const STATS = [
    { value: "500+", label: "Happy Restaurants", sub: "across 50+ countries" },
    { value: "99.9%", label: "Uptime Guarantee", sub: "24/7 availability" },
    { value: "35%", label: "Average Efficiency Gain", sub: "reduced order times" },
    { value: "48hrs", label: "Quick Setup", sub: "from signup to live" },
  ];

  return (
    <>
      <PublicHeader />

      <div className="bg-bb-bg min-h-screen pt-20 px-6">

        {/* ================= HEADER ================= */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold">
            Simple, Transparent Pricing
          </h1>

          <p className="text-sm text-gray-600 mt-2">
            Choose the perfect plan for your restaurant. No hidden fees.
          </p>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-[#FDC836]">{s.value}</p>
                <p className="font-bold">{s.label}</p>
                <p className="text-xs text-gray-400">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ================= BILLING TOGGLE ================= */}
        <div className="flex justify-center mt-10 gap-4">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-8 py-3 rounded-xl font-medium ${
              billing === "monthly"
                ? "bg-[#FDC836] text-black"
                : "bg-white border-2 border-black"
            }`}
          >
            Monthly
          </button>

          <button
            onClick={() => setBilling("annual")}
            className={`px-8 py-3 rounded-xl font-medium ${
              billing === "annual"
                ? "bg-[#FDC836] text-black"
                : "bg-white border-2 border-black"
            }`}
          >
            Annual (Save 20%)
          </button>
        </div>

        {/* ================= PRICING GRID ================= */}
        <div className="max-w-6xl mx-auto mt-12 grid md:grid-cols-3 gap-6">
          {PRICING_PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              onMore={() => setModalType(plan.id)}
            />
          ))}
        </div>

        {/* ================= FEATURES MODAL ================= */}
        <PricingFeaturesModal
          open={modalType !== null}
          title={
            modalType === "starter"
              ? "Starter"
              : modalType === "professional"
              ? "Professional"
              : "Enterprise"
          }
          features={modalType ? PRICING_FEATURES[modalType] : []}
          actionLabel={
            modalType === "professional"
              ? "Start Free Trial"
              : "Get Started"
          }
          onClose={() => setModalType(null)}
        />
      </div>

      <Footer />
    </>
  );
}
