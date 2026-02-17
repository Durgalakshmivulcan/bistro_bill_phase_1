import { Outlet } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import SettingsTabs from "../NavTabs/BusinessSettingsTabs";

const ChargesLayout = () => {
  return (
    <DashboardLayout>
      <div className="bb-shell">
        <div className="bb-frame">
          <main className="flex-1 bg-[#FFFBF3] px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-lg font-medium mb-4">Business Settings</h1>

            {/* Top Tabs */}
            <SettingsTabs />

            {/* Content */}
            <div className="mt-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChargesLayout;
