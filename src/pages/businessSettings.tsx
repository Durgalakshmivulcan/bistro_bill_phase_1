import { Outlet } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import BusinessSettingsTabs from "../components/NavTabs/BusinessSettingsTabs";

const BusinessSettingsLayout = () => {
  return (
    <DashboardLayout>
      <div className="p-6 bg-[#FFFDF5] min-h-screen space-y-6">
        <BusinessSettingsTabs />

        <Outlet />
      </div>
    </DashboardLayout>
  );
};

export default BusinessSettingsLayout;
