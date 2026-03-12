import { useState, useEffect } from "react";
import Modal from "../../../ui/Modal";
import Input from "../../../form/Input";
import Select from "../../../form/Select";
import Checkbox from "../../../form/Checkbox";
import FileUploadInput from "../../../form/fileUploadInput";
import { FormError } from "../../../Common";
import LoadingSpinner from "../../../Common/LoadingSpinner";
import tickImg from "../../assets/tick.png";
import { Staff } from "./staffList";
import {
  validateEmail,
  validatePhone,
  validateRequired,
  FormErrors,
  hasFormErrors,
  clearFormError,
  setFormError,
} from "../../../../utils/formValidation";
import { CRUDToasts } from "../../../../utils/toast";
import {
  createStaff,
  updateStaff,
  getStaffMember,
  getRoles,
  CreateStaffData,
  UpdateStaffData,
  Role
} from "../../../../services/staffService";

// ================= TYPES =================
interface CreateStaffModalProps {
  onClose: () => void;
  defaultValues?: Staff | null;
  onSuccess?: () => void; // Callback to refresh staff list
}

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  branch: "",
  role: "",
  offlineAccess: false,
};

const superAdminCreateStaffModal = ({
  onClose,
  defaultValues = null,
  onSuccess,
}: CreateStaffModalProps) => {
  const [successOpen, setSuccessOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    branch: "",
    role: "",
  });
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [apiError, setApiError] = useState<string>("");
  const [roles, setRoles] = useState<Role[]>([]);

  const isEditMode = Boolean(defaultValues);

  // ================= FETCH ROLES =================
  useEffect(() => {
    fetchRoles();
  }, []);

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

  // ================= FETCH STAFF DETAILS FOR EDIT =================
  useEffect(() => {
    if (defaultValues?.id) {
      fetchStaffDetails(defaultValues.id);
    } else {
      setFormData(emptyForm);
      setProfileImage(null);
      setPreviewUrl(null);
    }
  }, [defaultValues]);

  const fetchStaffDetails = async (staffId: string) => {
    try {
      setFetching(true);
      setApiError("");
      const response = await getStaffMember(staffId);

      if (response.success && response.data) {
        const staff = response.data;
        setFormData({
          firstName: staff.firstName || "",
          lastName: staff.lastName || "",
          email: staff.email || "",
          phone: staff.phone || "",
          password: "", // Don't prefill password for security
          branch: staff.branchId || "",
          role: staff.roleId || "",
          offlineAccess: false,
        });
      } else {
        setApiError(response.error?.message || "Failed to fetch staff details");
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching staff details:", err);
    } finally {
      setFetching(false);
    }
  };

  // ================= IMAGE PREVIEW CLEANUP =================
  useEffect(() => {
    if (!profileImage) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(profileImage);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [profileImage]);

  // ================= VALIDATION =================
  const validateField = (field: string, value: any): string => {
    let result;

    switch (field) {
      case "firstName":
        result = validateRequired(value, "First name");
        return result.message;
      case "lastName":
        result = validateRequired(value, "Last name");
        return result.message;
      case "email":
        result = validateEmail(value);
        return result.message;
      case "phone":
        result = validatePhone(value);
        return result.message;
      case "password":
        // Password required only for new staff creation
        if (!isEditMode) {
          result = validateRequired(value, "Password");
          if (result.isValid && value.length < 6) {
            return "Password must be at least 6 characters";
          }
          return result.message;
        }
        return "";
      case "branch":
        result = validateRequired(value, "Branch");
        return result.message;
      case "role":
        result = validateRequired(value, "Role");
        return result.message;
      default:
        return "";
    }
  };

  const validateAllFields = (): boolean => {
    const newErrors: FormErrors = {
      firstName: validateField("firstName", formData.firstName),
      lastName: validateField("lastName", formData.lastName),
      email: validateField("email", formData.email),
      phone: validateField("phone", formData.phone),
      password: validateField("password", formData.password),
      branch: validateField("branch", formData.branch),
      role: validateField("role", formData.role),
    };

    setErrors(newErrors);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      branch: true,
      role: true,
    });

    return !hasFormErrors(newErrors);
  };

  // ================= HANDLERS =================
  const handleChange = (
    key: keyof typeof emptyForm,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Real-time validation for touched fields
    if (typeof value === "string" && touched[key]) {
      const errorMessage = validateField(key, value);
      setErrors(setFormError(errors, key, errorMessage));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errorMessage = validateField(field, formData[field as keyof typeof emptyForm]);
    setErrors(setFormError(errors, field, errorMessage));
  };

  const handleCreate = async () => {
    if (!validateAllFields()) {
      return; // Prevent submission if validation fails
    }

    setLoading(true);
    setApiError("");

    try {
      if (isEditMode && defaultValues?.id) {
        // Update existing staff
        const updateData: UpdateStaffData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          branchId: formData.branch,
          roleId: formData.role,
        };

        // Only include password if it's provided
        if (formData.password) {
          updateData.password = formData.password;
        }

        const response = await updateStaff(defaultValues.id, updateData);

        if (response.success) {
          CRUDToasts.updated("Staff");
          setSuccessOpen(true);
          setTimeout(() => {
            setSuccessOpen(false);
            onSuccess?.(); // Refresh staff list
            onClose();
          }, 2000);
        } else {
          setApiError(response.error?.message || "Failed to update staff");
        }
      } else {
        // Create new staff
        const createData: CreateStaffData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          branchId: formData.branch,
          roleId: formData.role,
        };

        const response = await createStaff(createData);

        if (response.success) {
          CRUDToasts.created("Staff");
          setSuccessOpen(true);
          setTimeout(() => {
            setSuccessOpen(false);
            onSuccess?.(); // Refresh staff list
            onClose();
          }, 2000);
        } else {
          setApiError(response.error?.message || "Failed to create staff");
        }
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error saving staff:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check if form is valid (for disabling submit button)
  const isFormValid = !hasFormErrors(errors) &&
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.phone.trim() !== "" &&
    formData.branch !== "" &&
    formData.role !== "" &&
    (isEditMode || formData.password.trim() !== ""); // Password required only for new staff

  const handleRemoveImage = () => {
    setProfileImage(null);
  };

  return (
    <>
      {/* ================= CREATE STAFF MODAL ================= */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-3">
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Card */}
        <div className="relative w-full max-w-[900px] bg-white rounded-xl shadow-2xl px-6 sm:px-10 py-6 sm:py-8 max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            {isEditMode ? "Edit Staff" : "Create New Staff"}
          </h2>

          {/* ================= PROFILE ROW ================= */}
          <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8 mb-8">
            
            {/* Avatar */}
            <div className="h-28 w-28 rounded-full border-4 border-gray-200 flex items-center justify-center text-gray-400 shrink-0 mx-auto sm:mx-0 overflow-hidden">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                "👤"
              )}
            </div>

            {/* Upload Section */}
            <div className="w-full">
              <p className="font-semibold mb-1">
                Upload Profile Picture
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Image should be JPG or PNG format only
              </p>

              {/* Buttons ALWAYS INLINE */}
              <div className="flex flex-nowrap gap-4">
                <FileUploadInput
                label="upload"
                  hidePreview
                  buttonLabel="Upload"
                  accept="image/png, image/jpeg"
                  onChange={(file: File | null) =>
                    setProfileImage(file)
                  }
                  buttonClass="bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-6 py-2 rounded-md whitespace-nowrap"
                />

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="border border-gray-300 px-6 py-2 rounded-md text-gray-500 hover:bg-gray-50 whitespace-nowrap"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* ================= API ERROR ================= */}
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <p className="text-sm">{apiError}</p>
            </div>
          )}

          {/* ================= LOADING STATE ================= */}
          {fetching ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" message="Loading staff details..." />
            </div>
          ) : (
            <>
              {/* ================= FORM GRID ================= */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">

                <div>
                  <Input
                    label="First Name *"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(value) =>
                      handleChange("firstName", value)
                    }
                    onBlur={() => handleBlur("firstName")}
                    disabled={loading}
                  />
                  {touched.firstName && <FormError message={errors.firstName} />}
                </div>

                <div>
                  <Input
                    label="Last Name *"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(value) =>
                      handleChange("lastName", value)
                    }
                    onBlur={() => handleBlur("lastName")}
                    disabled={loading}
                  />
                  {touched.lastName && <FormError message={errors.lastName} />}
                </div>

                <div>
                  <Input
                    label="Email Address *"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(value) =>
                      handleChange("email", value)
                    }
                    onBlur={() => handleBlur("email")}
                    disabled={loading}
                  />
                  {touched.email && <FormError message={errors.email} />}
                </div>

                <div>
                  <Input
                    label="Phone Number *"
                    placeholder="+91 Phone Number"
                    value={formData.phone}
                    onChange={(value) =>
                      handleChange("phone", value)
                    }
                    onBlur={() => handleBlur("phone")}
                    disabled={loading}
                  />
                  {touched.phone && <FormError message={errors.phone} />}
                </div>

                <div>
                  <Input
                    label={isEditMode ? "Password (leave blank to keep current)" : "Password *"}
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(value) =>
                      handleChange("password", value)
                    }
                    onBlur={() => handleBlur("password")}
                    disabled={loading}
                  />
                  {touched.password && <FormError message={errors.password} />}
                </div>

                <div>
                  <Input
                    label="Branch ID *"
                    placeholder="Branch ID"
                    value={formData.branch}
                    onChange={(value) =>
                      handleChange("branch", value)
                    }
                    onBlur={() => handleBlur("branch")}
                    disabled={loading}
                  />
                  {touched.branch && <FormError message={errors.branch} />}
                </div>

                <div className="sm:col-span-2">
                  <Select
                    label="Role *"
                    value={formData.role}
                    onChange={(value) => {
                      handleChange("role", value);
                      if (touched.role) {
                        handleBlur("role");
                      }
                    }}
                    options={[
                      { label: "Select Staff Role", value: "" },
                      ...roles.map((role) => ({
                        label: role.name,
                        value: role.id,
                      })),
                    ]}
                    disabled={loading}
                  />
                  {touched.role && <FormError message={errors.role} />}
                </div>
              </div>
            </>
          )}

          {/* ================= CHECKBOX ================= */}
          <div className="mt-6">
            <Checkbox
              label="Allow Offline Access"
              checked={formData.offlineAccess}
              onChange={(checked) =>
                 handleChange("offlineAccess", checked)
              }
            />
          </div>

          {/* ================= FOOTER ================= */}
          <div className="flex justify-end gap-4 mt-10">
            <button
              onClick={onClose}
              disabled={loading}
              className="border border-black px-8 py-2 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            <button
              onClick={handleCreate}
              disabled={!isFormValid || loading || fetching}
              className={`px-8 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                isFormValid && !loading && !fetching
                  ? "bg-yellow-400 hover:bg-yellow-500"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading && <LoadingSpinner size="sm" />}
              {loading ? "Saving..." : isEditMode ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>

      {/* ================= SUCCESS MODAL ================= */}
      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">
          {isEditMode ? "Staff Updated" : "Staff Added"}
        </h2>

        <div className="flex justify-center mb-6">
          <img
            src={tickImg}
            alt="Success"
            className="w-16 h-16"
          />
        </div>

        <p className="text-sm text-gray-600">
          {isEditMode
            ? "Staff details updated successfully."
            : "New staff created! Login credentials sent to their email."}
        </p>
      </Modal>
    </>
  );
};

export default superAdminCreateStaffModal;
