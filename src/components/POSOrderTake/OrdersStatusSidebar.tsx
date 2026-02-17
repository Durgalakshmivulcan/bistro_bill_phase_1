import {
  Timer,
  CheckCheck,
  Ban,
  Coins,
  FastForward,
  Hand,
} from "lucide-react";

type MenuItem = {
  label: string;
  icon: React.ElementType;
};

const MENU: MenuItem[] = [
  { label: "Open Orders", icon: Timer },
  { label: "Closed Orders", icon: CheckCheck },
  { label: "Cancelled Orders", icon: Ban },
  { label: "Amount Due", icon: Coins },
  { label: "Advance Orders", icon: FastForward },
  { label: "Hold Orders", icon: Hand },
];

type OrdersStatusSidebarProps = {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
};

const OrdersStatusSidebar: React.FC<OrdersStatusSidebarProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  return (
    <div className="w-full md:w-[210px] p-3 space-y-3">

      {MENU.map(({ label, icon: Icon }) => {
        const isActive = activeFilter === label;

        return (
          <button
            key={label}
            onClick={() => onFilterChange(label)}
            className={`
              w-full
              flex flex-col
              items-center
              justify-center
              gap-2
              px-4
              py-4
              rounded-xl
              text-sm
              font-medium
              whitespace-nowrap
              transition
              ${
                isActive
                  ? "bg-black text-white"
                  : "bg-[#FFF7E6] border border-[#F3D9A3] text-gray-800 hover:bg-yellow-50"
              }
            `}
          >
            <Icon size={22} strokeWidth={1.75} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default OrdersStatusSidebar;
