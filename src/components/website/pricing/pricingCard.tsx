import { Check } from "lucide-react";
import { PricingPlan, PRICING_FEATURES } from "../../../data/pricingData";

type Props = {
  plan: PricingPlan;
  onMore: () => void;
};

export default function PricingCard({ plan, onMore }: Props) {
  const previewFeatures = PRICING_FEATURES[plan.id].slice(0, 8);

  return (
    <div
      className={`rounded-xl p-6 flex flex-col ${
        plan.highlight
          ? "bg-[#FDC836] text-white scale-105 shadow-xl"
          : "bg-white shadow-sm"
      }`}
    >
      <h3 className="font-semibold text-lg">{plan.title}</h3>
      <p className="text-sm opacity-80 mt-1">{plan.subtitle}</p>

      <div className="mt-4">
        <span className="text-4xl font-bold">${plan.price}</span>
        <span className="text-sm"> / Month</span>
      </div>

      <button
        className={`mt-4 py-2 rounded-md text-sm font-medium ${
          plan.highlight
            ? "bg-white text-[#FDC836]"
            : "border border-[#FDC836] text-[#FDC836]"
        }`}
      >
        {plan.cta}
      </button>

      <ul className="mt-6 space-y-3 text-sm">
        {previewFeatures.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <Check size={16} className={plan.highlight ? "text-white" : "text-bb-primary"} />
            {feature}
          </li>
        ))}
      </ul>

      <span
        onClick={onMore}
        className={plan.highlight ? "text-white mt-auto cursor-pointer text-right opacity-90" : "text-bb-primary mt-auto cursor-pointer text-right opacity-90"}
      >
        More..
      </span>
    </div>
  );
}
