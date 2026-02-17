import { NavLink } from "react-router-dom";
import { useState } from "react";

import {
  ShoppingCart,
  ClipboardList,
  Table,
  CalendarDays,
  Search,
  List,
  LayoutGrid,
} from "lucide-react";

const tabBaseClass = `
  flex items-center gap-2
  h-9
  px-4
  rounded-full
  text-sm font-medium
  leading-none
  transition-colors
  whitespace-nowrap
`;

const tabActiveClass = `
  bg-black text-white
`;

const tabInactiveClass = `
  text-gray-500 hover:bg-gray-100
`;
type Props = {
  viewMode: "list" | "grid";
  setViewMode: (v: "list" | "grid") => void;
};

const POSActionsBar = () =>{

  return (
    <div className="w-full space-y-4">
      {/* TABS ROW */}
      <div
        className="
          bg-white
          rounded-full
          px-2
          shadow-sm
          overflow-x-auto
          scrollbar-hide

          flex gap-2
          md:grid md:grid-cols-4 md:gap-0
          items-center
        "
      >
        {/* Take Order */}
        <div className="md:justify-self-start">
          <NavLink
            to="/pos/takeorder"
            className={({ isActive }) =>
              `${tabBaseClass} ${isActive ? tabActiveClass : tabInactiveClass}`
            }
          >
            <ShoppingCart
              size={16}
              strokeWidth={1.75}
              className="relative top-[1px]"
            />
            Take Order
          </NavLink>
        </div>

        {/* My Orders */}
        <div className="md:justify-self-center">
          <NavLink
            to="/pos/orderspage"
            className={({ isActive }) =>
              `${tabBaseClass} ${isActive ? tabActiveClass : tabInactiveClass}`
            }
          >
            <ClipboardList
              size={16}
              strokeWidth={1.75}
              className="relative top-[1px]"
            />
            My Orders
          </NavLink>
        </div>

        {/* Table View */}
        <div className="md:justify-self-center">
          <NavLink
            to="/pos/tableview"
            className={({ isActive }) =>
              `${tabBaseClass} ${isActive ? tabActiveClass : tabInactiveClass}`
            }
          >
            <Table
              size={16}
              strokeWidth={1.75}
              className="relative top-[1px]"
            />
            Table View
          </NavLink>
        </div>

        {/* Reservations */}
        <div className="md:justify-self-end">
          <NavLink
            to="/pos/reservations"
            className={({ isActive }) =>
              `${tabBaseClass} ${isActive ? tabActiveClass : tabInactiveClass}`
            }
          >
            <CalendarDays
              size={16}
              strokeWidth={1.75}
              className="relative top-[1px]"
            />
            Reservations
          </NavLink>
        </div>
      </div>
      {/* SEARCH + ACTIONS */}
      
    </div>
  );
};

export default POSActionsBar;
