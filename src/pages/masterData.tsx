import { Outlet } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";

const MasterDataLayout = () => {
  return (
    <DashboardLayout>
      <div className="p-6 bg-bb-bg min-h-screen">
        {/* ONLY CHILD ROUTES RENDER HERE */}
        <Outlet />
      </div>
    </DashboardLayout>
  );
};

export default MasterDataLayout;
