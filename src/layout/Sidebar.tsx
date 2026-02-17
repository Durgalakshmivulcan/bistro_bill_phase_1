import React from "react";
import {
  LayoutDashboard,
  Utensils,
  ListChecks,
  Calendar,
  Boxes,
  Settings,
  Users,
  ShoppingCart,
  BarChart,
} from "lucide-react";
import { usePermissions } from "../hooks/usePermissions";
import { PermissionModule } from "../utils/permissions";

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  active?: boolean;
  /** Permission module required to view this item. If undefined, always visible. */
  module?: PermissionModule;
}

const menu: MenuItem[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Point of sale", icon: Utensils, module: "pos" },
  { label: "All Orders", icon: ListChecks, module: "orders" },
  { label: "Reservations", icon: Calendar, module: "reservations" },
  { label: "Catalog", icon: Boxes, active: true, module: "catalog" },
  { label: "Inventory", icon: ShoppingCart, module: "inventory" },
  { label: "Purchase Order", icon: ShoppingCart, module: "purchase_orders" },
  { label: "Customers", icon: Users, module: "customers" },
  { label: "Marketing", icon: Settings, module: "marketing" },
  { label: "Analytics & Report", icon: BarChart, module: "analytics" },
  { label: "Manage Resources", icon: Settings, module: "staff" },
  { label: "Business Settings", icon: Settings, module: "settings" },
];

const Sidebar: React.FC = () => {
  const { checkModule, isAdmin } = usePermissions();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen p-5 flex flex-col">
      <div className="mb-8">
        <img src="/logo.png" alt="logo" className="h-14 mx-auto" />
      </div>

      <nav className="space-y-1">
        {menu.map((item) => {
          // Hide menu items the user doesn't have read permission for
          if (item.module && !isAdmin && !checkModule(item.module, 'view')) {
            return null;
          }

          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg text-sm
                ${item.active ? "bg-yellow-500 text-white font-semibold" : "text-gray-700 hover:bg-gray-100"}`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
