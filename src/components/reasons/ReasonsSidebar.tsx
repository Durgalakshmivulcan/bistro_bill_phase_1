import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded text-sm transition-colors ${
    isActive
      ? "bg-yellow-400 text-black font-medium"
      : "text-gray-700 hover:bg-gray-100"
  }`;

const ReasonsSidebar = () => {
  return (
    <div className="space-y-1">
      <NavLink
        to="."
        end
        className={linkClass}
      >
        Discount Reasons
      </NavLink>

      <NavLink
        to="branch-close-reasons"
        className={linkClass}
      >
        Branch Close Reasons
      </NavLink>

      <NavLink
        to="order-cancel-reasons"
        className={linkClass}
      >
        Order Cancel Reasons
      </NavLink>

      <NavLink
        to="refund-reasons"
        className={linkClass}
      >
        Refund Reasons
      </NavLink>

      <NavLink
        to="non-chargeable"
        className={linkClass}
      >
        Non-Chargeable
      </NavLink>

      <NavLink
        to="inventory-adjustments"
        className={linkClass}
      >
        Inventory Adjustments
      </NavLink>

      <NavLink
        to="reservations"
        className={linkClass}
      >
        Reservations
      </NavLink>

      <NavLink
        to="sales-return"
        className={linkClass}
      >
        Sales Return
      </NavLink>
    </div>
  );
};

export default ReasonsSidebar;
