import { User } from "lucide-react";
import Input from "../../form/Input";
import Select from "../../form/Select";
import FileUploadInput from "../../form/fileUploadInput";
import { useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "../../ui/Modal";
import {
  getBusinessOwner,
  createBusinessOwnerApi,
  updateBusinessOwnerApi,
  updateBusinessOwnerStatus,
  BusinessOwnerDetail,
} from "../../../services/superAdminService";

// SUCCESS + CONFIRM IMAGES (match these with your Figma assets)
import createSuccessImg from "../../../assets/tick.png";
import updateSuccessImg from "../../../assets/tick.png";
import activateSuccessImg from "../../../assets/activate-success.png";
import deactivateSuccessImg from "../../../assets/deactivated.png";
import activateConfirmImg from "../../../assets/activated.png";
import deactivateConfirmImg from "../../../assets/deactivated.png";
import { getSubscriptionPlans, SubscriptionPlan } from "../../../services/subscriptionService";


interface Props {
  defaultValues?: any | null;
}

type SuccessType =
  | "create"
  | "edit"
  | "activate"
  | "deactivate"
  | null;

export default function CreateBusinessOwner({
  defaultValues: _defaultValues,
}: Props) {
  const navigate = useNavigate();
  const { id } = useParams();

  // MODES
  const isEditMode = Boolean(id);
  const isViewMode =
    window.location.pathname.includes("/view");

  // FORM STATE
  const [ownerName, setOwnerName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState("Dine-in");
  const [gst, setGst] = useState("");
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("Telangana");
  const [city, setCity] = useState("Hyderabad");
  const [zip, setZip] = useState("");
  const [address, setAddress] = useState("");
  const [plan, setPlan] = useState("");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null);

  // STATUS
  const [isActive, setIsActive] = useState(true);

  // Loading / error
  const [pageLoading, setPageLoading] = useState(isEditMode || isViewMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // MODALS
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<SuccessType>(null);

  const fileRef = useRef<HTMLInputElement>(null);
const [planOptions, setPlanOptions] = useState<
  { label: string; value: string }[]
>([]);
const [loadingPlans, setLoadingPlans] = useState(false);
const apiBaseUrl = (process.env.REACT_APP_API_URL || "http://localhost:5001/api/v1")
  .replace(/\/api\/v1\/?$/, "");

const toAbsoluteAvatarUrl = (avatarPath?: string | null): string | null => {
  if (!avatarPath) return null;
  if (/^https?:\/\//i.test(avatarPath)) return avatarPath;
  return `${apiBaseUrl}${avatarPath.startsWith("/") ? "" : "/"}${avatarPath}`;
};

useEffect(() => {
  fetchPlans();
}, []);

const fetchPlans = async () => {
  try {
    setLoadingPlans(true);

    const res = await getSubscriptionPlans();

    if (res.success && res.data?.plans) {
      // ✅ only active plans
      const activePlans = res.data.plans.filter(
        (p: SubscriptionPlan) => p.status === "active"
      );

      const options = activePlans.map((p: SubscriptionPlan) => ({
        label: p.name,
        value: p.id, // OR p.id (recommended — see note below)
      }));

      setPlanOptions(options);
    }
  } catch (err) {
    console.error("Failed to fetch plans", err);
  } finally {
    setLoadingPlans(false);
  }
};
  // FETCH EXISTING DATA in edit/view mode
  useEffect(() => {
    if (!id) return;
    setPageLoading(true);
    getBusinessOwner(id)
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data as BusinessOwnerDetail;
          setOwnerName(d.ownerName || "");
          setRestaurantName(d.restaurantName || "");
          setEmail(d.email || "");
          setPhone(d.phone || "");
          setBusinessType(d.businessType || "Dine-in");
          setGst(d.tinGstNumber || "");
          setCountry(d.country || "India");
          setState(d.state || "Telangana");
          setCity(d.city || "Hyderabad");
          setZip(d.zipCode || "");
          setAddress(d.address || "");
          setPlan(d.plan?.id || "");
          setExistingAvatarUrl(toAbsoluteAvatarUrl(d.avatar || null));
          setIsActive(d.status === "active");
        } else {
          setError("Business owner not found");
        }
      })
      .catch(() => setError("Failed to load business owner"))
      .finally(() => setPageLoading(false));
  }, [id]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  // VALIDATION
  const validate = (): string[] => {
    const errs: string[] = [];
    if (!ownerName.trim()) errs.push("Owner's Full Name is required");
    if (!restaurantName.trim()) errs.push("Restaurant Name is required");
    if (!email.trim()) errs.push("Email Address is required");
    if (!phone.trim()) errs.push("Phone Number is required");
    if (!isEditMode && !password.trim()) errs.push("Password is required for new accounts");
    if (!address.trim()) errs.push("Address is required");
    return errs;
  };

  // HANDLERS
  const handleSubmit = async () => {
    setError(null);
    const errs = validate();
    if (errs.length > 0) {
      setValidationErrors(errs);
      return;
    }
    setValidationErrors([]);
    setSubmitting(true);

    try {
      if (isEditMode && id) {
        const res = await updateBusinessOwnerApi(id, {
          ownerName,
          restaurantName,
          email,
          phone,
          businessType,
          tinGstNumber: gst || undefined,
          country,
          state: state || undefined,
          city: city || undefined,
          zipCode: zip || undefined,
          planId: plan || undefined,
          address,
        }, avatarFile || undefined);
        if (res.success) {
          setSuccessType("edit");
          setShowSuccess(true);
        } else {
          setError(res.message || "Failed to update");
        }
      } else {
        const res = await createBusinessOwnerApi({
          ownerName,
          restaurantName,
          email,
          phone,
          password,
          businessType,
          tinGstNumber: gst || undefined,
          country,
          state: state || undefined,
          city: city || undefined,
          zipCode: zip || undefined,
          planId: plan || undefined,
          address,
        }, avatarFile || undefined);
        if (res.success) {
          setSuccessType("create");
          setShowSuccess(true);
        } else {
          setError(res.message || "Failed to create");
        }
      }
    } catch (e: any) {
      setError(e?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = () => {
    setShowConfirm(true);
  };

  const confirmToggleStatus = async () => {
    if (!id) return;
    const newStatus = isActive ? "inactive" : "active";
    try {
      const res = await updateBusinessOwnerStatus(id, newStatus as "active" | "inactive");
      if (res.success) {
        setIsActive(!isActive);
        setShowConfirm(false);
        setSuccessType(!isActive ? "activate" : "deactivate");
        setShowSuccess(true);
      } else {
        setError(res.message || "Failed to update status");
        setShowConfirm(false);
      }
    } catch {
      setError("Failed to update status");
      setShowConfirm(false);
    }
  };

  const getSuccessTitle = () => {
    switch (successType) {
      case "create":
        return "Profile Created";
      case "edit":
        return "Profile Updated";
      case "activate":
        return "User Activated";
      case "deactivate":
        return "User Deactivated";
      default:
        return "Success";
    }
  };

  const getSuccessMessage = () => {
    switch (successType) {
      case "create":
        return "Business owner profile has been successfully created.";
      case "edit":
        return "Business owner profile has been successfully updated.";
      case "activate":
        return "The business owner account has been activated.";
      case "deactivate":
        return "The business owner account has been deactivated.";
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
        return activateSuccessImg;
      case "deactivate":
        return deactivateSuccessImg;
      default:
        return "";
    }
  };

  if (pageLoading) {
    return (
      <div className="bg-bb-bg min-h-screen p-6 flex items-center justify-center">
        <p className="text-bb-textSoft">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-bb-bg min-h-screen p-6 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-[28px] md:text-[35px] font-bold">
          {isViewMode
            ? "View Business Owner"
            : isEditMode
            ? "Edit Business Owner"
            : "Create Business Owner"}
        </h1>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <ul className="list-disc pl-4 text-sm">
            {validationErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-bb-bg rounded-xl p-6 space-y-6">
        {/* PROFILE */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[10px] border-[#8e8d89] flex items-center justify-center text-gray-400 lg:mx-0 md:mx-auto sm:mx-auto">
            {avatarPreviewUrl || existingAvatarUrl ? (
              <img
                src={avatarPreviewUrl || existingAvatarUrl || ""}
                alt="Business owner avatar"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <User
                size={80}
                className="md:size-[100px]"
              />
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/png, image/jpeg"
            className="hidden"
            disabled={isViewMode}
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setAvatarFile(file);
              if (avatarPreviewUrl) {
                URL.revokeObjectURL(avatarPreviewUrl);
              }
              setAvatarPreviewUrl(file ? URL.createObjectURL(file) : null);
            }}
          />

          <div className="text-center md:text-left">
            <p className="text-sm text-bb-textSoft mb-2">
              Upload Profile Picture <br />
              JPG or PNG format only
            </p>

            <div className="flex justify-center md:justify-start gap-2">
              <button
                type="button"
                disabled={isViewMode}
                onClick={() =>
                  fileRef.current?.click()
                }
                className={`px-4 py-1.5 rounded text-sm font-medium ${
                  isViewMode
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-yellow-400"
                }`}
              >
                Upload
              </button>

              <button
                disabled={isViewMode}
                onClick={() => {
                  setAvatarFile(null);
                  if (avatarPreviewUrl) {
                    URL.revokeObjectURL(avatarPreviewUrl);
                  }
                  setAvatarPreviewUrl(null);
                  if (fileRef.current) {
                    fileRef.current.value = "";
                  }
                }}
                className={`border px-4 py-1.5 rounded text-sm ${
                  isViewMode &&
                  "cursor-not-allowed opacity-50"
                }`}
              >
                Remove
              </button>
            </div>
          </div>
        </div>

        {/* BASIC DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Owner's Full Name"
            required
            disabled={isViewMode}
            value={ownerName}
            onChange={setOwnerName}
          />
          <Input
            label="Restaurant Name"
            required
            disabled={isViewMode}
            value={restaurantName}
            onChange={setRestaurantName}
          />
          <Input
            label="Email Address"
            required
            disabled={isViewMode}
            value={email}
            onChange={setEmail}
          />

          <Input
            label="Phone Number"
            required
            disabled={isViewMode}
            value={phone}
            onChange={setPhone}
          />

          <Select
            value={businessType}
            label="Business Type"
            required
            disabled={isViewMode}
            onChange={setBusinessType}
            options={[
              { label: "Dine-in", value: "Dine-in" },
              { label: "Takeaway", value: "Takeaway" },
              { label: "Casual Dining", value: "Casual Dining" },
              { label: "Fine Dining", value: "Fine Dining" },
            ]}
          />

          <Input
            label="TIN / GST Number"
            required
            disabled={isViewMode}
            value={gst}
            onChange={setGst}
          />
        </div>

        {/* PASSWORD (only for create) */}
        {!isEditMode && !isViewMode && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Password"
              required
              type="password"
              value={password}
              onChange={setPassword}
            />
          </div>
        )}

        {/* DOCUMENTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FileUploadInput
            label="Business Registration Certificate"
            required
            disabled={isViewMode}
            placeholder="Upload Business certificate"
          />

          <div>
            <FileUploadInput
              label="Upload Menu"
              disabled={isViewMode}
              placeholder="Upload your Menu"
            />
            <a
              href="#"
              className="text-[#987820] mt-0 text-sm inline-block"
            >
              Download Sample Menu
            </a>
          </div>

          <Select
  value={plan}
  label="Select Plan"
  required
  disabled={isViewMode || loadingPlans}
  onChange={setPlan}
  options={planOptions}
/>
        </div>

        {/* LOCATION */}
        <div className="border rounded-xl p-4 bg-bb-bg space-y-4">
          <h3 className="font-medium text-yellow-600">
            Location Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              value={country}
              label="Country"
              required
              disabled={isViewMode}
              onChange={setCountry}
              options={[
                { label: "India", value: "India" },
              ]}
            />

            <Select
              value={state}
              label="State"
              required
              disabled={isViewMode}
              onChange={setState}
              options={[
                { label: "Telangana", value: "Telangana" },
                { label: "Karnataka", value: "Karnataka" },
                { label: "Maharashtra", value: "Maharashtra" },
                { label: "Tamil Nadu", value: "Tamil Nadu" },
              ]}
            />

            <Select
              value={city}
              label="City"
              required
              disabled={isViewMode}
              onChange={setCity}
              options={[
                { label: "Hyderabad", value: "Hyderabad" },
                { label: "Bangalore", value: "Bangalore" },
                { label: "Mumbai", value: "Mumbai" },
                { label: "Chennai", value: "Chennai" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Input
                label="Zip Code / Pin Code"
                disabled={isViewMode}
                value={zip}
                onChange={setZip}
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Address"
                required
                disabled={isViewMode}
                value={address}
                onChange={setAddress}
              />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          {(isEditMode || isViewMode) && (
            <button
              onClick={handleToggleStatus}
              className={`px-6 py-2 rounded font-medium ${
                isActive
                  ? "bg-black text-white"
                  : "bg-green-600 text-white"
              }`}
            >
              {isActive
                ? "Deactivate"
                : "Activate"}
            </button>
          )}

          <button
            onClick={() => navigate(-1)}
            className="border px-6 py-2 border-black rounded"
          >
            Cancel
          </button>

          {!isViewMode && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : isEditMode
                ? "Update"
                : "Create"}
            </button>
          )}
        </div>
      </div>

      {/* STATUS CONFIRM MODAL */}
      {showConfirm && (
        <Modal
          open={showConfirm}
          onClose={() =>
            setShowConfirm(false)
          }
          className="w-[90%] max-w-md p-6 text-center z-[9999]"
        >
          <h2 className="text-2xl font-bold mb-4">
            {isActive
              ? "Deactivate"
              : "Activate"}
          </h2>

          <div className="flex justify-center mb-4">
            <img
              src={
                isActive
                  ? deactivateConfirmImg
                  : activateConfirmImg
              }
              alt="confirm"
              className="w-16 h-16"
            />
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to{" "}
            {isActive
              ? "deactivate"
              : "activate"}{" "}
            this business owner?
          </p>

          <div className="flex justify-center gap-3">
            <button
              onClick={() =>
                setShowConfirm(false)
              }
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
            navigate(-1);
          }}
          className="w-[90%] max-w-md p-6 text-center z-[9999]"
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
  );
}
