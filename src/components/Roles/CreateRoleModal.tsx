import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import tickImg from "../../assets/tick.png";
import { LoadingSpinner } from "../Common";
import {
  createRole,
  updateRole,
  type CreateRoleData,
  type UpdateRoleData,
} from "../../services/staffService";
import { CRUDToasts } from "../../utils/toast";

export interface Role {
  id?: string;
  role: string;
  modules: string[];
  permissions: string[];
  status?: string;
  permissionsMap?: Record<string, Record<string, boolean>>;
}

interface CreateRoleModalProps {
  onClose: () => void;
  defaultValues?: Role | null;
  onSuccess?: () => void;
}

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

const PERMISSIONS = ["Create", "Edit", "Delete", "Show"];

/* ================= HELPERS ================= */

const initializePermissions = () => {
  const initial: Record<string, Record<string, boolean>> = {};
  MODULES.forEach((m) => {
    initial[m] = {};
    PERMISSIONS.forEach((p) => {
      initial[m][p] = false;
    });
  });
  return initial;
};

const CreateRoleModal = ({
  onClose,
  defaultValues = null,
  onSuccess,
}: CreateRoleModalProps) => {
  const [successOpen, setSuccessOpen] = useState(false);
  const [roleName, setRoleName] = useState<string>("");
  const [status, setStatus] = useState<string>("Active");

  // ✅ NEW — independent states
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [permissionMap, setPermissionMap] = useState(() =>
    initializePermissions()
  );

  // API state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = Boolean(defaultValues && defaultValues.id);

  /* ================= PREFILL ================= */

  useEffect(() => {
    if (defaultValues) {
      setRoleName(defaultValues.role || "");
      setStatus(defaultValues.status || "Active");
      setSelectedModules(defaultValues.modules || []);

      const nextMap = initializePermissions();
      if (defaultValues.permissionsMap) {
        Object.entries(defaultValues.permissionsMap).forEach(([module, perms]) => {
          if (nextMap[module]) {
            nextMap[module].Create = Boolean(perms.Create ?? perms.create);
            nextMap[module].Edit = Boolean(perms.Edit ?? perms.edit);
            nextMap[module].Delete = Boolean(perms.Delete ?? perms.delete);
            nextMap[module].Show = Boolean(perms.Show ?? perms.show);
          }
        });
      }
      setPermissionMap(nextMap);
    } else {
      setRoleName("");
      setStatus("Active");
      setSelectedModules([]);
      setPermissionMap(initializePermissions());
    }
  }, [defaultValues]);

  useEffect(() => {
    if (!successOpen) return;

    const timer = setTimeout(() => {
      setSuccessOpen(false);
      onClose();
      onSuccess?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [successOpen, onClose, onSuccess]);

  /* ================= TOGGLES ================= */

  const togglePermission = (module: string, perm: string) => {
    setPermissionMap((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [perm]: !prev[module][perm],
      },
    }));
  };

  const toggleModule = (module: string) => {
    setSelectedModules((prev) =>
      prev.includes(module)
        ? prev.filter((m) => m !== module)
        : [...prev, module]
    );
  };

  const toggleSelectAll = () => {
    const allSelected = selectedModules.length === MODULES.length;

    if (allSelected) {
      setSelectedModules([]);
      setPermissionMap(initializePermissions());
    } else {
      setSelectedModules([...MODULES]);

      const updated = initializePermissions();
      MODULES.forEach((m) => {
        PERMISSIONS.forEach((p) => {
          updated[m][p] = true;
        });
      });

      setPermissionMap(updated);
    }
  };

  /* ================= CHECK HELPERS ================= */

  const isModuleChecked = (module: string) =>
    selectedModules.includes(module);

  const isAllSelected = selectedModules.length === MODULES.length;

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    if (!roleName.trim()) {
      setError("Role name is required");
      return;
    }

    if (selectedModules.length === 0) {
      setError("Please select at least one module");
      return;
    }

    const hasAnyPermission = Object.values(permissionMap).some((m) =>
      Object.values(m).some(Boolean)
    );

    if (!hasAnyPermission) {
      setError("Please select at least one permission");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ build payload correctly
      const permissionsObject: Record<string, Record<string, boolean>> = {};

      selectedModules.forEach((module) => {
        permissionsObject[module] = permissionMap[module];
      });

      if (isEditMode && defaultValues?.id) {
        const updateData: UpdateRoleData = {
          name: roleName,
          permissions: permissionsObject,
          status,
        };

        const response = await updateRole(defaultValues.id, updateData);
        if (!response.success) {
          setError(response.error?.message || "Failed to update role");
          return;
        }
        CRUDToasts.updated("Role");
      } else {
        const createData: CreateRoleData = {
          name: roleName,
          permissions: permissionsObject,
          status,
        };

        const response = await createRole(createData);
        if (!response.success) {
          setError(response.error?.message || "Failed to create role");
          return;
        }
        CRUDToasts.created("Role");
      }

      setSuccessOpen(true);
    } catch (err: any) {
      setError(err.message || "Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />

        <div className="relative w-full max-w-5xl bg-white rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-semibold mb-4">
            {isEditMode ? "Edit Role" : "Create New Role"}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ROLE NAME */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Role Name<span className="text-red-500">*</span>
            </label>
            <input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Role Name"
              className="w-full border rounded-md px-3 py-2 text-sm"
              disabled={loading}
            />
          </div>

          {/* STATUS */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Status<span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
              disabled={loading}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <h3 className="text-yellow-600 font-semibold mb-4">
            Assign Permissions to Role
          </h3>

          <div className="grid grid-cols-2 gap-6">
            {/* MODULE COLUMN */}
            <div>
              <span className="inline-block bg-yellow-100 px-3 py-1 rounded text-sm font-medium mb-3">
                MODULE
              </span>

              <label className="flex items-center gap-2 mb-4 font-medium">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                />
                Select All
              </label>

              {MODULES.map((module) => (
                <label
                  key={module}
                  className="flex items-center gap-2 mb-4 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={isModuleChecked(module)}
                    onChange={() => toggleModule(module)}
                    disabled={loading}
                  />
                  {module}
                </label>
              ))}
            </div>

            {/* PERMISSIONS COLUMN */}
            <div>
              <span className="inline-block bg-yellow-100 px-3 py-1 rounded text-sm font-medium mb-3">
                PERMISSIONS
              </span>

              <div className="mb-4 h-[28px]" />

              {MODULES.map((module) => (
                <div key={module} className="flex gap-8 mb-4 text-sm">
                  {PERMISSIONS.map((perm) => (
                    <label key={perm} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={permissionMap[module]?.[perm] || false}
                        onChange={() => togglePermission(module, perm)}
                        disabled={loading}
                      />
                      {perm}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={onClose}
              className="border px-6 py-2 rounded-md"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              className="bg-yellow-400 px-6 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading && <LoadingSpinner size="sm" />}
              {loading ? "Saving..." : isEditMode ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        className="w-[90%] max-w-md p-8 text-center z-[10000]"
      >
        <h2 className="text-2xl font-bold mb-6">
          {isEditMode ? "Role Updated" : "Role Created"}
        </h2>

        <div className="flex justify-center mb-6">
          <img src={tickImg} alt="Success" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          {isEditMode
            ? "Role updated successfully."
            : "New role created successfully."}
        </p>
      </Modal>
    </>
  );
};

export default CreateRoleModal;
