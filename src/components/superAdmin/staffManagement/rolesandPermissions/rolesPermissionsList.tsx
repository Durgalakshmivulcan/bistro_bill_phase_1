import { useState, useMemo, useEffect } from "react";
import CreateRoleModal from "../../../Roles/CreateRoleModal";
import ActionsMenu from "../../../../components/form/ActionButtons";
import Modal from "../../../../components/ui/Modal";
import deleteIcon from "../../../../assets/deleteConformImg.png";
import deleteSuccessImg from "../../../../assets/deleteSuccessImg.png";
import { SearchInput, LoadingSpinner, ErrorDisplay } from "../../../../components/Common";
import { getRoles, deleteRole, type RoleResponse } from "../../../../services/staffService";
import Select from "../../../form/Select";
import Pagination from "../../../order-history/Pagination";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  getBusinessOwners,
  BusinessOwnerListItem,
} from "../../../../services/superAdminService";
import { getSelectedBoId, setSelectedBoId } from "../../../../services/saReportContext";

export interface Role {
  id: string;
  role: string;
  status: "Active" | "Inactive";
  staffCount: number;
  modules: string[];
  permissions: string[];
  permissionsMap: Record<string, Record<string, boolean>>;
}

const SuperAdminRolesPermissionsPage = () => {
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
  const { user } = useAuth();
  const isSuperAdmin = user?.userType === "SuperAdmin";
  const [selectedBo, setSelectedBo] = useState<string>(getSelectedBoId() || "");
  const [boList, setBoList] = useState<BusinessOwnerListItem[]>([]);
  const [boLoading, setBoLoading] = useState(false);

  // Fetch roles from API
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
    fetchRoles();
  }, [refreshKey, selectedBo, isSuperAdmin]);

  const fetchRoles = async () => {
    if (isSuperAdmin && !selectedBo) {
      setRolesData([]);
      setError("Select a restaurant context to load roles.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getRoles();

      if (response.data) {
        // Map backend RoleResponse to component Role interface
        const mappedRoles: Role[] = response.data.roles.map((role: RoleResponse) => ({
          id: role.id,
          role: role.name,
          status: String(role.status).toLowerCase() === "active" ? "Active" : "Inactive",
          staffCount: role.staffCount || 0,
          modules: extractModulesFromPermissions(role.permissions),
          permissions: extractPermissionActionsFromPermissions(role.permissions),
          permissionsMap: normalizePermissionMap(role.permissions),
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

  const normalizePermissionMap = (
    permissions: Record<string, unknown>
  ): Record<string, Record<string, boolean>> => {
    const normalized: Record<string, Record<string, boolean>> = {};
    Object.entries(permissions || {}).forEach(([module, value]) => {
      const modulePerms =
        typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
      normalized[module] = {
        Create: Boolean(modulePerms.create ?? modulePerms.Create),
        Edit: Boolean(modulePerms.edit ?? modulePerms.Edit),
        Delete: Boolean(modulePerms.delete ?? modulePerms.Delete),
        Show: Boolean(modulePerms.show ?? modulePerms.Show),
      };
    });
    return normalized;
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

  const handleBusinessOwnerChange = (boId: string) => {
    setSelectedBo(boId);
    setSelectedBoId(boId || null);
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
        statusFilter === "" || role.status.toLowerCase() === statusFilter.toLowerCase();

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
        {isSuperAdmin && (
          <div className="bg-white border rounded-lg p-4">
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
            <div className="w-full sm:w-auto">
              <Select
                value={statusFilter || "Filter by Status"}
                onChange={(val) =>
                  setStatusFilter(val === "Filter by Status" ? "" : val)
                }
                options={[
                  { label: "Filter by Status", value: "Filter by Status" },
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ]}
              />
            </div>
            <button
              onClick={handleClearFilters}
              className="bg-yellow-400 px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
            >
              Clear
            </button>
            <button
              onClick={() => {
                setEditRole(null);
                setOpenRoleModal(true);
              }}
              disabled={isSuperAdmin && !selectedBo}
              title={isSuperAdmin && !selectedBo ? "Select a restaurant first" : undefined}
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



        {/* TABLE */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[800px] rounded-xl border overflow-x-hidden bg-white">
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
                    className={`px-2 py-1 rounded-full text-xs w-fit ${role.status === "Active"
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
<div className="flex justify-end mt-6">
        <Pagination />
      </div>
      {/* CREATE / EDIT MODAL */}
      {openRoleModal && (
        <CreateRoleModal
          defaultValues={
            editRole
              ? {
                  ...editRole,
                  permissionsMap: editRole.permissionsMap,
                }
              : undefined
          }
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

export default SuperAdminRolesPermissionsPage;
