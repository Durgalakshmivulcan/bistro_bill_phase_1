import { useState } from "react";
import { Search } from "lucide-react";
import CreateStaffModal from "../../../components/Staff/CreateStaffModal";
import StaffTable from "../../../components/Staff/staffTable";
import Pagination from "../../../components/Common/Pagination";

const StaffListingPage = () => {
  const [openCreateStaff, setOpenCreateStaff] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleStaffSuccess = () => {
    setRefreshKey(prev => prev + 1); // Trigger re-render of StaffTable
  };

  return (
    <>
      <div className="space-y-5 sm:space-y-6 w-full">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between w-full overflow-x-auto">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight">
            Staff Listing
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full lg:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                placeholder="Search here..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full
                  pl-9 pr-3 py-2
                  border rounded-md
                  text-sm
                  bg-white
                  placeholder:text-gray-500
                  focus:outline-none
                  focus:ring-2 focus:ring-black/20
                "
              />
            </div>

            {/* Add Button */}
            <button
              onClick={() => setOpenCreateStaff(true)}
              className="
                bg-black text-white
                px-4 py-2
                rounded-md
                text-sm font-medium
                w-full sm:w-auto
                hover:bg-black/90
                transition
              "
            >
              Add New
            </button>
          </div>
        </div>

        <div className="w-full bg-white overflow-x-auto">
          <div className="min-w-[900px]">
            <StaffTable
              key={refreshKey}
              searchQuery={searchQuery}
              roleFilter={selectedRole}
              statusFilter={selectedStatus}
              onRoleChange={setSelectedRole}
              onStatusChange={setSelectedStatus}
              onClearFilters={() => {
                setSearchQuery("");
                setSelectedRole("");
                setSelectedStatus("");
              }}
            />
          </div>
        </div>
      </div>

      {/* ================= CREATE STAFF MODAL ================= */}
      {openCreateStaff && (
        <CreateStaffModal
          onClose={() => setOpenCreateStaff(false)}
          onSuccess={handleStaffSuccess}
        />
      )}
    </>
  );
};

export default StaffListingPage;
