import { useState, useEffect, useMemo } from "react";
import ActionsMenu from "../form/ActionButtons";
import Modal from "../../components/ui/Modal";
import Pagination from "../Common/Pagination";
import LoadingSpinner from "../Common/LoadingSpinner";
import FilterDropdown from "../Common/FilterDropdown";
import deleteIcon from "../../assets/deleteConformImg.png";
import deleteSuccessImg from "../../assets/deleteSuccessImg.png";
import CreateStaffModal from "../Staff/CreateStaffModal";
import { getStaff, deleteStaff, getRoles, Staff as ApiStaff, Role } from "../../services/staffService";
import { CRUDToasts } from "../../utils/toast";

// ================= TYPES =================
export interface Staff {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  userId: string;
  email: string;
  phone: string;
  role: string;
  status: "active" | "inactive";
}

interface StaffTableProps {
  searchQuery?: string;
  roleFilter?: string;
  statusFilter?: string;
  onRoleChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  onClearFilters?: () => void;
}

const StaffTable = ({
  searchQuery = "",
  roleFilter = "",
  statusFilter = "",
  onRoleChange,
  onStatusChange,
  onClearFilters,
}: StaffTableProps = {}) => {
  const [staffData, setStaffData] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const apiBaseUrl = (process.env.REACT_APP_API_URL || "http://localhost:5001/api/v1")
    .replace(/\/api\/v1\/?$/, "");

  const toAbsoluteAvatarUrl = (avatarPath?: string | null): string | null => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("/images/")) return avatarPath;
    if (avatarPath.startsWith("/assets/")) {
      return `${apiBaseUrl}${avatarPath}`;
    }
    if (/^https?:\/\//i.test(avatarPath)) return avatarPath;
    return `${apiBaseUrl}${avatarPath.startsWith("/") ? "" : "/"}${avatarPath}`;
  };

  // ================= FETCH STAFF DATA =================
  useEffect(() => {
    fetchStaffData();
    fetchRoles();
  }, []);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getStaff();

      if (response.success && response.data) {
        // Map API staff to component staff format
        const mappedStaff: Staff[] = response.data.staff.map((apiStaff: ApiStaff) => ({
          id: apiStaff.id,
          name: `${apiStaff.firstName} ${apiStaff.lastName}`,
          firstName: apiStaff.firstName,
          lastName: apiStaff.lastName,
          avatar: apiStaff.avatar,
          userId: apiStaff.id, // Using ID as userId since backend doesn't have separate userId
          email: apiStaff.email,
          phone: apiStaff.phone || "N/A",
          role: apiStaff.roleName,
          status: apiStaff.status.toLowerCase() as "active" | "inactive",
        }));
        setStaffData(mappedStaff);
      } else {
        setError(response.error?.message || "Failed to fetch staff data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while fetching staff");
      console.error("Error fetching staff:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await getRoles();
      if (response.success && response.data) {
        setRoles(response.data.roles);
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  // ================= HANDLERS =================
  const handleDeleteClick = (staffId: string) => {
    setDeleteId(staffId);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await deleteStaff(deleteId);

      if (response.success) {
        CRUDToasts.deleted("Staff");
        setShowConfirm(false);
        setShowSuccess(true);
        // Refresh staff list after successful deletion
        fetchStaffData();
      } else {
        setError(response.error?.message || "Failed to delete staff");
        setShowConfirm(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while deleting staff");
      console.error("Error deleting staff:", err);
      setShowConfirm(false);
    }
  };

  const handleEdit = (staff: Staff) => {
    setEditStaff(staff);
    setStaffModalOpen(true);
  };

  // ================= FILTERED DATA =================
  const filteredStaff = useMemo(() => {
    let filtered = staffData;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (staff) =>
          staff.name.toLowerCase().includes(query) ||
          staff.email.toLowerCase().includes(query) ||
          staff.phone.includes(query) ||
          staff.userId.toLowerCase().includes(query)
      );
    }

    // Filter by role
    if (roleFilter && roleFilter !== "Filter by Role") {
      filtered = filtered.filter((staff) => staff.role === roleFilter);
    }

    // Filter by status
    if (statusFilter && statusFilter !== "Filter by Status") {
      filtered = filtered.filter((staff) => staff.status === statusFilter);
    }

    return filtered;
  }, [staffData, searchQuery, roleFilter, statusFilter]);

  // ================= FILTER OPTIONS =================
  const roleOptions = useMemo(() => {
    const roleNamesFromRoles = roles.map((role) => role.name);
    const roleNamesFromStaff = staffData.map((staff) => staff.role);
    const uniqueRoleNames = Array.from(new Set([...roleNamesFromRoles, ...roleNamesFromStaff]))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return uniqueRoleNames.map((roleName) => ({ label: roleName, value: roleName }));
  }, [roles, staffData]);

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  const getRoleBadgeClass = (role: string) => {
    const normalized = role.trim().toLowerCase();
    if (normalized === "manager") return "bg-blue-100 text-blue-600";
    if (normalized === "chief" || normalized === "chef") return "bg-lime-100 text-lime-700";
    if (normalized === "waiter") return "bg-amber-100 text-amber-700";
    if (normalized === "cashier") return "bg-violet-100 text-violet-700";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <>
      {/* ================= FILTERS ================= */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap gap-3 lg:justify-end lg:items-end mb-4 px-4 pt-4">
        <FilterDropdown
          label="Filter by Role"
          value={roleFilter}
          options={roleOptions}
          onChange={(value) => onRoleChange?.(value as string)}
          className="w-full sm:w-auto lg:w-48"
        />

        <FilterDropdown
          label="Filter by Status"
          value={statusFilter}
          options={statusOptions}
          onChange={(value) => onStatusChange?.(value as string)}
          className="w-full sm:w-auto lg:w-48"
        />

        <button
          onClick={onClearFilters}
          className="
            bg-yellow-400
            px-4 py-2
            rounded-md
            text-sm font-medium
            w-full sm:w-auto lg:w-32
            border border-black
            hover:bg-yellow-500
            transition
          "
        >
          Clear
        </button>
      </div>

      {/* ================= ERROR STATE ================= */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">Error loading staff</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchStaffData}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* ================= TABLE ================= */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[1100px] rounded-xl border bg-white overflow-visible">
          <table className="w-full text-sm">
            <thead className="bg-yellow-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Sl. No.</th>
                <th className="px-4 py-3 text-left font-medium">Staff Name & ID</th>
                <th className="px-4 py-3 text-left font-medium">Contact Details</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {/* LOADING STATE */}
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8">
                    <div className="flex justify-center">
                      <LoadingSpinner size="md" message="Loading staff..." />
                    </div>
                  </td>
                </tr>
              )}

              {/* EMPTY STATE */}
              {!loading && filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    <p>No staff members found</p>
                    {(searchQuery || roleFilter || statusFilter) && (
                      <p className="text-sm mt-2">Try adjusting your filters</p>
                    )}
                  </td>
                </tr>
              )}

              {/* ROWS */}
              {!loading && filteredStaff.map((staff, index) => (
                <tr
                  key={staff.id}
                  className="border-b last:border-b-0 even:bg-[#FFF8E7]"
                >
                  <td className="px-4 py-4 align-middle">{index + 1}</td>

                  {/* NAME + ID */}
                  <td className="px-4 py-4 align-middle">
                    <div className="flex items-center gap-3">
                      {staff.avatar ? (
                        <img
                          src={toAbsoluteAvatarUrl(staff.avatar) || ""}
                          alt={staff.name}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-semibold">
                          {(staff.firstName?.[0] || "") + (staff.lastName?.[0] || "")}
                        </div>
                      )}
                      <div>
                        <p className="font-medium leading-4">{staff.name}</p>
                        <p className="text-xs text-gray-500">{staff.userId}</p>
                      </div>
                    </div>
                  </td>

                  {/* CONTACT */}
                  <td className="px-4 py-4 align-middle">
                    <p className="truncate max-w-[240px]">{staff.email}</p>
                    <p className="text-xs text-gray-500">{staff.phone}</p>
                  </td>

                  {/* ROLE */}
                  <td className="px-4 py-4 align-middle">
                    <span className={`text-xs px-3 py-1 rounded-md w-fit ${getRoleBadgeClass(staff.role)}`}>
                      {staff.role}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-4 align-middle">
                    <span
                      className={`text-xs px-3 py-1 rounded-full w-fit ${
                        staff.status === "active"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {staff.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-4 align-middle">
                    <div className="flex justify-center">
                      <ActionsMenu
                        actions={["edit", "delete"]}
                        onEdit={() => handleEdit(staff)}
                        onDelete={() => handleDeleteClick(staff.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= PAGINATION ================= */}
      <div className="flex justify-end mt-6">
        <Pagination />
      </div>

      {/* ================= DELETE CONFIRM MODAL ================= */}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Delete</h2>

        <div className="flex justify-center mb-4">
          <img src={deleteIcon} alt="delete" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600 mb-6">
          This action cannot be undone. <br />
          Do you want to proceed with deletion?
        </p>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            className="border px-6 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={confirmDelete}
            className="bg-yellow-400 px-6 py-2 rounded font-medium"
          >
            Yes
          </button>
        </div>
      </Modal>

      {/* ================= DELETE SUCCESS MODAL ================= */}
      <Modal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Deleted!</h2>

        <div className="flex justify-center mb-4">
          <img src={deleteSuccessImg} alt="success" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          Staff has been successfully deleted.
        </p>
      </Modal>

      {/* ================= CREATE / EDIT STAFF MODAL ================= */}
      {staffModalOpen && (
        <CreateStaffModal
          onClose={() => {
            setStaffModalOpen(false);
            setEditStaff(null);
          }}
          defaultValues={editStaff || undefined}
          onSuccess={fetchStaffData}
        />
      )}
    </>
  );
};

export default StaffTable;
