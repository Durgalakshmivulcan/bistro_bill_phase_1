import { Outlet } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import SettingsTabs from "../NavTabs/BusinessSettingsTabs";
import ReasonsSidebar from "./ReasonsSidebar";

const ReasonsLayout = () => {
  return (
    <DashboardLayout>
      <div className="bb-shell">
        <div className="bb-frame">
          <main className="flex-1 bg-[#FFFBF3] px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-lg font-medium mb-4">Business Settings</h1>

            <SettingsTabs />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
              {/* LEFT */}
              <ReasonsSidebar />

              {/* RIGHT */}
              <div className="lg:col-span-3">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReasonsLayout;
