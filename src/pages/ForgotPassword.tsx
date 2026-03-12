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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(30);

  const navigate = useNavigate();

  /* ===================== TIMER ===================== */
  const startTimer = () => {
    setTimer(30);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /* ===================== SUBMIT ===================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email, Please check & Try Again");
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPassword({ email, userType });

      if (response.success) {
        setSuccess(true);
        startTimer();
      } else {
        setError(
          response.error?.message ||
            "Failed to process request. Please try again."
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to process request.");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== RESEND ===================== */
  const handleResend = async () => {
    if (!email) return;

    await forgotPassword({ email, userType });
    startTimer();
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

      <p className="text-sm text-gray-600 text-center mb-6">
        Enter your email and we'll send you a password reset link.
      </p>

      {/* ================= SUCCESS SCREEN ================= */}
      {success ? (
        <div className="text-center space-y-4 mt-6">
          <div className="flex justify-center">
            <Lock size={60} className="text-gray-700" />
          </div>

          <h2 className="text-xl font-semibold">
            Check your Email!
          </h2>

          <p className="text-sm text-gray-600 px-4">
            Thank you! We've sent an email with a link to verify your
            account ownership and reset your password. If you don’t
            see the email, please check your spam folder.
          </p>

          <div className="text-sm text-gray-600">
            Didn't receive the Email?{" "}
            {timer > 0 ? (
              <span className="text-yellow-600">
                Resend in 00:{timer < 10 ? `0${timer}` : timer}
              </span>
            ) : (
              <button
                className="text-yellow-600 hover:underline"
                onClick={handleResend}
              >
                Resend
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 justify-center text-gray-400 text-sm">
            <div className="h-px bg-gray-300 w-20"></div>
            Or
            <div className="h-px bg-gray-300 w-20"></div>
          </div>

          <div>
            <span className="text-gray-600 text-sm">
              Remember your Password?{" "}
            </span>
            <button
              className="text-yellow-600 hover:underline"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        </div>
      ) : (
        /* ================= FORM ================= */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Type */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-800">
              Account Type
            </label>

            <div className="grid grid-cols-3 gap-2">
              {["BusinessOwner", "Staff", "SuperAdmin"].map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={loading}
                  onClick={() => setUserType(type as UserType)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition
                    ${
                      userType === type
                        ? "bg-yellow-400 text-black"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }
                  `}
                >
                  {type === "BusinessOwner"
                    ? "Business Owner"
                    : type === "SuperAdmin"
                    ? "Super Admin"
                    : "Staff"}
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <InputField
            label="Email ID"
            type="email"
            placeholder="your-email@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            disabled={loading}
            error={error || undefined}
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-yellow-400 text-black font-medium hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;