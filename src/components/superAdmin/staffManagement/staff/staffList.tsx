import { useState, useEffect, useMemo } from "react";
import ActionsMenu from "../../../form/ActionButtons";
import Modal from "../../../../components/ui/Modal";
import Pagination from "../../../Common/Pagination";
import LoadingSpinner from "../../../Common/LoadingSpinner";
import deleteIcon from "../../../../assets/deleteConformImg.png";
import deleteSuccessImg from "../../../../assets/deleteSuccessImg.png";
import CreateStaffModal from "../../../Staff/CreateStaffModal";
import { getStaff, deleteStaff, getRoles, Staff as ApiStaff, Role } from "../../../../services/staffService";
import { usePermissions } from "../../../../hooks/usePermissions";
import { CRUDToasts } from "../../../../utils/toast";
import SearchInput from "../../../Common/SearchInput";
import Select from "../../../form/Select";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  getBusinessOwners,
  BusinessOwnerListItem,
} from "../../../../services/superAdminService";
import { getSelectedBoId, setSelectedBoId } from "../../../../services/saReportContext";

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
  onSearchChange?: (value: string) => void;

}

const SuperAdminStaffTable = ({
  searchQuery = "",
  roleFilter = "",
  statusFilter = "",
  onSearchChange,
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
  const { user } = useAuth();
  const isSuperAdmin = user?.userType === "SuperAdmin";
  const [selectedBo, setSelectedBo] = useState<string>(getSelectedBoId() || "");
  const [boList, setBoList] = useState<BusinessOwnerListItem[]>([]);
  const [boLoading, setBoLoading] = useState(false);

  // ================= PERMISSIONS =================
  const { canUpdate, canDelete } = usePermissions('staff');
  const canManageActions = isSuperAdmin || canUpdate || canDelete;

  // ================= FETCH STAFF DATA =================
  useEffect(() => {
    const loadBusinessOwners = async () => {
      if (!isSuperAdmin) return;
      setBoLoading(true);
      try {
        const res = await getBusinessOwners({ limit: 100 });
        if (res.success && res.data) {
          setBoList(res.data.businessOwners);
        }
      } finally {
        setBoLoading(false);
      }
    };

    loadBusinessOwners();
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchStaffData();
    fetchRoles();
  }, [selectedBo, isSuperAdmin]);

  const fetchStaffData = async () => {
    if (isSuperAdmin && !selectedBo) {
      setStaffData([]);
      setError("Select a restaurant context to load staff.");
      setLoading(false);
      return;
    }

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
      const response = await getRoles("Active");
      if (response.success && response.data) {
        setRoles(response.data.roles);
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };
  const handleStaffSuccess = () => {
    fetchStaffData();
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

  const handleBusinessOwnerChange = (boId: string) => {
    setSelectedBo(boId);
    setSelectedBoId(boId || null);
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
  const roleOptions = useMemo(
    () => roles.map((role) => ({ label: role.name, value: role.name })),
    [roles]
  );

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  const getRoleBadgeClass = (role: string) => {
    const normalized = role.trim().toLowerCase();
    if (normalized === "manager") return "bg-blue-100 text-blue-600";
    if (normalized === "staff") return "bg-red-100 text-red-500";
    if (normalized === "accountant") return "bg-lime-100 text-lime-700";
    if (normalized === "business analyst") return "bg-purple-100 text-purple-600";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <>
      {isSuperAdmin && (
        <div className="bg-white border rounded-lg p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Restaurant Context
          </label>
          <select
            value={selectedBo}
            onChange={(e) => handleBusinessOwnerChange(e.target.value)}
            className="w-full lg:w-80 border rounded-md px-3 py-2 text-sm bg-white"
            disabled={boLoading}
          >
            <option value="">-- Select a Restaurant --</option>
            {boList.map((bo) => (
              <option key={bo.id} value={bo.id}>
                {bo.restaurantName} ({bo.ownerName})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ================= FILTERS ================= */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap gap-3 items-end mb-4 px-4 pt-4">
        <SearchInput
          placeholder="Search staff..."
          value={searchQuery}
          onSearch={(val) => onSearchChange?.(val)}
          className="w-full sm:w-64"
        />

       <div className="w-full sm:w-auto lg:w-48">
  <Select
    value={roleFilter || "Filter by Role"}
    onChange={(val) =>
      onRoleChange?.(val === "Filter by Role" ? "" : val)
    }
    options={[
      { label: "Filter by Role", value: "Filter by Role" },
      ...roleOptions,
    ]}
  />
</div>
<div className="w-full sm:w-auto lg:w-48">
  <Select
    value={statusFilter || "Filter by Status"}
    onChange={(val) =>
      onStatusChange?.(val === "Filter by Status" ? "" : val)
    }
    options={[
      { label: "Filter by Status", value: "Filter by Status" },
      ...statusOptions,
    ]}
  />
</div>

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
        <button
          onClick={() => {
            setEditStaff(null);
            setStaffModalOpen(true);
          }}
          disabled={isSuperAdmin && !selectedBo}
          title={isSuperAdmin && !selectedBo ? "Select a restaurant first" : undefined}
          className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Add New
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
          {/* HEADER */}
          <div className="grid grid-cols-12 bg-yellow-400 px-4 py-3 text-sm font-medium">
            <span>Sl. No.</span>
            <span className="col-span-3">Staff Name</span>
            <span className="col-span-3">Contact Details</span>
            <span>Role</span>
            <span>Status</span>
            <span className="text-center">Actions</span>
          </div>

          {/* LOADING STATE */}
          {loading && (
            <div className="px-4 py-8 text-center">
              <div className="flex justify-center">
                <LoadingSpinner size="md" message="Loading staff..." />
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && filteredStaff.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              <p>No staff members found</p>
              {(searchQuery || roleFilter || statusFilter) && (
                <p className="text-sm mt-2">Try adjusting your filters</p>
              )}
            </div>
          )}

          {/* ROWS */}
          {!loading && filteredStaff.map((staff, index) => (
            <div
              key={staff.id}
              className="grid grid-cols-12 px-4 py-4 text-sm border-b items-center even:bg-[#FFF8E7]"
            >
              <span>{index + 1}</span>

              {/* NAME + ID */}
              <div className="col-span-3 flex items-center gap-3">
                {staff.avatar ? (
                  <img
                    src={staff.avatar}
                    alt={staff.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-semibold">
                    {(staff.firstName?.[0] || "") + (staff.lastName?.[0] || "")}
                  </div>
                )}
                <p className="font-medium">{staff.name}</p>
              </div>

              {/* CONTACT */}
              <div className="col-span-3">
                <p className="truncate max-w-[240px]">{staff.email}</p>
                <p className="text-xs text-gray-500">{staff.phone}</p>
              </div>

              {/* ROLE */}
              <span className={`text-xs px-3 py-1 rounded-md w-fit ${getRoleBadgeClass(staff.role)}`}>
                {staff.role}
              </span>

              {/* STATUS */}
              <span
                className={`text-xs px-3 py-1 rounded-full w-fit ${staff.status === "active"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                  }`}
              >
                {staff.status === "active" ? "Active" : "Inactive"}
              </span>

              {/* ACTIONS */}
              <div className="flex justify-center">
                {canManageActions ? (
                  <ActionsMenu
                    actions={
                      isSuperAdmin
                        ? ["edit", "delete"]
                        : canUpdate && canDelete
                          ? ["edit", "delete"]
                          : canUpdate
                            ? ["edit"]
                            : ["delete"]
                    }
                    onEdit={isSuperAdmin || canUpdate ? () => handleEdit(staff) : undefined}
                    onDelete={
                      isSuperAdmin || canDelete ? () => handleDeleteClick(staff.id) : undefined
                    }
                  />
                ) : (
                  <span className="text-xs text-gray-400">No actions</span>
                )}
              </div>
            </div>
          ))}
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
          onSuccess={handleStaffSuccess}
        />
      )}
    </>
  );
};

export default SuperAdminStaffTable;
