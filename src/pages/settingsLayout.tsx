// src/pages/Settings/SettingsPage.tsx
import { NavLink, Outlet } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";

export default function SettingsPage() {
    const baseTab = "pb-2 text-sm";
  const inactive = "text-bb-textSoft";
  const active =
    "px-3 py-1.5 bg-black text-white rounded-t-md font-medium";
  return (
    <DashboardLayout>
      <div className="bg-bb-bg min-h-screen p-6 space-y-6">
      
        <div className="flex gap-6 border-b text-sm items-end">
      <NavLink
        to="/settings"
        end
        className={({ isActive }) =>
          isActive ? active : `${baseTab} ${inactive}`
        }
      >
        Basic Settings
      </NavLink>

      <NavLink
        to="/settings/password"
        className={({ isActive }) =>
          isActive ? active : `${baseTab} ${inactive}`
        }
      >
        Manage Password
      </NavLink>
       
    </div>

        {/* TAB CONTENT */}
        <Outlet />
      </div>
    </DashboardLayout>
  );
}
