import { NavLink } from "react-router-dom";

const SuperAdminStaffManagementTab = () => {
  return (
    <div className="flex gap-6 border-b border-gray-200 pb-2 overflow-x-visible">

      {/* Manage Staff */}
      <NavLink
        to="/superadmin-staff-management"
        end
        className={({ isActive }) =>
          `pb-2 text-sm font-medium transition ${
            isActive
              ? "text-black border-b-2 border-black"
              : "text-gray-500 hover:text-black"
          }`
        }
      >
        Staff
      </NavLink>

      {/* Branches */}
      <NavLink
        to="/superadmin-staff-management/roles-and-permissions"
        className={({ isActive }) =>
          `pb-2 text-sm font-medium transition ${
            isActive
              ? "text-black border-b-2 border-black"
              : "text-gray-500 hover:text-black"
          }`
        }
      >
        Roles And Permissions
      </NavLink>

    </div>
  );
};

export default SuperAdminStaffManagementTab;
