import DashboardLayout from "../layout/DashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Modal from "../components/ui/Modal";
import Input from "../components/form/Input";
import LoadingSpinner from "../components/Common/LoadingSpinner";

// Images
import createSuccessImg from "../assets/tick.png";
import updateSuccessImg from "../assets/tick.png";
import activateImg from "../assets/activated.png";
import deactivateImg from "../assets/deactivated.png";

// API Services
import { getRole, createRole, updateRole, CreateRoleData, UpdateRoleData } from "../services/staffService";

type SuccessType = "create" | "edit" | "activate" | "deactivate" | null;

// Permission structure for each module
interface ModulePermissions {
  create: boolean;
  edit: boolean;
  delete: boolean;
  show: boolean;
}

const StaffCreateRolePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // MODES
  const isEditMode = window.location.pathname.includes("/edit");
  const isViewMode = window.location.pathname.includes("/view");

  // FORM STATE
  const [roleName, setRoleName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [modules, setModules] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<Record<string, ModulePermissions>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);

  // MODALS
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] =
    useState<SuccessType>(null);

  // ---------------- EFFECTS ----------------

  // Load role data in edit/view mode
  useEffect(() => {
    const loadRoleData = async () => {
      if ((isEditMode || isViewMode) && id) {
        setLoadingRole(true);
        try {
          const response = await getRole(id);
          if (response.success && response.data) {
            const roleData = response.data;
            setRoleName(roleData.name);
            setIsActive(roleData.status === "Active");

            // Parse permissions object
            const perms = roleData.permissions as Record<string, ModulePermissions>;
            setPermissions(perms);

            // Set modules that are selected (have at least one permission enabled)
            const selectedModules = Object.keys(perms).filter(module => {
              const modulePerm = perms[module];
              return modulePerm.create || modulePerm.edit || modulePerm.delete || modulePerm.show;
            });
            setModules(selectedModules);
          } else {
            setError(response.error?.message || "Failed to load role data");
          }
        } catch (err) {
          console.error("Error loading role:", err);
          setError("Failed to load role data");
        } finally {
          setLoadingRole(false);
        }
      }
    };

    loadRoleData();
  }, [id, isEditMode, isViewMode]);

  // ---------------- HANDLERS ----------------

  const validateForm = () => {
    if (!roleName) {
      setError("Please enter a role name.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      // Build permissions object from modules and permissions state
      const permissionsData: Record<string, ModulePermissions> = {};
      modules.forEach(module => {
        permissionsData[module] = permissions[module] || {
          create: false,
          edit: false,
          delete: false,
          show: false,
        };
      });

      if (isEditMode && id) {
        // Update existing role
        const updateData: UpdateRoleData = {
          name: roleName,
          permissions: permissionsData,
          status: isActive ? "Active" : "Inactive",
        };

        const response = await updateRole(id, updateData);
        if (response.success) {
          setShowSuccess("edit");
        } else {
          setError(response.error?.message || "Failed to update role");
        }
      } else {
        // Create new role
        const createData: CreateRoleData = {
          name: roleName,
          permissions: permissionsData,
          status: "Active",
        };

        const response = await createRole(createData);
        if (response.success) {
          setShowSuccess("create");
        } else {
          setError(response.error?.message || "Failed to create role");
        }
      }
    } catch (err) {
      console.error("Error saving role:", err);
      setError("An error occurred while saving the role");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = () => {
    setShowConfirm(true);
  };

  const confirmToggleStatus = async () => {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const newStatus = !isActive;
      const updateData: UpdateRoleData = {
        status: newStatus ? "Active" : "Inactive",
      };

      const response = await updateRole(id, updateData);
      if (response.success) {
        setIsActive(newStatus);
        setShowConfirm(false);
        setShowSuccess(newStatus ? "activate" : "deactivate");
      } else {
        setError(response.error?.message || "Failed to update role status");
        setShowConfirm(false);
      }
    } catch (err) {
      console.error("Error toggling role status:", err);
      setError("An error occurred while updating the role status");
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (module: string) => {
    setModules((prev) => {
      const newModules = prev.includes(module)
        ? prev.filter((m) => m !== module)
        : [...prev, module];

      // Initialize permissions for newly added module
      if (!prev.includes(module)) {
        setPermissions(prevPerms => ({
          ...prevPerms,
          [module]: {
            create: false,
            edit: false,
            delete: false,
            show: false,
          }
        }));
      }

      return newModules;
    });
  };

  const togglePermission = (module: string, permission: keyof ModulePermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: !prev[module]?.[permission],
      },
    }));
  };

  // ---------------- HELPERS ----------------

  const getSuccessTitle = () => {
    switch (showSuccess) {
      case "create":
        return "Role Created";
      case "edit":
        return "Role Updated";
      case "activate":
        return "Role Activated";
      case "deactivate":
        return "Role Deactivated";
      default:
        return "Success";
    }
  };

  const getSuccessMessage = () => {
    switch (showSuccess) {
      case "create":
        return "New role created successfully.";
      case "edit":
        return "Role updated successfully.";
      case "activate":
        return "Role activated successfully.";
      case "deactivate":
        return "Role deactivated successfully.";
      default:
        return "";
    }
  };

  const getSuccessImage = () => {
    switch (showSuccess) {
      case "create":
        return createSuccessImg;
      case "edit":
        return updateSuccessImg;
      case "activate":
        return activateImg;
      case "deactivate":
        return deactivateImg;
      default:
        return "";
    }
  };

  const MODULES = [
    "Dashboard",
    "Business Owners",
    "Subscription Plans",
    "Orders",
    "Contact Requests",
    "Staff Management",
    "Master Data",
    "Settings",
  ];

  // ---------------- RENDER ----------------

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#FFFDF5] min-h-screen">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-semibold">
              {isViewMode
                ? "View Role"
                : isEditMode
                ? "Edit Role"
                : "Create New Role"}
            </h1>

            {(isEditMode || isViewMode) && (
              <button
                onClick={handleToggleStatus}
                disabled={loading || loadingRole}
                className={`px-6 py-2 rounded-md font-medium disabled:opacity-50 ${
                  isActive
                    ? "bg-black text-white"
                    : "bg-green-600 text-white"
                }`}
              >
                {loading ? "Updating..." : isActive ? "Deactivate" : "Activate"}
              </button>
            )}
          </div>

          {/* LOADING STATE */}
          {loadingRole && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" message="Loading role data..." />
            </div>
          )}

          {/* CARD */}
          {!loadingRole && (
          <div className="rounded-xl p-6 space-y-8">

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* ROLE NAME */}
            <div className="max-w-md">
              <Input
                label="Role Name"
                required
                disabled={isViewMode}
                value={roleName}
                onChange={(val) => setRoleName(val)}
              />
            </div>

            {/* PERMISSIONS */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-yellow-600">
                Assign Permissions to Role
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* MODULES */}
                <div>
                  <div className="inline-block bg-yellow-100 px-4 py-1 font-semibold mb-4 rounded">
                    MODULES
                  </div>

                  <div className="space-y-3">
                    {MODULES.map((module) => (
                      <label
                        key={module}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          disabled={isViewMode}
                          checked={modules.includes(module)}
                          onChange={() =>
                            toggleModule(module)
                          }
                        />
                        {module}
                      </label>
                    ))}
                  </div>
                </div>

                {/* PERMISSIONS */}
                <div>
                  <div className="inline-block bg-yellow-100 px-4 py-1 font-semibold mb-4 rounded">
                    PERMISSIONS
                  </div>

                  <div className="space-y-4">
                    {MODULES.map((module) => (
                      <div
                        key={module}
                        className="grid grid-cols-2 md:grid-cols-4 gap-3"
                      >
                        {(["create", "edit", "delete", "show"] as const).map(
                          (perm) => (
                            <label
                              key={perm}
                              className="flex items-center gap-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                disabled={isViewMode || !modules.includes(module)}
                                checked={!!permissions[module]?.[perm]}
                                onChange={() => togglePermission(module, perm)}
                              />
                              {perm.charAt(0).toUpperCase() + perm.slice(1)}
                            </label>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col md:flex-row md:justify-end gap-4 pt-6">
              <button
                onClick={() =>
                  navigate(-1)
                }
                className="border px-6 py-2 rounded-md"
                disabled={loading}
              >
                Cancel
              </button>

              {!isViewMode && (
                <button
                  onClick={handleSubmit}
                  className="bg-yellow-400 px-6 py-2 rounded-md font-medium disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Saving..." : isEditMode ? "Update" : "Create"}
                </button>
              )}
            </div>
          </div>
          )}
        </div>

        {/* CONFIRM MODAL */}
        {showConfirm && (
          <Modal
            open={showConfirm}
            onClose={() => setShowConfirm(false)}
            className="w-[90%] max-w-md p-6 text-center"
          >
            <h2 className="text-2xl font-bold mb-4">
              {isActive
                ? "Deactivate Role"
                : "Activate Role"}
            </h2>

            <div className="flex justify-center mb-4">
              <img
                src={getSuccessImage()}
                alt="confirm"
                className="w-16 h-16"
              />
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to{" "}
              {isActive ? "deactivate" : "activate"} this role?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="border px-6 py-2 rounded"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                onClick={confirmToggleStatus}
                className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Processing..." : "Yes"}
              </button>
            </div>
          </Modal>
        )}

        {/* SUCCESS MODAL */}
        {showSuccess && (
          <Modal
            open={true}
            onClose={() => {
              setShowSuccess(null);
              navigate(-1);
            }}
            className="w-[90%] max-w-md p-6 text-center"
          >
            <h2 className="text-2xl font-bold mb-4">
              {getSuccessTitle()}
            </h2>

            <div className="flex justify-center mb-4">
              <img
                src={getSuccessImage()}
                alt="success"
                className="w-16 h-16"
              />
            </div>

            <p className="text-sm text-gray-600">
              {getSuccessMessage()}
            </p>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffCreateRolePage;
