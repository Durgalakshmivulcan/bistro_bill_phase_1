import { Outlet } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import CatalogTabs from "../components/NavTabs/CatalogTabs";

const CatalogLayout = () => {
  return (
    <DashboardLayout>
      <div className="p-6 bg-bb-bg min-h-screen space-y-6">
        <CatalogTabs />

        {/* ONLY THIS PART CHANGES */}
        <Outlet />
      </div>
    </DashboardLayout>
  );
};

export default CatalogLayout;
