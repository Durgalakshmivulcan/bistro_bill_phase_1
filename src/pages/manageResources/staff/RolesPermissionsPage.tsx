import { useState, useMemo, useEffect } from "react";
import CreateRoleModal from "../../../components/Roles/CreateRoleModal";
import ActionsMenu from "../../../components/form/ActionButtons";
import Modal from "../../../components/ui/Modal";
import deleteIcon from "../../../assets/deleteConformImg.png";
import deleteSuccessImg from "../../../assets/deleteSuccessImg.png";
import { SearchInput, LoadingSpinner, ErrorDisplay } from "../../../components/Common";
import { getRoles, deleteRole, type RoleResponse } from "../../../services/staffService";

export interface Role {
  id: string;
  role: string;
  status: "Active" | "Inactive";
  staffCount: number;
  modules: string[];
  permissions: string[];
}

const RolesPermissionsPage = () => {
  const [openRoleModal, setOpenRoleModal] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // API state
  const [rolesData, setRolesData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch roles from API
  useEffect(() => {
    fetchRoles();
  }, [refreshKey]);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getRoles();

      if (response.data) {
        // Map backend RoleResponse to component Role interface
        const mappedRoles: Role[] = response.data.roles.map((role: RoleResponse) => ({
          id: role.id,
          role: role.name,
          status: role.status as "Active" | "Inactive",
          staffCount: role.staffCount || 0,
          modules: extractModulesFromPermissions(role.permissions),
          permissions: extractPermissionActionsFromPermissions(role.permissions),
        }));

        setRolesData(mappedRoles);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract module names from permissions object
  const extractModulesFromPermissions = (permissions: Record<string, unknown>): string[] => {
    return Object.keys(permissions || {});
  };

  // Helper to extract permission actions from permissions object
  const extractPermissionActionsFromPermissions = (permissions: Record<string, unknown>): string[] => {
    const actions = new Set<string>();

    Object.values(permissions || {}).forEach((modulePerms) => {
      if (typeof modulePerms === 'object' && modulePerms !== null) {
        Object.entries(modulePerms).forEach(([action, enabled]) => {
          if (enabled) {
            actions.add(action);
          }
        });
      }
    });

    return Array.from(actions);
  };

  const handleDelete = (roleId: string) => {
    setDeleteRoleId(roleId);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteRoleId) return;

    try {
      await deleteRole(deleteRoleId);
      setShowConfirm(false);
      setShowSuccess(true);

      // Refresh roles list after successful deletion
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      setShowConfirm(false);
      setError(err.message || 'Failed to delete role');
    }
  };

  const handleEdit = (role: Role) => {
    setEditRole(role);
    setOpenRoleModal(true);
  };

  const handleRoleSuccess = () => {
    // Refresh roles list after create/update
    setRefreshKey(prev => prev + 1);
  };

  // Filtered roles based on search and status
  const filteredRoles = useMemo(() => {
    return rolesData.filter((role) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        role.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.modules.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
        role.permissions.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status filter
      const matchesStatus =
        statusFilter === "" || role.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rolesData, searchQuery, statusFilter]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
  };

  return (
    <>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Roles Listing
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              placeholder="Search roles..."
              onSearch={setSearchQuery}
              className="w-full sm:w-64"
            />

            <button
              onClick={() => {
                setEditRole(null);
                setOpenRoleModal(true);
              }}
              className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add New
            </button>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <ErrorDisplay
            message={error}
            onRetry={fetchRoles}
          />
        )}

        {/* FILTERS */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border px-3 py-2 rounded-md text-sm w-full sm:w-auto"
          >
            <option value="">Filter by Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button
            onClick={handleClearFilters}
            className="bg-yellow-400 px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
          >
            Clear
          </button>
        </div>

        {/* TABLE */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[800px] rounded-xl border overflow-hidden bg-white">
            <div className="grid grid-cols-5 bg-yellow-400 px-4 py-3 text-sm font-medium">
              <span>Sl. No.</span>
              <span>Role</span>
              <span>Status</span>
              <span>Number of Staff</span>
              <span className="text-right">Actions</span>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <LoadingSpinner />
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No roles found. {(searchQuery || statusFilter) && "Try adjusting your filters."}
              </div>
            ) : (
              filteredRoles.map((role, index) => (
              <div
                key={role.id}
                className="grid grid-cols-5 px-4 py-4 text-sm border-b items-center even:bg-[#FFF8E7]"
              >
                <span className="font-medium">{index + 1}</span>

                <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-600 w-fit">
                  {role.role}
                </span>

                <span
                  className={`px-2 py-1 rounded-full text-xs w-fit ${
                    role.status === "Active"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {role.status}
                </span>

                <span className="font-medium">{role.staffCount}</span>

                <div className="flex justify-end">
                  <ActionsMenu
                    actions={["edit", "delete"]}
                    onEdit={() => handleEdit(role)}
                    onDelete={() => handleDelete(role.id)}
                  />
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {openRoleModal && (
        <CreateRoleModal
          defaultValues={editRole}
          onClose={() => {
            setOpenRoleModal(false);
            setEditRole(null);
          }}
          onSuccess={handleRoleSuccess}
        />
      )}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Delete Role</h2>
        <div className="flex justify-center mb-4">
          <img src={deleteIcon} alt="Success" className="w-16 h-16" />
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
      <Modal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Deleted!</h2>

        {/* IMAGE */}
        <div className="flex justify-center mb-4">
          <img src={deleteSuccessImg} alt="Success" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          Role has been successfully deleted.
        </p>
      </Modal>
    </>
  );
};

export default RolesPermissionsPage;
