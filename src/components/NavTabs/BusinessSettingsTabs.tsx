import { NavLink } from "react-router-dom";

const SettingsTabs = () => {
  return (
    <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-y-auto">
      <NavLink
        to="/business-settings"
        end
        className={({ isActive }) =>
          `pb-3 text-sm font-medium ${
            isActive
              ? "text-black border-b-2 border-black"
              : "text-gray-500 hover:text-black"
          }`
        }
      >
        General Settings
      </NavLink>

      <NavLink
        to="/business-settings/taxes-payments"
        className={({ isActive }) =>
          `pb-3 text-sm font-medium ${
            isActive
              ? "text-black border-b-2 border-black"
              : "text-gray-500 hover:text-black"
          }`
        }
      >
        Taxes & Payments
      </NavLink>

      <NavLink
        to="/business-settings/sales-settings"
        className={({ isActive }) =>
          `pb-3 text-sm font-medium ${
            isActive
              ? "text-black border-b-2 border-black"
              : "text-gray-500 hover:text-black"
          }`
        }
      >
        Sales Settings
      </NavLink>
      <NavLink
        to="/business-settings/charges"
        className={({ isActive }) =>
          `pb-3 text-sm font-medium ${
            isActive
              ? "text-black border-b-2 border-black"
              : "text-gray-500 hover:text-black"
          }`
        }
      >
        Charges
      </NavLink>
      <NavLink
        to="/business-settings/reasons"
        className={({ isActive }) =>
          `pb-3 text-sm font-medium ${
            isActive
              ? "text-black border-b-2 border-black"
              : "text-gray-500 hover:text-black"
          }`
        }
      >
        Reasons
      </NavLink>
      <NavLink
        to="/business-settings/integrations"
        className={({ isActive }) =>
          `pb-3 text-sm font-medium ${
            isActive
              ? "text-black border-b-2 border-black"
              : "text-gray-500 hover:text-black"
          }`
        }
      >
        Integrations
      </NavLink>
      <NavLink
        to="/business-settings/aggregator-integrations"
        className={({ isActive }) =>
          `pb-3 text-sm font-medium whitespace-nowrap ${
            isActive
              ? "text-black border-b-2 border-black"
              : "text-gray-500 hover:text-black"
          }`
        }
      >
        Aggregators
      </NavLink>
      <NavLink
        to="/business-settings/roles"
        className={({ isActive }) =>
          `pb-3 text-sm font-medium ${
            isActive
              ? "text-black border-b-2 border-black"
              : "text-gray-500 hover:text-black"
          }`
        }
      >
        Roles
      </NavLink>
      <span className="pb-3 text-sm text-gray-400">
        Devices
      </span>
      <span className="pb-3 text-sm text-gray-400">
        Templates
      </span>
    </div>
  );
};

export default SettingsTabs;
