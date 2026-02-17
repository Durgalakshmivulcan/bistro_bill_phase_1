import { NavLink, Outlet } from "react-router-dom";
import { manageStaffSubMenu } from "../../data/manageStaffSubMenu";

const ManageStaffLayout = () => {
  return (
    <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:gap-8">
      
      {/* LEFT SUB MENU */}
      <div className="w-full lg:w-56 shrink-0">
        <div className="flex lg:block gap-2 lg:gap-0 overflow-x-auto lg:overflow-visible">
          {manageStaffSubMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}   // 👈 IMPORTANT
              className={({ isActive }) =>
                `whitespace-nowrap lg:whitespace-normal block px-4 py-2 rounded-md text-sm mb-0 lg:mb-2 transition ${
                  isActive
                    ? "bg-yellow-400 font-medium text-black"
                    : "bg-white text-gray-600 hover:bg-yellow-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* RIGHT CONTENT CARD */}
      <div className="flex-1">
        <div className="rounded-xl border bg-white px-4 sm:px-6 py-5 min-h-[300px]">
          <Outlet />
        </div>
      </div>

    </div>
  );
};

export default ManageStaffLayout;
