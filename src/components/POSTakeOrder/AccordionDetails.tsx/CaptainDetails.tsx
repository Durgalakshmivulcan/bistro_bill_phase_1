import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useBranch } from "../../../contexts/BranchContext";
import { useOrder } from "../../../contexts/OrderContext";
import { getStaff, Staff } from "../../../services/staffService";

// Captain selector for non-table orders (e.g., Take Away)
const CaptainDetails = () => {
  const { user } = useAuth();
  const { currentBranchId } = useBranch();
  const { table, setTable } = useOrder();

  const [captains, setCaptains] = useState<Staff[]>([]);
  const [selectedCaptainId, setSelectedCaptainId] = useState<string>(
    table.captainId || ""
  );
  const [loadingCaptains, setLoadingCaptains] = useState(false);
  const [captainError, setCaptainError] = useState<string | null>(null);

  // Determine branch to fetch staff from
  const branchId =
    currentBranchId ||
    (user?.userType === "Staff" ? user.branch?.id : undefined) ||
    (user?.userType === "BusinessOwner"
      ? user.branches?.find(b => b.isMainBranch)?.id || user.branches?.[0]?.id
      : undefined);

  // Fetch captains for the branch
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
        status: "active",
      });

      if (response.success && response.data) {
        const staffList = response.data.staff;
        const filteredStaff = staffList.filter(s => {
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

  // Sync selection into order context
  useEffect(() => {
    const selectedCaptain = captains.find(c => c.id === selectedCaptainId);

    setTable({
      ...table,
      captainId: selectedCaptainId || undefined,
      captainName: selectedCaptain
        ? `${selectedCaptain.firstName} ${selectedCaptain.lastName}`
        : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCaptainId, captains]);

  const handleCaptainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCaptainId(e.target.value);
  };

  return (
    <div className="space-y-4">
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
              {loadingCaptains
                ? "Loading captains..."
                : captainError
                ? "Error loading captains"
                : "Select Captain"}
            </option>
            {captains.map(captain => (
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

export default CaptainDetails;
