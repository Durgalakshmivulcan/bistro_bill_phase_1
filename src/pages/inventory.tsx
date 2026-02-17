import { Outlet } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";

const InventoryLayout = () => {
  return (
    <DashboardLayout>
      <div className="p-6 bg-[#FFFDF5] min-h-screen">
        {/* ONLY CHILD ROUTES RENDER HERE */}
        <Outlet />
      </div>
    </DashboardLayout>
  );
};

export default InventoryLayout;
