import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import Modal from "../../components/ui/Modal";
import { TableSkeleton, LoadingSpinner, ErrorDisplay } from "../../components/Common";
import {
  getRoles,
  deleteRole,
  createRole,
  updateRole,
  getStaff,
  updateStaff,
  type RoleResponse,
  type RoleListResponse,
  type CreateRoleData,
  type UpdateRoleData,
  type Staff,
  type StaffListResponse,
} from "../../services/staffService";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Shield,
  Plus,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import deleteIcon from "../../assets/deleteConformImg.png";
import deleteSuccessImg from "../../assets/deleteSuccessImg.png";

// ============================================
// Constants
// ============================================

const MODULES = [
  "Dashboard",
  "Point of Sale",
  "All Orders",
  "Reservations",
  "Catalogs",
  "Manage Resources",
  "Marketing",
  "Branches",
  "Multiple Kitchens",
  "Administration",
  "Customers",
  "Inventory",
  "Analytics & Reports",
  "Purchase Orders",
  "Activity Logs",
];

const ACTIONS = ["create", "read", "update", "delete", "approve", "export"];

const ACTION_LABELS: Record<string, string> = {
  create: "Create",
  read: "Read",
  update: "Update",
  delete: "Delete",
  approve: "Approve",
  export: "Export",
};

// ============================================
// Types
// ============================================

interface RoleFormData {
  name: string;
  status: string;
  permissions: Record<string, Record<string, boolean>>;
}

// ============================================
// Create/Edit Role Modal
// ============================================

interface RoleModalProps {
  open: boolean;
  onClose: () => void;
  editingRole: RoleResponse | null;
  onSave: (data: CreateRoleData | UpdateRoleData, roleId?: string) => Promise<void>;
  saving: boolean;
}

