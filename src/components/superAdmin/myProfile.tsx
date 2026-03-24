import DashboardLayout from "../../layout/DashboardLayout";
import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import ProfileModule from "./settings/profilemodule";
import { useAuth } from "../../contexts/AuthContext";
import { SuperAdminUser, BusinessOwnerUser } from "../../services/authService";
import {
  deleteSuperAdminAvatar,
  updateSuperAdminProfile,
} from "../../services/superAdminService";
import {
  deleteBusinessOwnerAvatar,
  updateBusinessOwnerProfile,
} from "../../services/businessOwnerService";
import Swal from "sweetalert2";

export default function MyAccount() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { user, refreshUser } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarMarkedForDeletion, setAvatarMarkedForDeletion] = useState(false);

  const isSuperAdmin = user?.userType === "SuperAdmin";
  const isBusinessOwner = user?.userType === "BusinessOwner";
  const canEditProfile = isSuperAdmin || isBusinessOwner;
  const canEditAvatar = isSuperAdmin || isBusinessOwner;

  // Populate form from user context
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (user.userType === "SuperAdmin") {
      const sa = user as SuperAdminUser;
      setName(sa.name || "");
      setPhone(sa.phone || "");
      setAvatarPreview(sa.avatar || null);
      setAvatarFile(null);
      setAvatarMarkedForDeletion(false);
      setLoading(false);
    } else if (user.userType === "BusinessOwner") {
      const bo = user as BusinessOwnerUser;
      setName(bo.ownerName || "");
      setPhone(bo.phone || "");
      setAvatarPreview(bo.avatar || null);
      setAvatarFile(null);
      setAvatarMarkedForDeletion(false);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user]);

  const roleLabel = isSuperAdmin ? "Super Admin" : isBusinessOwner ? "Business Owner" : "Staff";
  const emailValue = user?.email || "";

  const fieldBaseClassName =
    "h-11 w-full rounded-md border border-[#ddd4c4] bg-white px-4 text-[15px] text-[#2f2a24] outline-none transition focus:border-[#b79d61]";
  const disabledFieldClassName =
    "h-11 w-full rounded-md border border-[#e4dccd] bg-[#f5efe2] px-4 text-[15px] text-[#9b9488] opacity-100";
  const hasAvatar = Boolean(avatarPreview);
  const showDeleteAvatarButton = canEditAvatar;

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
  if (!canEditProfile || !isEditing || !validateForm()) return;

  const confirm = await Swal.fire({
    title: "Are you sure?",
    text: "Do you want to update your profile?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#000",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, update it!",
  });

  if (!confirm.isConfirmed) return;

  setSaving(true);
  setError(null);

  try {
    const serviceCall = isSuperAdmin
      ? updateSuperAdminProfile(
          { name: name.trim(), phone: phone || "" },
          avatarFile || undefined
        )
      : updateBusinessOwnerProfile(
          { ownerName: name.trim(), phone: phone || "" },
          avatarFile || undefined
        );

    const response = await serviceCall;

    if (!response.success) {
      throw new Error(
        response.error?.message ||
        response.message ||
        "Failed to update profile"
      );
    }

    if (avatarMarkedForDeletion) {
      const deleteResponse = isSuperAdmin
        ? await deleteSuperAdminAvatar()
        : await deleteBusinessOwnerAvatar();

      if (!deleteResponse.success) {
        throw new Error(
          deleteResponse.error?.message ||
            deleteResponse.message ||
            "Failed to remove avatar"
        );
      }
    }

    setAvatarFile(null);
    setAvatarMarkedForDeletion(false);
    if (fileRef.current) fileRef.current.value = "";
    await refreshUser();
    setIsEditing(false);

    // ✅ Sweet Success Alert
    await Swal.fire({
      icon: "success",
      title: "Updated!",
      text: "Your profile has been updated successfully.",
      confirmButtonColor: "#000",
    });

  } catch (err: unknown) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text:
        err instanceof Error
          ? err.message
          : "Something went wrong",
      confirmButtonColor: "#d33",
    });
  } finally {
    setSaving(false);
  }
};

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEditAvatar || !isEditing) {
      setError("You do not have permission to update the avatar.");
      return;
    }

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
    setAvatarMarkedForDeletion(false);
    setError(null);
  };

  const handleDeleteAvatar = async () => {
    if (!canEditAvatar) {
      return;
    }

    if (!isEditing) {
      setIsEditing(true);
    }

    if (!hasAvatar) {
      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarMarkedForDeletion(false);
      setError(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const confirm = await Swal.fire({
      title: "Remove profile picture?",
      text: "This will remove the current profile picture.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#000",
      confirmButtonText: "Delete",
    });

    if (!confirm.isConfirmed) return;

    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarMarkedForDeletion(true);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
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

        <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border bg-bb-bg shadow-sm">
          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="relative w-fit self-center sm:self-auto">
                <img
                  src={avatarPreview || "/images/user.jpg"}
                  alt="profile"
                  className="h-28 w-28 rounded-full sm:h-32 sm:w-32"
                />

                {showDeleteAvatarButton && (
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    disabled={saving}
                    className="absolute bottom-0 right-0 flex h-10 w-10 translate-x-1 translate-y-1 items-center justify-center rounded-full bg-[#BD2E2E] text-white shadow-md transition hover:bg-[#BD2E2E] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Delete profile picture"
                  >
                    <Trash2 size={20} strokeWidth={2.4} />
                  </button>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png, image/jpeg"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="pt-1 text-left">
                <p className="text-xl font-medium text-[#2f2a24]">Upload Profile Picture</p>
                <p className="mt-1 text-sm text-[#6f675c]">
                  Image should be of JPG or PNG format only
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={saving || !canEditAvatar || !isEditing}
                    className="min-w-[102px] rounded-md border border-[#2f2a24] bg-white px-6 py-2 text-base font-medium text-[#2f2a24] transition hover:bg-[#f7f1e5] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!canEditProfile) return;
                      setIsEditing(true);
                      setError(null);
                    }}
                    disabled={saving || !canEditProfile}
                    className="min-w-[102px] rounded-md bg-[#f7c53a] px-6 py-2 text-base font-medium text-[#2f2a24] transition hover:bg-[#e8b52b] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-7 border-t border-[#ddd4c4] pt-7">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-7 sm:gap-y-6">
                <div>
                  <label className="mb-2 block text-[15px] font-semibold text-[#4d463f]">
                    Name
                  </label>
                  <input
                    value={name}
                    disabled={!isEditing}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) {
                        const { name: _, ...rest } = formErrors;
                        setFormErrors(rest);
                      }
                    }}
                    className={!isEditing ? disabledFieldClassName : fieldBaseClassName}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-[15px] font-semibold text-[#4d463f]">
                    Phone Number
                  </label>
                  <input
                    value={phone}
                    disabled={!isEditing}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (formErrors.phone) {
                        const { phone: _, ...rest } = formErrors;
                        setFormErrors(rest);
                      }
                    }}
                    className={!isEditing ? disabledFieldClassName : fieldBaseClassName}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-[15px] font-semibold text-[#4d463f]">
                    Role
                  </label>
                  <input
                    value={roleLabel}
                    disabled
                    className={disabledFieldClassName}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[15px] font-semibold text-[#4d463f]">
                    Email ID
                  </label>
                  <input
                    value={emailValue}
                    disabled
                    className={disabledFieldClassName}
                  />
                </div>
              </div>
            </div>
          </div>

          {canEditProfile && (
            <div className="flex justify-end border-t bg-bb-bg px-5 py-5 sm:px-7">
              <button
                onClick={handleSave}
                disabled={saving || !isEditing}
                className="rounded-md bg-[#2f2a24] px-6 py-2.5 text-base font-medium text-white transition hover:bg-[#1f1b17] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
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
