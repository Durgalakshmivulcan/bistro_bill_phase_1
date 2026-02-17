import { Outlet } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import CustomerTabs from "../components/NavTabs/CustomerTabs";

const CustomerLayout = () => {
  return (
    <DashboardLayout>
      <div className="p-6 bg-bb-bg min-h-screen space-y-6">
        <CustomerTabs />

        {/* ONLY THIS PART CHANGES */}
        <Outlet />
      </div>
    </DashboardLayout>
  );
};

export default CustomerLayout;
