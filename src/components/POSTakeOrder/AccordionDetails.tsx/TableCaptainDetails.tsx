import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useBranch } from "../../../contexts/BranchContext";
import { useOrder } from "../../../contexts/OrderContext";
import { getFloors, getTables, Floor, Table, FloorListResponse, TableListResponse } from "../../../services/tableService";
import { getStaff, getRoles, Staff, StaffListResponse } from "../../../services/staffService";

const TableCaptainDetails = () => {
  const { user } = useAuth();
  const { currentBranchId } = useBranch();
  const { table, setTable } = useOrder();

  // Local state
  const [guestCount, setGuestCount] = useState<number | null>(table.guestCount ?? null);
  const [selectedFloorId, setSelectedFloorId] = useState<string>(table.floorId || "");
  const [selectedTableId, setSelectedTableId] = useState<string>(table.tableId || "");
  const [selectedCaptainId, setSelectedCaptainId] = useState<string>(table.captainId || "");

  // API data state
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [captains, setCaptains] = useState<Staff[]>([]);
  const [captainRoleId, setCaptainRoleId] = useState<string | null>(null);

  // Loading states
  const [loadingFloors, setLoadingFloors] = useState<boolean>(false);
  const [loadingTables, setLoadingTables] = useState<boolean>(false);
  const [loadingCaptains, setLoadingCaptains] = useState<boolean>(false);

  // Error states
  const [floorError, setFloorError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [captainError, setCaptainError] = useState<string | null>(null);

  // Table dropdown open state
  const [tableDropdownOpen, setTableDropdownOpen] = useState<boolean>(false);

  // Use branchId from BranchContext, fall back to user branch selection
  const branchId =
    currentBranchId ||
    (user?.userType === 'Staff' ? user.branch?.id : undefined) ||
    (user?.userType === 'BusinessOwner'
      ? user.branches?.find(b => b.isMainBranch)?.id || user.branches?.[0]?.id
      : undefined);

  // Fetch floors on mount
  useEffect(() => {
    if (!branchId) {
      setFloorError("Branch ID not available");
      return;
    }

    const fetchFloors = async () => {
      setLoadingFloors(true);
      setFloorError(null);

      const response = await getFloors(branchId, 'active');

      if (response.success && response.data) {
        setFloors(response.data.floors);
      } else {
        setFloorError(response.error?.message || "Failed to load floors");
      }

      setLoadingFloors(false);
    };

    fetchFloors();
  }, [branchId]);

  // Fetch tables when floor is selected
  useEffect(() => {
    if (!selectedFloorId) {
      setTables([]);
      return;
    }

    const fetchTables = async () => {
      setLoadingTables(true);
      setTableError(null);

      const response = await getTables(selectedFloorId);

      if (response.success && response.data) {
        const minCapacity = guestCount ?? 0;
        const availableTables = response.data.tables.filter(
          (table) =>
            table.capacity >= minCapacity &&
            table.status?.toLowerCase() !== 'maintenance'
        );
        setTables(availableTables);
      } else {
        setTableError(response.error?.message || "Failed to load tables");
      }

      setLoadingTables(false);
    };

    fetchTables();
  }, [selectedFloorId, guestCount]);

  // Fetch captain role id on mount
  useEffect(() => {
    const fetchCaptainRole = async () => {
      try {
        const resp = await getRoles("active");
        if (resp.success && resp.data?.roles) {
          const captainRole = resp.data.roles.find(
            (r) => r.name.toLowerCase() === "captain" || r.name.toLowerCase() === "waiter"
          );
          if (captainRole) setCaptainRoleId(captainRole.id);
        }
      } catch (err) {
        console.error("Failed to load roles for captain filter", err);
      }
    };
    fetchCaptainRole();
  }, []);

  // Fetch captains when branch ready (do not hard-filter by missing role)
  useEffect(() => {
    if (!branchId) {
      setCaptainError("Branch ID not available");
      return;
    }

    const fetchCaptains = async () => {
      setLoadingCaptains(true);
      setCaptainError(null);

      const response = await getStaff({
        branchId,
        status: 'active',
        // avoid roleId filter that might exclude custom role names
      });

      if (response.success && response.data) {
        const staffList = response.data.staff;
        const filteredStaff = staffList.filter((s) => {
          const role = (s.roleName || "").toLowerCase();
          return role.includes("captain") || role.includes("waiter");
        });
        setCaptains(filteredStaff.length > 0 ? filteredStaff : staffList);
      } else {
        setCaptainError(response.error?.message || "Failed to load staff");
      }

      setLoadingCaptains(false);
    };

    fetchCaptains();
  }, [branchId]);

  // Update OrderContext when selections change
  useEffect(() => {
    const selectedFloor = floors.find((f) => f.id === selectedFloorId);
    const selectedTable = tables.find((t) => t.id === selectedTableId);
    const selectedCaptain = captains.find((c) => c.id === selectedCaptainId);

    setTable({
      floorId: selectedFloorId || undefined,
      floorName: selectedFloor?.name || undefined,
      tableId: selectedTableId || undefined,
      tableName: selectedTable?.tableNumber || undefined,
      guestCount: guestCount ?? undefined,
      captainId: selectedCaptainId || undefined,
      captainName: selectedCaptain ? `${selectedCaptain.firstName} ${selectedCaptain.lastName}` : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFloorId, selectedTableId, selectedCaptainId, guestCount, floors, tables, captains]);

  // Guest count handlers
  const incrementGuests = () => setGuestCount((prev) => (prev ? prev + 1 : 1));
  const decrementGuests = () => setGuestCount((prev) => {
    if (!prev) return null;
    return Math.max(1, prev - 1);
  });

  // Floor change handler
  const handleFloorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const floorId = e.target.value;
    setSelectedFloorId(floorId);
    // Reset table selection when floor changes
    setSelectedTableId("");
  };

  // Table selection handler
  const handleTableSelect = (tableId: string) => {
    setSelectedTableId(tableId);
    setTableDropdownOpen(false);
  };

  // Captain change handler
  const handleCaptainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCaptainId(e.target.value);
  };

  // Get table status color
  const getTableStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100';
      case 'occupied':
      case 'running':
        return 'bg-red-100';
      case 'reserved':
        return 'bg-yellow-100';
      case 'cleaning':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  };

  // Get selected table name for display
  const selectedTableName = tables.find((t) => t.id === selectedTableId)?.tableNumber || "Select Table";

  const formatTableStatus = (status: string) =>
    status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";

  // Drop table selection if guest count now exceeds capacity of chosen table
  useEffect(() => {
    if (!selectedTableId || guestCount == null) return;
    const selected = tables.find((t) => t.id === selectedTableId);
    if (selected && selected.capacity < guestCount) {
      setSelectedTableId("");
    }
  }, [guestCount, selectedTableId, tables]);

  return (
    <div className="space-y-4">

      {/* Guest Count */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Guest Count
        </label>

        <div className="inline-flex items-center rounded-full overflow-hidden bg-black">
          <button
            onClick={decrementGuests}
            className="h-10 w-10 flex items-center justify-center text-white text-lg hover:bg-gray-800 transition-colors"
          >
            −
          </button>

          <div className="h-10 min-w-[104px] px-3 flex items-center justify-center bg-white font-medium">
            {guestCount === null ? (
              <span className="text-gray-500 text-sm">Guest Count</span>
            ) : (
              <span className="text-gray-700">
                {guestCount.toString().padStart(2, '0')}
              </span>
            )}
          </div>

          <button
            onClick={incrementGuests}
            className="h-10 w-10 flex items-center justify-center text-white text-lg hover:bg-gray-800 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Floor / Area */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Floor/Area
        </label>

        <div className="relative">
          <select
            value={selectedFloorId}
            onChange={handleFloorChange}
            disabled={loadingFloors || !!floorError}
            className="w-full h-10 rounded-lg border border-gray-200 px-3 pr-10 text-sm appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">
              {loadingFloors ? "Loading floors..." : floorError ? "Error loading floors" : "Select Floor/Area"}
            </option>
            {floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.name}
              </option>
            ))}
          </select>

          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

        {floorError && (
          <p className="text-xs text-red-600 mt-1">{floorError}</p>
        )}
      </div>

      {/* Table */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Table
        </label>

        <div className="border border-gray-200 rounded-lg overflow-hidden">

          <button
            onClick={() => setTableDropdownOpen(!tableDropdownOpen)}
            disabled={!selectedFloorId || loadingTables || !!tableError}
            className="w-full h-10 flex items-center justify-between px-3 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <span className={selectedTableId ? "text-gray-700" : "text-gray-500"}>
              {loadingTables ? "Loading tables..." : tableError ? "Error loading tables" : selectedTableName}
            </span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {/* Dropdown */}
          {tableDropdownOpen && tables.length > 0 && (
            <div className="border-t text-sm max-h-48 overflow-y-auto">
              {tables.map((table) => (
                <label
                  key={table.id}
                  className={`
                    flex items-center gap-3 px-3 py-2 cursor-pointer
                    ${table.id === selectedTableId ? getTableStatusColor(table.currentStatus) : "hover:bg-gray-50"}
                  `}
                  onClick={() => handleTableSelect(table.id)}
                >
                  <input
                    type="checkbox"
                    checked={table.id === selectedTableId}
                    onChange={() => handleTableSelect(table.id)}
                    className="accent-black"
                  />
                  <span className="flex-1">
                    {table.tableNumber}
                    <span className="ml-2 text-xs text-gray-500">
                      • {table.capacity} seats
                    </span>
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    table.currentStatus.toLowerCase() === 'available' ? 'bg-green-200 text-green-800' :
                    table.currentStatus.toLowerCase() === 'occupied' || table.currentStatus.toLowerCase() === 'running' ? 'bg-red-200 text-red-800' :
                    table.currentStatus.toLowerCase() === 'reserved' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {formatTableStatus(table.currentStatus)}
                  </span>
                </label>
              ))}
            </div>
          )}

          {tableDropdownOpen && tables.length === 0 && !loadingTables && (
            <div className="border-t text-sm px-3 py-2 text-gray-500 text-center">
              No tables available for this floor
            </div>
          )}
        </div>

        {tableError && (
          <p className="text-xs text-red-600 mt-1">{tableError}</p>
        )}
      </div>

      {/* Captain */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Captain
        </label>

        <div className="relative">
          <select
            value={selectedCaptainId}
            onChange={handleCaptainChange}
            disabled={loadingCaptains || !!captainError}
            className="w-full h-10 rounded-lg border border-gray-200 px-3 pr-10 text-sm appearance-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">
              {loadingCaptains ? "Loading captains..." : captainError ? "Error loading captains" : "Select Captain"}
            </option>
            {captains.map((captain) => (
              <option key={captain.id} value={captain.id}>
                {captain.firstName} {captain.lastName} ({captain.roleName})
              </option>
            ))}
          </select>

          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

        {captainError && (
          <p className="text-xs text-red-600 mt-1">{captainError}</p>
        )}
      </div>

    </div>
  );
};

export default TableCaptainDetails;
