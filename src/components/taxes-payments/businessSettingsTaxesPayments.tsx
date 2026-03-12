import { Outlet } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import SettingsTabs from "../NavTabs/BusinessSettingsTabs";
import TaxesPaymentsSidebar from "../settings/TaxesPaymentsSidebar";

const TaxesPaymentsLayout = () => {
  return (
    <DashboardLayout>
      <div className="bb-shell">
        <div className="bb-frame">
          <main className="flex-1 bg-[#FFFBF3] px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-lg font-medium mb-4">Business Settings</h1>

            {/* Top Tabs */}
            <SettingsTabs />

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* LEFT SIDE MENU */}
              <div className="lg:col-span-1 bg-[#FFFBF3] rounded-lg p-3 h-fit">
                <TaxesPaymentsSidebar />
              </div>

              {/* RIGHT CONTENT (CHANGES) */}
              <div className="lg:col-span-3 bg-[#FFFBF3] border border-[#EADFC2] rounded-lg p-6">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TaxesPaymentsLayout;
