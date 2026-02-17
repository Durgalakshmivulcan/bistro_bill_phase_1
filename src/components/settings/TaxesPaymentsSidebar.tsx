import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded text-sm ${
    isActive
      ? "bg-yellow-400 text-black font-medium"
      : "text-gray-700 hover:bg-gray-100"
  }`;

const TaxesPaymentsSidebar = () => {
  return (
    <div className="space-y-2">
      <NavLink to="." end className={linkClass}>
        Tax
      </NavLink>

      <NavLink to="tax-group" className={linkClass}>
        Tax Group
      </NavLink>

      <NavLink to="payment-options" className={linkClass}>
        Payment Options
      </NavLink>
    </div>
  );
};

export default TaxesPaymentsSidebar;
