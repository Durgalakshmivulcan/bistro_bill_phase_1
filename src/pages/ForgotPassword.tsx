import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/Auth/AuthLayout";
import InputField from "../components/Common/InputField";
import { ArrowLeft, Lock } from "lucide-react";
import { forgotPassword } from "../services/authService";
import { UserType } from "../services/authService";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<UserType>("BusinessOwner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate email
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPassword({ email, userType });

      if (response.success) {
        setSuccess(true);
        // Note: Backend sends the same success message whether email exists or not (for security)
      } else {
        setError(response.error?.message || "Failed to process request. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate("/login")}
        className="flex items-center gap-1 text-sm text-yellow-700 mb-4 hover:text-yellow-800"
      >
        <ArrowLeft size={16} />
        Back to Login
      </button>

      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
          <Lock size={26} />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-center mb-2">
        Forgot your Password?
      </h1>

      {/* Description */}
      <p className="text-sm text-gray-600 text-center mb-6">
        Enter your email and we'll send you a password reset link.
      </p>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          <p className="text-sm">
            If an account with that email exists, a password reset link has been sent.
            Please check your email.
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
        {/* User Type Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-800">
            Account Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setUserType("BusinessOwner")}
              disabled={loading}
              className={`
                py-2 px-3 rounded-lg text-sm font-medium transition
                ${userType === "BusinessOwner"
                  ? "bg-yellow-400 text-black"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              Business Owner
            </button>
            <button
              type="button"
              onClick={() => setUserType("Staff")}
              disabled={loading}
              className={`
                py-2 px-3 rounded-lg text-sm font-medium transition
                ${userType === "Staff"
                  ? "bg-yellow-400 text-black"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              Staff
            </button>
            <button
              type="button"
              onClick={() => setUserType("SuperAdmin")}
              disabled={loading}
              className={`
                py-2 px-3 rounded-lg text-sm font-medium transition
                ${userType === "SuperAdmin"
                  ? "bg-yellow-400 text-black"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              Super Admin
            </button>
          </div>
        </div>

        {/* Email Input */}
        <InputField
          label="Email ID"
          type="email"
          placeholder="your-email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || success}
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
              <span>Sending...</span>
            </>
          ) : success ? (
            "Email Sent"
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
