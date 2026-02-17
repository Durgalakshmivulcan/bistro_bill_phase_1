import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/Auth/AuthLayout";
import InputField from "../components/Common/InputField";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { resetPassword } from "../services/authService";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [success, setSuccess] = useState(false);

  // Get token from URL on mount
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [searchParams]);

  // Validate password strength
  const validatePassword = (password: string): string => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    // Add more validation if needed
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationError("");

    // Validate token
    if (!token) {
      setError("Invalid reset token. Please request a new password reset link.");
      return;
    }

    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setValidationError(passwordError);
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword({ token, newPassword });

      if (response.success) {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(response.error?.message || "Failed to reset password. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
          <RotateCcw size={26} />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-center mb-2">
        Reset Password
      </h1>

      <p className="text-sm text-gray-600 text-center mb-6">
        Please set your new password.
      </p>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          <p className="text-sm">
            Password reset successfully! Redirecting to login...
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password */}
        <div>
          <InputField
            label="New Password"
            type={showNewPassword ? "text" : "password"}
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading || success}
            rightIcon={
              showNewPassword ? (
                <EyeOff
                  size={18}
                  className="text-gray-500 cursor-pointer"
                  onClick={() => setShowNewPassword(false)}
                />
              ) : (
                <Eye
                  size={18}
                  className="text-gray-500 cursor-pointer"
                  onClick={() => setShowNewPassword(true)}
                />
              )
            }
          />

          {/* Validation Error */}
          {validationError && (
            <p className="text-xs text-red-500 mt-1">
              {validationError}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <InputField
          label="Confirm New Password"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading || success}
          rightIcon={
            showConfirmPassword ? (
              <EyeOff
                size={18}
                className="text-gray-500 cursor-pointer"
                onClick={() => setShowConfirmPassword(false)}
              />
            ) : (
              <Eye
                size={18}
                className="text-gray-500 cursor-pointer"
                onClick={() => setShowConfirmPassword(true)}
              />
            )
          }
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || success || !token}
          className="
            w-full
            h-11
            rounded-lg
            bg-yellow-400
            text-black
            font-medium
            hover:bg-yellow-500
            transition
            disabled:opacity-50
            disabled:cursor-not-allowed
            flex
            items-center
            justify-center
            gap-2
          "
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              <span>Resetting...</span>
            </>
          ) : success ? (
            "Password Reset!"
          ) : (
            "Reset Password"
          )}
        </button>
      </form>

      {/* Back to Login */}
      <p className="text-sm text-center mt-4">
        Remember your password?{" "}
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="text-yellow-700 font-medium hover:underline"
        >
          Login
        </button>
      </p>
    </AuthLayout>
  );
};

export default ResetPassword;
