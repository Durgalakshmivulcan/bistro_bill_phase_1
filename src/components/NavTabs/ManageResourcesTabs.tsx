import { NavLink } from "react-router-dom";

const ManageResourcesTabs = () => {
  return (
    <div className="flex gap-6 border-b border-gray-200 pb-2 overflow-x-visible">

      {/* Manage Staff */}
      <NavLink
        to="/manage-resources/staff"
        end
        className={({ isActive }) =>
          `pb-2 text-sm font-medium transition ${
            isActive
              ? "text-black border-b-2 border-black"
              : "text-gray-500 hover:text-black"
          }`
        }
      >
        Manage Staff
      </NavLink>

      {/* Branches */}
      <NavLink
        to="/manage-resources/branches"
        className={({ isActive }) =>
          `pb-2 text-sm font-medium transition ${
            isActive
              ? "text-black border-b-2 border-black"
              : "text-gray-500 hover:text-black"
          }`
        }
      >
        Branchs
      </NavLink>

    </div>
  );
};

export default ManageResourcesTabs;
