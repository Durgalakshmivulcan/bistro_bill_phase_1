import { Outlet } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import SuperAdminStaffManagementTab from "../components/NavTabs/superAdminstaffManagementTab";

const SuperAdminManageResourcesLayout = () => {
  return (
    <DashboardLayout>
      {/* Page Wrapper */}
      <div className="bg-[#FFFDF5] min-h-screen w-full px-2 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4">
        
        {/* Content Container */}
        <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-4 md:gap-6">
          
          {/* Page Title */}
          <div className="flex items-center justify-between">
            <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">
              Manage Resources
            </h1>
          </div>

          {/* Tabs (Scrollable on Mobile) */}
          <div className="w-full overflow-x-visible">
            <div className="min-w-max">
              <SuperAdminStaffManagementTab />
            </div>
          </div>

          {/* Page Content */}
          <div className="w-full flex-1 overflow-x-auto">
            <Outlet />
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminManageResourcesLayout;
