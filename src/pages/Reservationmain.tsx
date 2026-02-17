import { useState } from "react";
import ReservationsHeader from "../components/POSReservations/ReservationsHeader";
import ReservationsFilters from "../components/POSReservations/ReservationsFilters";
import ReservationsTable from "../components/POSReservations/ReservationsTable";
import DashboardLayout from "../layout/DashboardLayout";

const ReservationsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState("All");

  return (
    <DashboardLayout>
      <div
        className="
          bg-[#FFFDF5]

          h-[calc(100vh-4rem)]
          min-h-[600px]

          px-3 py-3
          sm:px-4 sm:py-4
          md:px-6 md:py-5

          flex flex-col
          gap-4 md:gap-6
        "
      >
        {/* Header */}
        <ReservationsHeader activeTab={statusFilter} onTabChange={setStatusFilter} />

        {/* Filters */}
        <ReservationsFilters />

        {/* Table Wrapper (ONLY SCROLL AREA) */}
        <div className="flex-1 overflow-auto">
          <div className="w-full min-w-max">
            <ReservationsTable statusFilter={statusFilter} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReservationsPage;
