import { Outlet } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";

const SubscriptionPlansLayout = () => {
  return (
    <DashboardLayout>
      <div className="p-6 bg-[#FFFDF5] min-h-screen">
        <Outlet />
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionPlansLayout;
