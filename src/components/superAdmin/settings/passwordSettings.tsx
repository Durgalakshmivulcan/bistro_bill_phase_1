import { useState } from "react";
import Input from "../../../components/form/Input";
import PasswordSuccessModal from "./passwordsuccessmodal";
import { changePassword } from "../../../services/authService";

export default function ManagePasswordSettings() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    api?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ✅ match backend rule
  const isStrongPassword = (pwd: string) => pwd.length >= 6;

  // ================= VALIDATION =================
  const validate = () => {
    const newErrors: typeof errors = {};

    if (!oldPassword.trim()) {
      newErrors.oldPassword = "Old password is required";
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (!isStrongPassword(newPassword)) {
      newErrors.newPassword = "Password must be at least 6 characters";
    } else if (newPassword === oldPassword) {
      newErrors.newPassword =
        "New password must be different from old password";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if (loading) return;
    if (!validate()) return;

    try {
      setLoading(true);
      setErrors({});

      // ✅ REAL API CALL
      const response = await changePassword(
  oldPassword,
  newPassword
);

      // ✅ HANDLE API ERROR
      if (!response.success) {
        setErrors({
          api: response.error?.message || "Failed to change password",
        });
        return;
      }

      // ✅ SUCCESS
      setShowSuccess(true);

      // reset form
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setErrors({
        api:
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to change password",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-[70vh] flex flex-col">
        {/* FORM */}
        <div className="max-w-md w-full space-y-6">
          {/* OLD PASSWORD */}
          <div>
            <Input
              value={oldPassword}
              onChange={(e: any) =>
                setOldPassword(e?.target?.value ?? e)
              }
              label="Old Password"
              type="password"
              placeholder="Enter Old Password"
              required
            />
            {errors.oldPassword && (
              <p className="text-xs text-red-500 mt-1">
                {errors.oldPassword}
              </p>
            )}
          </div>

          {/* NEW PASSWORD */}
          <div>
            <Input
              value={newPassword}
              onChange={(e: any) =>
                setNewPassword(e?.target?.value ?? e)
              }
              label="New Password"
              type="password"
              placeholder="Enter New Password"
              required
            />
            {errors.newPassword && (
              <p className="text-xs text-red-500 mt-1">
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <Input
              value={confirmPassword}
              onChange={(e: any) =>
                setConfirmPassword(e?.target?.value ?? e)
              }
              label="Confirm Password"
              type="password"
              placeholder="Confirm New Password"
              required
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* API ERROR */}
          {errors.api && (
            <p className="text-sm text-red-500">{errors.api}</p>
          )}
        </div>

        {/* ACTION BUTTON */}
        <div className="flex justify-end pt-10">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Password"}
          </button>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      <PasswordSuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </>
  );
}