const RoleModal: React.FC<RoleModalProps> = ({
  open,
  onClose,
  editingRole,
  onSave,
  saving,
}) => {
  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    status: "active",
    permissions: {},
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editingRole) {
        const perms = editingRole.permissions as Record<string, Record<string, boolean>> || {};
        setFormData({
          name: editingRole.name,
          status: editingRole.status,
          permissions: perms,
        });
      } else {
        setFormData({ name: "", status: "active", permissions: {} });
      }
      setError(null);
    }
  }, [open, editingRole]);

  const togglePermission = (module: string, action: string) => {
    setFormData((prev) => {
      const newPerms = { ...prev.permissions };
      if (!newPerms[module]) {
        newPerms[module] = {};
      }
      newPerms[module] = {
        ...newPerms[module],
        [action]: !newPerms[module][action],
      };
      return { ...prev, permissions: newPerms };
    });
  };

  const toggleModuleAll = (module: string) => {
    setFormData((prev) => {
      const newPerms = { ...prev.permissions };
      const currentModulePerms = newPerms[module] || {};
      const allChecked = ACTIONS.every((a) => currentModulePerms[a]);
      newPerms[module] = {};
      ACTIONS.forEach((a) => {
        newPerms[module][a] = !allChecked;
      });
      return { ...prev, permissions: newPerms };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Role name is required");
      return;
    }

    const hasAnyPermission = Object.values(formData.permissions).some((mp) =>
      Object.values(mp).some((v) => v)
    );
    if (!hasAnyPermission) {
      setError("Please assign at least one permission");
      return;
    }

    try {
      if (editingRole) {
        await onSave(
          {
            name: formData.name,
            permissions: formData.permissions,
            status: formData.status,
          } as UpdateRoleData,
          editingRole.id
        );
      } else {
        await onSave({
          name: formData.name,
          permissions: formData.permissions,
          status: formData.status,
        } as CreateRoleData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save role");
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-5xl p-6 max-h-[90vh] overflow-y-auto">
      <h3 className="text-lg font-semibold text-bb-text mb-4">
        {editingRole ? "Edit Role" : "Create New Role"}
      </h3>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-bb-text mb-1">
              Role Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Branch Manager"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-bb-primary focus:border-bb-primary"
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bb-text mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-bb-primary focus:border-bb-primary"
              disabled={saving}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Permission Assignment Grid */}
        <div>
          <h4 className="text-sm font-semibold text-bb-text mb-3 flex items-center gap-2">
            <Shield size={16} />
            Permission Assignment
          </h4>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bb-primary/20">
                  <th className="text-left px-3 py-2 font-medium text-bb-text border-b">
                    Module
                  </th>
                  {ACTIONS.map((action) => (
                    <th
                      key={action}
                      className="px-3 py-2 font-medium text-bb-text border-b text-center"
                    >
                      {ACTION_LABELS[action]}
                    </th>
                  ))}
                  <th className="px-3 py-2 font-medium text-bb-text border-b text-center">
                    All
                  </th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map((module, idx) => {
                  const modulePerms = formData.permissions[module] || {};
                  const allChecked = ACTIONS.every((a) => modulePerms[a]);
                  return (
                    <tr
                      key={module}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-3 py-2 text-bb-text font-medium border-b">
                        {module}
                      </td>
                      {ACTIONS.map((action) => (
                        <td
                          key={action}
                          className="px-3 py-2 text-center border-b"
                        >
                          <input
                            type="checkbox"
                            checked={!!modulePerms[action]}
                            onChange={() => togglePermission(module, action)}
                            disabled={saving}
                            className="w-4 h-4 accent-bb-primary"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center border-b">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          onChange={() => toggleModuleAll(module)}
                          disabled={saving}
                          className="w-4 h-4 accent-bb-primary"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-bb-text hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-bb-primary text-bb-text rounded-lg text-sm font-medium hover:bg-bb-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : editingRole ? (
              "Update Role"
            ) : (
              "Create Role"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ============================================
// Assign Role Tab
// ============================================

interface AssignRoleTabProps {
  roles: RoleResponse[];
}

const AssignRoleTab: React.FC<AssignRoleTabProps> = ({ roles }) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getStaff();
      if (response.success && response.data) {
        setStaffList((response.data as StaffListResponse).staff);
      }
    } catch {
      setError("Failed to load staff members");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleRoleChange = async (staffId: string, newRoleId: string) => {
    try {
      setUpdatingId(staffId);
      setError(null);
      const response = await updateStaff(staffId, { roleId: newRoleId });
      if (response.success) {
        setStaffList((prev) =>
          prev.map((s) => {
            if (s.id === staffId) {
              const newRole = roles.find((r) => r.id === newRoleId);
              return {
                ...s,
                roleId: newRoleId,
                roleName: newRole?.name || s.roleName,
              };
            }
            return s;
          })
        );
        setSuccessMsg("Role updated successfully");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch {
      setError("Failed to update staff role");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {staffList.length === 0 ? (
        <div className="text-center py-12 text-bb-textSoft">
          No staff members found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bb-primary/20">
                <th className="text-left px-4 py-3 font-medium text-bb-text">
                  Staff Member
                </th>
                <th className="text-left px-4 py-3 font-medium text-bb-text">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-medium text-bb-text">
                  Branch
                </th>
                <th className="text-left px-4 py-3 font-medium text-bb-text">
                  Current Role
                </th>
                <th className="text-left px-4 py-3 font-medium text-bb-text">
                  Change Role
                </th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff, idx) => (
                <tr
                  key={staff.id}
                  className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  <td className="px-4 py-3 font-medium text-bb-text">
                    {staff.firstName} {staff.lastName}
                  </td>
                  <td className="px-4 py-3 text-bb-textSoft">{staff.email}</td>
                  <td className="px-4 py-3 text-bb-textSoft">
                    {staff.branchName || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-600">
                      {staff.roleName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={staff.roleId}
                        onChange={(e) =>
                          handleRoleChange(staff.id, e.target.value)
                        }
                        disabled={updatingId === staff.id}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-bb-primary focus:border-bb-primary disabled:opacity-50"
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                      {updatingId === staff.id && (
                        <Loader2
                          size={14}
                          className="animate-spin text-bb-textSoft"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ============================================
// Main Component
// ============================================

const RoleManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"roles" | "assign">("roles");
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRoles();
      if (response.success && response.data) {
        setRoles((response.data as RoleListResponse).roles);
      }
    } catch {
      setError("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSaveRole = async (
    data: CreateRoleData | UpdateRoleData,
    roleId?: string
  ) => {
    try {
      setSaving(true);
      if (roleId) {
        const response = await updateRole(roleId, data as UpdateRoleData);
        if (response.success) {
          setSaveSuccess("Role updated successfully");
        }
      } else {
        const response = await createRole(data as CreateRoleData);
        if (response.success) {
          setSaveSuccess("Role created successfully");
        }
      }
      setModalOpen(false);
      setEditingRole(null);
      await fetchRoles();
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch {
      throw new Error("Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (roleId: string) => {
    setDeleteRoleId(roleId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteRoleId) return;
    try {
      setDeleting(true);
      const response = await deleteRole(deleteRoleId);
      if (response.success) {
        setShowDeleteConfirm(false);
        setShowDeleteSuccess(true);
        await fetchRoles();
        setTimeout(() => setShowDeleteSuccess(false), 2000);
      }
    } catch {
      setShowDeleteConfirm(false);
      setError("Failed to delete role. It may have staff assigned.");
    } finally {
      setDeleting(false);
    }
  };

  const getPermissionSummary = (
    permissions: Record<string, unknown>
  ): string[] => {
    const modules: string[] = [];
    Object.entries(permissions || {}).forEach(([module, perms]) => {
      if (typeof perms === "object" && perms !== null) {
        const enabledActions = Object.entries(perms as Record<string, boolean>)
          .filter(([, enabled]) => enabled)
          .map(([action]) => action);
        if (enabledActions.length > 0) {
          modules.push(module);
        }
      }
    });
    return modules;
  };

  return (
    <DashboardLayout>
      <div className="bb-shell">
        <div className="bb-frame flex flex-col">
          <main className="flex-1 bg-[#FFFBF3] px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-bb-primary/20 rounded-lg flex items-center justify-center">
                  <Shield size={20} className="text-bb-text" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-bb-text">
                    Role Management
                  </h1>
                  <p className="text-sm text-bb-textSoft">
                    Manage roles, permissions, and staff assignments
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchRoles}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-bb-text hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
                {activeTab === "roles" && (
                  <button
                    onClick={() => {
                      setEditingRole(null);
                      setModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-bb-primary text-bb-text rounded-lg text-sm font-medium hover:bg-bb-primary/90"
                  >
                    <Plus size={14} />
                    Create Role
                  </button>
                )}
              </div>
            </div>

            {/* Success Banner */}
            {saveSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 size={16} />
                <span>{saveSuccess}</span>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
                <AlertCircle size={16} />
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700 text-xs"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-6 border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab("roles")}
                className={`pb-3 text-sm font-medium ${
                  activeTab === "roles"
                    ? "text-black border-b-2 border-black"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Shield size={14} />
                  Roles
                </span>
              </button>
              <button
                onClick={() => setActiveTab("assign")}
                className={`pb-3 text-sm font-medium ${
                  activeTab === "assign"
                    ? "text-black border-b-2 border-black"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Users size={14} />
                  Assign Role
                </span>
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "roles" && (
              <>
                {loading ? (
                  <TableSkeleton />
                ) : roles.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border">
                    <Shield
                      size={48}
                      className="mx-auto text-gray-300 mb-4"
                    />
                    <p className="text-bb-textSoft mb-2">No roles created yet</p>
                    <p className="text-xs text-gray-400 mb-4">
                      Create a role to define permissions for your staff
                    </p>
                    <button
                      onClick={() => {
                        setEditingRole(null);
                        setModalOpen(true);
                      }}
                      className="px-4 py-2 bg-bb-primary text-bb-text rounded-lg text-sm font-medium hover:bg-bb-primary/90"
                    >
                      Create First Role
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border bg-white">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-bb-primary/20">
                          <th className="text-left px-4 py-3 font-medium text-bb-text">
                            Name
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-bb-text">
                            Status
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-bb-text">
                            Users Assigned
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-bb-text">
                            Modules
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-bb-text">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map((role, idx) => {
                          const modules = getPermissionSummary(
                            role.permissions
                          );
                          return (
                            <tr
                              key={role.id}
                              className={`border-b ${
                                idx % 2 === 0 ? "bg-white" : "bg-[#FFF8E7]"
                              }`}
                            >
                              <td className="px-4 py-3 font-medium text-bb-text">
                                {role.name}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    role.status === "active"
                                      ? "bg-green-100 text-green-600"
                                      : "bg-red-100 text-red-600"
                                  }`}
                                >
                                  {role.status === "active"
                                    ? "Active"
                                    : "Inactive"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-bb-textSoft">
                                <span className="flex items-center gap-1">
                                  <Users size={14} />
                                  {role.staffCount}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {modules.slice(0, 3).map((m) => (
                                    <span
                                      key={m}
                                      className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600"
                                    >
                                      {m}
                                    </span>
                                  ))}
                                  {modules.length > 3 && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
                                      +{modules.length - 3} more
                                    </span>
                                  )}
                                  {modules.length === 0 && (
                                    <span className="text-xs text-gray-400">
                                      No permissions
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingRole(role);
                                      setModalOpen(true);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(role.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === "assign" && <AssignRoleTab roles={roles} />}
          </main>
        </div>
      </div>

      {/* Create/Edit Role Modal */}
      <RoleModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRole(null);
        }}
        editingRole={editingRole}
        onSave={handleSaveRole}
        saving={saving}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Delete Role</h2>
        <div className="flex justify-center mb-4">
          <img src={deleteIcon} alt="Delete" className="w-16 h-16" />
        </div>
        <p className="text-sm text-gray-600 mb-6">
          This action cannot be undone. <br />
          Do you want to proceed with deletion?
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="border px-6 py-2 rounded"
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="bg-yellow-400 px-6 py-2 rounded font-medium flex items-center gap-2 disabled:opacity-50"
            disabled={deleting}
          >
            {deleting && <Loader2 size={14} className="animate-spin" />}
            {deleting ? "Deleting..." : "Yes"}
          </button>
        </div>
      </Modal>

      {/* Delete Success Modal */}
      <Modal
        open={showDeleteSuccess}
        onClose={() => setShowDeleteSuccess(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Deleted!</h2>
        <div className="flex justify-center mb-4">
          <img src={deleteSuccessImg} alt="Success" className="w-16 h-16" />
        </div>
        <p className="text-sm text-gray-600">
          Role has been successfully deleted.
        </p>
      </Modal>
    </DashboardLayout>
  );
};

export default RoleManagement;
