import { Outlet } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";

const PurchaseOrderLayout = () => {
  return (
    <DashboardLayout>
      <div className="p-6 bg-[#FFFDF5] min-h-screen space-y-6">

        {/* ONLY THIS PART CHANGES */}
        <Outlet />
      </div>
    </DashboardLayout>
  );
};

export default PurchaseOrderLayout;
