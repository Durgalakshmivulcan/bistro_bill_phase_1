import {
  Utensils,
  ShoppingBag,
  Briefcase,
  CreditCard,
} from "lucide-react";

type OrderType =
  | "dinein"
  | "takeaway"
  | "catering"
  | "subscription";

interface OrderTypeTabsProps {
  value: OrderType;
  onChange: (type: OrderType) => void;
}

const tabs = [
  { key: "dinein", label: "Dine In", icon: Utensils },
  { key: "takeaway", label: "Take Away", icon: ShoppingBag },
  { key: "catering", label: "Catering", icon: Briefcase },
  { key: "subscription", label: "Subscription", icon: CreditCard },
];

const OrderTypeTabs: React.FC<OrderTypeTabsProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const active = value === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key as OrderType)}
            className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium ${
              active
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default OrderTypeTabs;
