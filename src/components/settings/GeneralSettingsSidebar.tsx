import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded text-sm ${
    isActive
      ? "bg-yellow-400 text-black font-medium"
      : "text-gray-700 hover:bg-gray-100"
  }`;

const GeneralSettingsSidebar = () => {
  return (
    <div className="space-y-2">
      {/* INDEX route */}
      <NavLink to="." end className={linkClass}>
        Business Profile
      </NavLink>

      <NavLink to="preferences" className={linkClass}>
        Preferences
      </NavLink>

      <NavLink to="subscription" className={linkClass}>
        Subscription Plan
      </NavLink>
    </div>
  );
};

export default GeneralSettingsSidebar;
