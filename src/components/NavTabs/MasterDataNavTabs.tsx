import { NavLink, useLocation } from "react-router-dom";

const MasterDataNavTabs = () => {
  const location = useLocation();

  const baseTab =
    "pb-2 text-sm whitespace-nowrap transition-all";
  const inactive =
    "text-bb-textSoft hover:text-black";
  const active =
    "px-4 py-2 bg-black text-white rounded-t-md font-medium";

  const isAllergiesActive =
    location.pathname === "/master-data" ||
    location.pathname.startsWith("/master-data/allergies");

  const isMeasuringActive =
    location.pathname.startsWith("/master-data/measuring-units");

  const isTaxActive =
    location.pathname.startsWith("/master-data/taxes");

  const isTaxGroupActive =
    location.pathname.startsWith("/master-data/taxgroup");

  return (
    <div className="border-b">
      <div
        className="
          flex gap-3
          overflow-x-auto
          no-scrollbar
          px-1
          items-end
        "
      >
        {/* ALLERGIES */}
        <NavLink
          to="/master-data"
          className={
            isAllergiesActive
              ? active
              : `${baseTab} ${inactive}`
          }
        >
          Allergies
        </NavLink>

        {/* MEASURING UNITS */}
        <NavLink
          to="/master-data/measuring-units"
          className={
            isMeasuringActive
              ? active
              : `${baseTab} ${inactive}`
          }
        >
          Measuring Units
        </NavLink>

        {/* TAX */}
        <NavLink
          to="/master-data/taxes"
          className={
            isTaxActive
              ? active
              : `${baseTab} ${inactive}`
          }
        >
          Tax
        </NavLink>

        {/* TAX GROUP */}
        <NavLink
          to="/master-data/taxgroup"
          className={
            isTaxGroupActive
              ? active
              : `${baseTab} ${inactive}`
          }
        >
          Tax Groups
        </NavLink>
      </div>
    </div>
  );
};

export default MasterDataNavTabs;
