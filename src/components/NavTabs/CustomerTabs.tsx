import { NavLink } from "react-router-dom";

const CustomerTabs = () => {
  const baseTab = "pb-2 text-sm";
  const inactive = "text-bb-textSoft";
  const active =
    "px-3 py-1.5 bg-black text-white rounded-t-md font-medium";

  return (
    <div className="flex gap-6 border-b text-sm items-end">
      <NavLink
        to="/customers/customer"
        className={({ isActive }) =>
          isActive ? active : `${baseTab} ${inactive}`
        }
      >
        Customers
      </NavLink>

      <NavLink
        to="/customers/customerGroup"
        className={({ isActive }) =>
          isActive ? active : `${baseTab} ${inactive}`
        }
      >
        Customers Group
      </NavLink>

      <NavLink
        to="/customers/tags"
        className={({ isActive }) =>
          isActive ? active : `${baseTab} ${inactive}`
        }
      >
        Tags
      </NavLink>

    </div>
  );
};

export default CustomerTabs;
