import { NavLink } from "react-router-dom";

const PurchaseOrderTabs = () => {
  const baseTab = "pb-2 text-sm";
  const inactive = "text-bb-textSoft";
  const active =
    "px-3 py-1.5 bg-black text-white rounded-t-md font-medium";

  return (
    <div className="flex gap-6 border-b text-sm items-end">
      <NavLink
        to="/purchaseorder"
        end
        className={({ isActive }) =>
          isActive ? active : `${baseTab} ${inactive}`
        }
      >
        Suppliers
      </NavLink>

      <NavLink
        to="/purchaseorder/polist"
        className={({ isActive }) =>
          isActive ? active : `${baseTab} ${inactive}`
        }
      >
        Purchase Order
      </NavLink>
       
    </div>
  );
};

export default PurchaseOrderTabs;
