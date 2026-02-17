import DashboardLayout from "../layout/DashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import Modal from "../components/ui/Modal";
import Input from "../components/form/Input";
import Select from "../components/form/Select";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import { User } from "lucide-react";

// Images
import createSuccessImg from "../assets/tick.png";
import updateSuccessImg from "../assets/tick.png";
import activateImg from "../assets/activated.png";
import deactivateImg from "../assets/deactivated.png";
import conformImg from "../assets/activate-success.png";

// API Services
import {
  createStaff,
  updateStaff,
  getStaffMember,
  toggleStatus as toggleStaffStatus,
  getRoles
} from "../services/staffService";
import { useBranch } from "../contexts/BranchContext";

type SuccessType = "create" | "edit" | "activate" | "deactivate" | null;

const STAFF_LIST_ROUTE = "/manage-resources/staff";

const StaffCreatePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentBranchId } = useBranch();

  // MODES
  const isEditMode = window.location.pathname.includes("/edit");
  const isViewMode = window.location.pathname.includes("/view");

  // FORM STATE
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("Select Staff Role");
  const [branchId, setBranchId] = useState("");

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  // UI STATE
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<SuccessType>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Data
  const [roles, setRoles] = useState<{ label: string; value: string }[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);

  // Load staff data in edit/view mode
  useEffect(() => {
    if ((isEditMode || isViewMode) && id) {
      loadStaffData(id);
    }
  }, [id, isEditMode, isViewMode]);

  // Load roles for dropdown
  useEffect(() => {
    loadRoles();
  }, []);

  const loadStaffData = async (staffId: string) => {
    setLoadingStaff(true);
    try {
      const response = await getStaffMember(staffId);
      if (response.success && response.data) {
        const staff = response.data;
        setFirstName(staff.firstName);
        setLastName(staff.lastName);
        setEmail(staff.email);
        setPhone(staff.phone || "");
        setRoleId(staff.roleId);
        setBranchId(staff.branchId);
        setImagePreview(staff.avatar);
        setIsActive(staff.status.toLowerCase() === "active");
      } else {
        setError(response.error?.message || "Failed to load staff data");
      }
    } catch (err) {
      setError("Failed to load staff data");
      console.error("Error loading staff:", err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await getRoles("active");
      if (response.success && response.data) {
        const roleOptions = response.data.roles.map((role) => ({
          label: role.name,
          value: role.id,
        }));
        setRoles([
          { label: "Select Staff Role", value: "Select Staff Role" },
          ...roleOptions,
        ]);

        // Use branch from BranchContext if not already set
        if (!branchId && currentBranchId) {
          setBranchId(currentBranchId);
        }
      }
    } catch (err) {
      console.error("Error loading roles:", err);
    }
  };

  // ---------------- HANDLERS ----------------

  const validateForm = () => {
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      roleId === "Select Staff Role"
    ) {
      setError("Please fill all required fields.");
      return false;
    }

    // Password required for create mode
    if (!isEditMode && !password) {
      setError("Password is required for new staff.");
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
      if (isEditMode && id) {
        // Update existing staff
        const updateData: any = {
          firstName,
          lastName,
          email,
          phone,
          roleId,
          branchId,
        };

        if (password) {
          updateData.password = password;
        }

        if (imagePreview) {
          updateData.avatar = imagePreview;
        }

        const response = await updateStaff(id, updateData);

        if (response.success) {
          setSuccessType("edit");
          setShowSuccess(true);
        } else {
          setError(response.error?.message || "Failed to update staff");
        }
      } else {
        // Create new staff
        const createData = {
          firstName,
          lastName,
          email,
          phone,
          password,
          roleId,
          branchId,
          avatar: imagePreview || undefined,
          status: "Active",
        };

        const response = await createStaff(createData);

        if (response.success) {
          setSuccessType("create");
          setShowSuccess(true);
        } else {
          setError(response.error?.message || "Failed to create staff");
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error submitting form:", err);
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
    setShowConfirm(false);

    try {
      const newStatus = !isActive;
      const statusValue = newStatus ? "Active" : "Inactive";

      const response = await toggleStaffStatus(id, statusValue);

      if (response.success) {
        setIsActive(newStatus);
        setSuccessType(newStatus ? "activate" : "deactivate");
        setShowSuccess(true);
      } else {
        setError(response.error?.message || "Failed to toggle status");
      }
    } catch (err) {
      setError("Failed to toggle status");
      console.error("Error toggling status:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- HELPERS ----------------

  const getSuccessTitle = () => {
    switch (successType) {
      case "create":
        return "Staff Created";
      case "edit":
        return "Staff Updated";
      case "activate":
        return "Staff Activated";
      case "deactivate":
        return "Staff Deactivated";
      default:
        return "Success";
    }
  };

  const getSuccessMessage = () => {
    switch (successType) {
      case "create":
        return "New staff member added successfully.";
      case "edit":
        return "Staff details updated successfully.";
      case "activate":
        return "Staff activated successfully.";
      case "deactivate":
        return "Staff deactivated successfully.";
      default:
        return "";
    }
  };

  const getSuccessImage = () => {
    switch (successType) {
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

  // ---------------- RENDER ----------------

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#FFFDF5] min-h-screen">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-semibold">
              {isViewMode
                ? "View Staff"
                : isEditMode
                  ? "Edit Staff"
                  : "Create New Staff"}
            </h1>
          </div>

          {/* CARD */}
          <div className="rounded-xl p-6 space-y-8">
            {/* PROFILE */}
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-32 h-32 rounded-full border-[8px] border-gray-300 flex items-center justify-center text-gray-400">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    className="w-full h-full rounded-full object-cover"
                    alt="profile"
                  />
                ) : (
                  <User size={64} />
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/png, image/jpeg"
                disabled={isViewMode}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
              />

              <div>
                <p className="font-medium">Upload Profile Picture</p>
                <p className="text-sm text-gray-500 mb-2">
                  JPG or PNG format only
                </p>

                <div className="flex gap-3">
                  {!isViewMode && (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="bg-yellow-400 px-4 py-2 rounded-md"
                    >
                      Upload
                    </button>
                  )}

                  {!isViewMode && (
                    <button
                      onClick={() => setImagePreview(null)}
                      className="border px-4 py-2 rounded-md"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            {loadingStaff && (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" message="Loading staff data..." />
              </div>
            )}

            {/* FORM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="First Name"
                required
                disabled={isViewMode || loadingStaff}
                value={firstName}
                onChange={(val) => setFirstName(val)}
              />

              <Input
                label="Last Name"
                required
                disabled={isViewMode || loadingStaff}
                value={lastName}
                onChange={(val) => setLastName(val)}
              />

              <Input
                label="Email Address"
                required
                disabled={isViewMode || loadingStaff}
                value={email}
                onChange={(val) => setEmail(val)}
              />

              <Input
                label="Phone Number"
                required
                disabled={isViewMode || loadingStaff}
                value={phone}
                onChange={(val) => setPhone(val)}
              />

              <Input
                label="Password"
                type="password"
                required={!isEditMode}
                disabled={isViewMode || loadingStaff}
                value={password}
                onChange={(val) => setPassword(val)}
                placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password"}
              />

              <div>
                <Select
                  label="Role"
                  required
                  disabled={isViewMode || loadingStaff}
                  value={roleId}
                  onChange={(val) => setRoleId(val)}
                  options={roles}
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-4 pt-4">
              {(isEditMode || isViewMode) && (
                <button
                  onClick={handleToggleStatus}
                  disabled={loading || loadingStaff}
                  className={`px-6 py-2 rounded-md font-medium ${
                    isActive ? "bg-black text-white" : "bg-green-600 text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? "Processing..." : isActive ? "Deactivate" : "Activate"}
                </button>
              )}
              <button
                onClick={() => navigate(STAFF_LIST_ROUTE)}
                disabled={loading}
                className="border px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              {!isViewMode && (
                <button
                  onClick={handleSubmit}
                  disabled={loading || loadingStaff}
                  className="bg-yellow-400 px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : isEditMode ? "Update" : "Create"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CONFIRM MODAL */}
        {showConfirm && (
          <Modal
            open={showConfirm}
            onClose={() => setShowConfirm(false)}
            className="w-[90%] max-w-md p-6 text-center"
          >
            <h2 className="text-2xl font-bold mb-4">
              {isActive ? "Deactivate Staff" : "Activate Staff"}
            </h2>
            <div className="flex justify-center mb-4">
              <img
                src={conformImg}
                alt="confirm"
                className="w-16 h-16"
              />
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to {isActive ? "deactivate" : "activate"}{" "}
              this staff member?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="border px-6 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={confirmToggleStatus}
                className="bg-yellow-400 px-6 py-2 rounded font-medium"
              >
                Yes
              </button>
            </div>
          </Modal>
        )}

        {/* SUCCESS MODAL */}
        {showSuccess && successType && (
          <Modal
            open={showSuccess}
            onClose={() => {
              setShowSuccess(false);
              navigate(STAFF_LIST_ROUTE);
            }}
            className="w-[90%] max-w-md p-6 text-center"
          >
            <h2 className="text-2xl font-bold mb-4">{getSuccessTitle()}</h2>

            <div className="flex justify-center mb-4">
              <img
                src={getSuccessImage()}
                alt="success"
                className="w-16 h-16"
              />
            </div>

            <p className="text-sm text-gray-600">{getSuccessMessage()}</p>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffCreatePage;
