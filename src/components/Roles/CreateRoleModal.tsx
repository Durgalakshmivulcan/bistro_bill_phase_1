import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import tickImg from "../../assets/tick.png";
import { LoadingSpinner } from "../Common";
import { createRole, updateRole, getRole, type CreateRoleData, type UpdateRoleData } from "../../services/staffService";
import { CRUDToasts } from "../../utils/toast";

export interface Role {
  id?: string;
  role: string;
  modules: string[];
  permissions: string[];
  status?: string;
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

const CreateRoleModal = ({
  onClose,
  defaultValues = null,
  onSuccess,
}: CreateRoleModalProps) => {
  const [successOpen, setSuccessOpen] = useState(false);
  const [roleName, setRoleName] = useState<string>("");
  const [modules, setModules] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("Active");

  // API state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = Boolean(defaultValues && defaultValues.id);

  // ================= PREFILL =================
  useEffect(() => {
    if (defaultValues) {
      setRoleName(defaultValues.role || "");
      setModules(defaultValues.modules || []);
      setPermissions(defaultValues.permissions || []);
      setStatus(defaultValues.status || "Active");
    } else {
      setRoleName("");
      setModules([]);
      setPermissions([]);
      setStatus("Active");
    }
  }, [defaultValues]);

  useEffect(() => {
    if (!successOpen) return;

    const timer = setTimeout(() => {
      setSuccessOpen(false);
      onClose(); // close main modal too
      if (onSuccess) {
        onSuccess(); // trigger parent refresh
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [successOpen, onClose, onSuccess]);


  // ================= HELPERS =================
  const toggleItem = (
    value: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setList((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

const handleSubmit = async () => {
  // Validation
  if (!roleName.trim()) {
    setError("Role name is required");
    return;
  }

  if (modules.length === 0) {
    setError("Please select at least one module");
    return;
  }

  if (permissions.length === 0) {
    setError("Please select at least one permission");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    // Build permissions object from selected modules and permissions
    // Structure: { module: { action: boolean } }
    const permissionsObject: Record<string, Record<string, boolean>> = {};

    modules.forEach(module => {
      permissionsObject[module] = {};
      permissions.forEach(permission => {
        permissionsObject[module][permission] = true;
      });
    });

    if (isEditMode && defaultValues?.id) {
      // Update existing role
      const updateData: UpdateRoleData = {
        name: roleName,
        permissions: permissionsObject,
        status,
      };

      await updateRole(defaultValues.id, updateData);
      CRUDToasts.updated("Role");
    } else {
      // Create new role
      const createData: CreateRoleData = {
        name: roleName,
        permissions: permissionsObject,
        status,
      };

      await createRole(createData);
      CRUDToasts.created("Role");
    }

    setSuccessOpen(true);
  } catch (err: any) {
    setError(err.message || 'Failed to save role');
  } finally {
    setLoading(false);
  }
};


  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />

        <div className="relative w-full max-w-5xl bg-white rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          {/* TITLE */}
          <h2 className="text-2xl font-semibold mb-4">
            {isEditMode ? "Edit Role" : "Create New Role"}
          </h2>

          {/* ERROR MESSAGE */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MODULES */}
            <div>
              <span className="inline-block bg-yellow-100 px-3 py-1 rounded text-sm font-medium mb-3">
                MODULE
              </span>

              {MODULES.map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-2 mb-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={modules.includes(item)}
                    onChange={() => toggleItem(item, modules, setModules)}
                    disabled={loading}
                  />
                  {item}
                </label>
              ))}
            </div>

            {/* PERMISSIONS */}
            <div>
              <span className="inline-block bg-yellow-100 px-3 py-1 rounded text-sm font-medium mb-3">
                PERMISSIONS
              </span>

              {PERMISSIONS.map((perm) => (
                <label
                  key={perm}
                  className="flex items-center gap-2 mb-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={permissions.includes(perm)}
                    onChange={() =>
                      toggleItem(perm, permissions, setPermissions)
                    }
                    disabled={loading}
                  />
                  {perm}
                </label>
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
              className="bg-yellow-400 px-6 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading && <LoadingSpinner size="sm" />}
              {loading ? "Saving..." : (isEditMode ? "Update" : "Create")}
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
