import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/Auth/AuthLayout";
import { Eye, EyeOff, RotateCcw, CheckCircle } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [strength, setStrength] = useState<"Weak" | "Fair" | "Strong" | null>(null);
  const [matchMessage, setMatchMessage] = useState<string | null>(null);

  /* ================= TOKEN ================= */
  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError("Invalid or expired reset link.");
    }
  }, [searchParams]);

  /* ================= PASSWORD STRENGTH ================= */
  useEffect(() => {
    if (!newPassword) {
      setStrength(null);
      return;
    }

    const strongRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    const mediumRegex =
      /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

    if (strongRegex.test(newPassword)) {
      setStrength("Strong");
    } else if (mediumRegex.test(newPassword)) {
      setStrength("Fair");
    } else {
      setStrength("Weak");
    }
  }, [newPassword]);

  /* ================= MATCH CHECK ================= */
  useEffect(() => {
    if (!confirmPassword) {
      setMatchMessage(null);
      return;
    }

    if (newPassword === confirmPassword) {
      setMatchMessage("matched");
    } else {
      setMatchMessage("not-matched");
    }
  }, [confirmPassword, newPassword]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Invalid reset link.");
      return;
    }

    if (strength === "Weak") {
      setError(
        "Password must be at least 8 characters long and contain letters, numbers and special characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password does not match. Please check.");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword({ token, newPassword });

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error?.message || "Failed to reset password.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SUCCESS SCREEN ================= */
  if (success) {
    return (
      <AuthLayout>
        <div className="text-center space-y-4">
          <CheckCircle size={60} className="mx-auto text-green-600" />

          <h2 className="text-2xl font-semibold">
            Password Changed!
          </h2>

          <p className="text-gray-600 text-sm">
            You've successfully completed your password reset!
          </p>

          <button
            onClick={() => navigate("/login")}
            className="w-full h-11 rounded-lg bg-yellow-400 text-black font-medium hover:bg-yellow-500 transition"
          >
            Login Now
          </button>
        </div>
      </AuthLayout>
    );
  }

  /* ================= MAIN FORM ================= */
  return (
    <AuthLayout>
      <div className="text-center mb-4">
        <RotateCcw size={60} className="mx-auto text-gray-700" />
      </div>

      <h1 className="text-2xl font-semibold text-center mb-2">
        Reset Password
      </h1>

      <p className="text-sm text-gray-600 text-center mb-6">
        Please kindly set your new password.
      </p>

      {error && (
        <p className="text-sm text-red-500 text-center mb-4">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* NEW PASSWORD */}
        <div>
          <label className="text-sm font-medium text-gray-800">
            New Password
          </label>

          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full h-11 rounded-lg px-4 pr-10 text-sm outline-none border transition
                ${
                  strength === "Weak"
                    ? "border-red-500"
                    : strength === "Fair"
                    ? "border-orange-400"
                    : strength === "Strong"
                    ? "border-green-500"
                    : "border-gray-300"
                }
              `}
            />

            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
          </div>

          {strength && (
            <p
              className={`text-xs mt-1 ${
                strength === "Weak"
                  ? "text-red-500"
                  : strength === "Fair"
                  ? "text-orange-500"
                  : "text-green-600"
              }`}
            >
              Password Strength: {strength}
            </p>
          )}
        </div>

        {/* CONFIRM PASSWORD */}
        <div>
          <label className="text-sm font-medium text-gray-800">
            Confirm New Password
          </label>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full h-11 rounded-lg px-4 pr-10 text-sm outline-none border transition
                ${
                  matchMessage === "not-matched"
                    ? "border-red-500"
                    : matchMessage === "matched"
                    ? "border-green-500"
                    : "border-gray-300"
                }
              `}
            />

            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
          </div>

          {matchMessage === "not-matched" && (
            <p className="text-xs text-red-500 mt-1">
              Password does not match. Please check.
            </p>
          )}

          {matchMessage === "matched" && (
            <p className="text-xs text-green-600 mt-1">
              Password matched!
            </p>
          )}
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg bg-yellow-400 text-black font-medium hover:bg-yellow-500 transition disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      <p className="text-sm text-center mt-4">
        Remember your Password?{" "}
        <button
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