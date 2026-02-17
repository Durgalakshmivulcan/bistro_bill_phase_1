import Input from "../form/Input";
import DashboardLayout from "../../layout/DashboardLayout";
import { useEffect, useRef, useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import ProfileModule from "./settings/profilemodule";
import { useAuth } from "../../contexts/AuthContext";
import { SuperAdminUser } from "../../services/authService";
import {
  updateSuperAdminProfile,
  deleteSuperAdminAvatar,
} from "../../services/superAdminService";

export default function MyAccount() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { user, refreshUser } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Populate form from user context
  useEffect(() => {
    if (user && user.userType === "SuperAdmin") {
      const sa = user as SuperAdminUser;
      setName(sa.name || "");
      setPhone(sa.phone || "");
      setAvatarPreview(sa.avatar || null);
      setLoading(false);
    } else if (user) {
      setLoading(false);
    }
  }, [user]);

  const superAdmin = user?.userType === "SuperAdmin" ? (user as SuperAdminUser) : null;

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim()) {
      errors.name = "Name is required";
    }
    if (phone) {
      const phoneRegex = /^\+?[\d\s\-()]{7,15}$/;
      if (!phoneRegex.test(phone)) {
        errors.phone = "Invalid phone number format";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setError(null);

    try {
      const response = await updateSuperAdminProfile(
        { name: name.trim(), phone: phone || "" },
        avatarFile || undefined
      );
      if (response.success) {
        setAvatarFile(null);
        await refreshUser();
        setShowSuccess(true);
      } else {
        setError(response.error?.message || "Failed to update profile");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Only JPG and PNG images are allowed");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleDeleteAvatar = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await deleteSuperAdminAvatar();
      if (response.success) {
        setAvatarPreview(null);
        setAvatarFile(null);
        if (fileRef.current) fileRef.current.value = "";
        await refreshUser();
      } else {
        setError(response.error?.message || "Failed to remove avatar");
      }
    } catch (err: any) {
      setError(err.message || "Failed to remove avatar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="bg-bb-bg min-h-screen p-4 sm:p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-bb-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-bb-bg min-h-screen p-4 sm:p-6 space-y-6">
        <h1 className="text-xl font-bold">My Account</h1>

        {error && (
          <div className="max-w-5xl mx-auto bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold ml-4">
              &times;
            </button>
          </div>
        )}

        <div className="bg-bb-bg max-w-5xl mx-auto rounded-xl p-4 sm:p-6">
          {/* PROFILE */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
            <div className="relative w-fit lg:mx-0 sm:mx-auto">
              <img
                src={avatarPreview || "/images/user.jpg"}
                alt="profile"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover"
              />

              {/* DELETE BADGE */}
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={saving}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#BD2E2E] rounded-full flex items-center justify-center shadow-md disabled:opacity-50"
                >
                  <Trash2 size={14} className="text-white" />
                </button>
              )}

              {/* HIDDEN FILE INPUT */}
              <input
                ref={fileRef}
                type="file"
                accept="image/png, image/jpeg"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="text-left">
              <p className="text-sm text-bb-textSoft mb-2">
                Upload Profile Picture
                <br />
                Image should be of JPG or PNG format only
              </p>

              <div className="flex justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={saving}
                  className="bg-white border border-black px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50"
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={saving}
                  className="bg-yellow-400 px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <Input
                label="Name"
                value={name}
                onChange={(val) => {
                  setName(val);
                  if (formErrors.name) {
                    const { name: _, ...rest } = formErrors;
                    setFormErrors(rest);
                  }
                }}
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <Input
                label="Phone Number"
                value={phone}
                onChange={(val) => {
                  setPhone(val);
                  if (formErrors.phone) {
                    const { phone: _, ...rest } = formErrors;
                    setFormErrors(rest);
                  }
                }}
              />
              {formErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
              )}
            </div>

            <Input label="Role" value="Super Admin" disabled />
            <Input label="Email ID" value={superAdmin?.email || ""} disabled />
          </div>

          {/* ACTION */}
          <div className="mt-6 flex justify-end sm:justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-black text-white px-6 py-2 rounded disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
      {/* SUCCESS MODAL */}
      <ProfileModule
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </DashboardLayout>
  );
}
