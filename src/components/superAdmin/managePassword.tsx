import Input from "../form/Input";
import DashboardLayout from "../../layout/DashboardLayout";
import { useState } from "react";
import PasswordSuccessModal from "./settings/passwordsuccessmodal";
import { changePassword } from "../../services/authService";

export default function ManagePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return "All fields are required";
    }

    if (newPassword.length < 8) {
      return "Password must be at least 8 characters long";
    }

    const strongRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!strongRegex.test(newPassword)) {
      return "Password must contain letters, numbers and special characters";
    }

    if (newPassword !== confirmPassword) {
      return "Passwords do not match";
    }

    return null;
  };

  const handleChangePassword = async () => {
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await changePassword(oldPassword, newPassword);

      if (response.success) {
        setShowSuccess(true);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(response.message || "Failed to change password");
      }
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="bg-bb-bg min-h-screen p-6 space-y-6">
        <h1 className="text-xl font-bold">Manage Password</h1>

        <div className="bg-bb-bg rounded-xl p-6 max-w-md space-y-4">

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <Input
            label="Old Password"
            type="password"
            value={oldPassword}
            onChange={setOldPassword}
            required
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
          />

          <button
            className="bg-yellow-400 w-full py-2 rounded font-medium mt-4 disabled:opacity-50"
            onClick={handleChangePassword}
            disabled={loading}
          >
            {loading ? "Updating..." : "Create New Password"}
          </button>
        </div>
      </div>

      <PasswordSuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </DashboardLayout>
  );
}