import { Outlet } from "react-router-dom";

export default function PointOfSaleLayout() {


  return (
    <div className="min-h-screen bg-bb-bg p-0 space-y-4">

      {/* POS PAGE CONTENT */}
      <Outlet />
    </div>
  );
}
