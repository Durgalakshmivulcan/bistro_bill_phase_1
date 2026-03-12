import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { getProfile, updateProfile, BusinessProfile, UpdateProfileInput } from "../../services/settingsService";

const BusinessProfilePage = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<UpdateProfileInput>({
    businessName: "",
    brandName: "",
    businessType: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    logo: "",
    website: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const getLogoStorageKey = (profileId?: string) =>
    profileId ? `bb_profile_logo:${profileId}` : "bb_profile_logo";

  // Fetch profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProfile();

      if (response.success && response.data) {
        const storageKey = getLogoStorageKey(response.data.id);
        const storedLogo = localStorage.getItem(storageKey) || "";
        const mergedLogo = (response.data.logo || storedLogo || "") as string;

        setProfile({ ...response.data, logo: mergedLogo });
        // Initialize form data with profile data
        setFormData({
          businessName: response.data.businessName || "",
          brandName: response.data.brandName || "",
          businessType: response.data.businessType || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
          address: response.data.address || "",
          city: response.data.city || "",
          state: response.data.state || "",
          country: response.data.country || "",
          postalCode: response.data.postalCode || "",
          logo: mergedLogo,
          website: response.data.website || "",
          description: response.data.description || "",
        });
      } else {
        setError("Failed to load business profile");
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("An error occurred while loading the profile");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!formData.businessName?.trim()) {
      errors.businessName = "Restaurant Name is required";
    }
    if (!formData.businessType?.trim()) {
      errors.businessType = "Business Type is required";
    }
    if (!formData.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    if (!formData.phone?.trim()) {
      errors.phone = "Phone Number is required";
    } else if (!/^[\d\s+\-()]+$/.test(formData.phone)) {
      errors.phone = "Invalid phone number format";
    }
    if (!formData.country?.trim()) {
      errors.country = "Country is required";
    }
    if (!formData.state?.trim()) {
      errors.state = "State is required";
    }
    if (!formData.city?.trim()) {
      errors.city = "City is required";
    }
    if (!formData.address?.trim()) {
      errors.address = "Address is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await updateProfile(formData);

      if (response.success) {
        // Persist logo client-side as a fallback if backend doesn't store/return it.
        if (profile?.id && formData.logo) {
          localStorage.setItem(getLogoStorageKey(profile.id), formData.logo);
        }

        // Optimistically reflect the logo immediately in the view.
        setProfile((prev) => (prev ? { ...prev, logo: formData.logo || prev.logo } : prev));

        await loadProfile(); // reload updated profile
      
        setShowEditModal(false);
        setShowSuccessModal(true);
        setFormErrors({});
      }else {
        setError(response.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("An error occurred while updating the profile");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UpdateProfileInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleLogoFilePick = (file: File) => {
    // Store as data URL for preview; backend currently accepts `logo` as string (avatar).
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      handleInputChange("logo", result);
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
        <button
          onClick={loadProfile}
          className="bg-black text-white px-4 py-2 rounded-md text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 p-4 sm:p-6">
      {/* ================= VIEW PROFILE ================= */}
      <div className={`${showEditModal || showSuccessModal ? "blur-sm" : ""}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Business Profile
          </h2>

          <button
            onClick={() => setShowEditModal(true)}
            className="bg-black text-white px-4 py-2 rounded-md text-sm w-full sm:w-auto"
          >
            Edit Details
          </button>
        </div>

        {/* Business Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

  {/* Logo */}
  <div>
    <p className="text-sm font-medium mb-2">Logo</p>

    <div className="w-40 h-40 border rounded-md flex items-center justify-center bg-white">
      {profile?.logo ? (
        <img
          src={profile.logo}
          alt="Logo"
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <span className="text-gray-400 text-sm">No logo</span>
      )}
    </div>
  </div>

  {/* Business Info */}
  <div className="lg:col-span-2 grid grid-cols-2 gap-6 text-sm">

    <ProfileField label="Restaurant Name" value={profile?.businessName} />
    <ProfileField label="Brand Name" value={profile?.brandName} />

    <ProfileField label="Website URL" value={profile?.website} />
    <ProfileField label="Business Type" value={profile?.businessType} />

    <ProfileField label="Phone Number" value={profile?.phone} />
    <ProfileField label="Email Address" value={profile?.email} />

    <ProfileField label="Country" value={profile?.country} />
    <ProfileField label="State" value={profile?.state} />

    <ProfileField label="City" value={profile?.city} />
    <ProfileField label="Zip/Pin Code" value={profile?.postalCode} />

    <div className="col-span-2">
      <p className="font-medium">Address:</p>
      <p className="text-gray-700">{profile?.address || "N/A"}</p>
    </div>

  </div>

</div>

        {/* Description */}
        <div className="mt-6">
          <p className="font-medium mb-2">Description</p>
          <div className="border rounded-md p-4 text-sm text-gray-700 bg-white whitespace-pre-line">
            {profile?.description || "No description available"}
          </div>
        </div>
      </div>

{/* ================= EDIT MODAL ================= */}
    {showEditModal && (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm">
        <div className="flex min-h-screen items-start sm:items-center justify-center px-3 py-4">

          {/* Modal Container */}
          <div className="bg-white w-full max-w-5xl rounded-lg flex flex-col max-h-[95vh]">

            {/* ===== Header ===== */}
            <div className="px-4 sm:px-6 py-4 border-b">
              <h2 className="text-lg sm:text-2xl font-bold">
                Manage Business Profile
              </h2>
            </div>

            {/* ===== Scrollable Content ===== */}
            <div className="overflow-y-auto px-4 sm:px-6 py-4">
              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Logo */}
                {/* Logo */}
<div>
  <p className="text-sm font-medium mb-2">logo</p>

  <div className="relative w-36 h-36 border border-[#E5E5E5] rounded-md flex items-center justify-center bg-white">

    {formData.logo ? (
      <img
        src={formData.logo}
        alt="Logo"
        className="max-h-full max-w-full object-contain p-2"
      />
    ) : (
      <span className="text-gray-400 text-sm">No logo</span>
    )}

    {/* Edit icon */}
    <button
      type="button"
      onClick={() => {
        logoFileInputRef.current?.click();
      }}
      className="absolute right-2 top-2 w-7 h-7 bg-black text-white rounded-full flex items-center justify-center"
      aria-label="Edit logo"
    >
      <Pencil size={14} />
    </button>

    <input
      ref={logoFileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        handleLogoFilePick(file);
        // Allow re-selecting the same file.
        e.currentTarget.value = "";
      }}
    />
  </div>
</div>

                {/* Form */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <FormInput
                    label="Restaurant Name*"
                    value={formData.businessName || ""}
                    onChange={(value) => handleInputChange("businessName", value)}
                    error={formErrors.businessName}
                  />
                  <FormInput
  label="Brand Name"
  value={formData.brandName || ""}
  onChange={(value) => handleInputChange("brandName", value)}
/>
                  <FormInput
                    label="Website URL"
                    value={formData.website || ""}
                    onChange={(value) => handleInputChange("website", value)}
                    error={formErrors.website}
                  />
                  <div>
  <label className="font-medium">Business Type*</label>

  <select
    value={formData.businessType || ""}
    onChange={(e) => handleInputChange("businessType", e.target.value)}
    className="w-full border rounded-md px-3 py-2 mt-1"
  >
    <option value="">Select Business Type</option>
    <option value="Dine In">Dine In</option>
    <option value="Take Away">Take Away</option>
    <option value="Delivery">Delivery</option>
    <option value="Cloud Kitchen">Cloud Kitchen</option>
  </select>
</div>
                  <FormInput
                    label="Phone Number*"
                    value={formData.phone || ""}
                    onChange={(value) => handleInputChange("phone", value)}
                    error={formErrors.phone}
                  />
                  <FormInput
                    label="Email Address*"
                    value={formData.email || ""}
                    onChange={(value) => handleInputChange("email", value)}
                    error={formErrors.email}
                  />
                  <FormInput
                    label="Country*"
                    value={formData.country || ""}
                    onChange={(value) => handleInputChange("country", value)}
                    error={formErrors.country}
                  />
                  <FormInput
                    label="State*"
                    value={formData.state || ""}
                    onChange={(value) => handleInputChange("state", value)}
                    error={formErrors.state}
                  />
                  <FormInput
                    label="City*"
                    value={formData.city || ""}
                    onChange={(value) => handleInputChange("city", value)}
                    error={formErrors.city}
                  />
                  <FormInput
                    label="Zip Code / Pin Code"
                    value={formData.postalCode || ""}
                    onChange={(value) => handleInputChange("postalCode", value)}
                    error={formErrors.postalCode}
                  />

                  <div className="sm:col-span-2">
                    <label className="font-medium">Address*</label>
                    <input
                      className={`w-full border rounded-md px-3 py-2 mt-1 ${
                        formErrors.address ? "border-red-500" : ""
                      }`}
                      value={formData.address || ""}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                    />
                    {formErrors.address && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-4">
                <label className="font-medium">Description</label>
                <textarea
                  rows={4}
                  value={formData.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full border rounded-md px-3 py-2 mt-1 text-sm"
                />
              </div>
            </div>

            {/* ===== Footer / Actions ===== */}
            <div className="px-4 sm:px-6 py-4 border-t flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setFormErrors({});
                  setError(null);
                }}
                disabled={saving}
                className="border px-6 py-2 rounded-md w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#F7C948] px-6 py-2 rounded-md font-medium w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>

          </div>
        </div>
      </div>
    )}


      {/* ================= SUCCESS MODAL ================= */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 text-center w-full max-w-sm relative">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-3 right-3 text-gray-400"
            >
              ✕
            </button>
            <h3 className="text-lg sm:text-xl font-bold mb-2">
              Profile Updated
            </h3>

            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl sm:text-3xl">
                ✓
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Business Profile Updated Successfully!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessProfilePage;

/* ================= Form Input Helper ================= */
function FormInput({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded-md px-3 py-2 mt-1 ${
          error ? "border-red-500" : ""
        }`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
function ProfileField({
  label,
  value
}: {
  label: string
  value?: string
}) {
  return (
    <div>
      <p className="font-medium">{label}:</p>
      <p className="text-gray-700">{value || "N/A"}</p>
    </div>
  );
}
