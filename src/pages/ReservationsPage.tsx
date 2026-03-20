import { useState } from "react";
import ReservationsHeader from "../components/POSReservations/ReservationsHeader";
import ReservationsFilters from "../components/POSReservations/ReservationsFilters";
import ReservationsTable from "../components/POSReservations/ReservationsTable";
import POSActionsBar from "../components/NavTabs/POSActionsBar";
import { useNavigate } from "react-router-dom";
import POSHeader from "../layout/POSHeader";

const ReservationsPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const handleBack = () => {
  const entryPath =
    sessionStorage.getItem("posEntry") ||
    sessionStorage.getItem("lastNonPOS") ||
    "/";

  sessionStorage.removeItem("posEntry");
  navigate(entryPath);
};

  const handleClearFilters = () => {
    setSearch("");
    setDateFilter("");
  };
  return (
    <div className="min-h-screen bg-bb-bg p-3 sm:p-4 lg:p-6">
      <POSHeader />
       <div className="flex items-center gap-3 mb-4">
       <button
          onClick={handleBack}
          className="text-[#655016] hover:opacity-80 transition text-lg"
          aria-label="Back"
        >
          ←
        </button>

        <h1 className="text-sm sm:text-base lg:text-lg font-medium text-[#655016]">
          Point Of Sale
        </h1>
      </div>

      <div>
        <POSActionsBar/>
        <ReservationsHeader activeTab={statusFilter} onTabChange={setStatusFilter} />
        <ReservationsFilters
          search={search}
          dateFilter={dateFilter}
          onSearchChange={setSearch}
          onDateFilterChange={setDateFilter}
          onClear={handleClearFilters}
        />
        <ReservationsTable
          statusFilter={statusFilter}
          searchQuery={search}
          dateFilter={dateFilter}
        />
      </div>
    </div>
  );
};

export default ReservationsPage;
