import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import InputField from "../components/Common/InputField";
import AuthLayout from "../components/Auth/AuthLayout";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { UserType } from "../services/authService";
import { CRUDToasts } from "../utils/toast";

const Login = () => {
  const [userType, setUserType] = useState<UserType>("BusinessOwner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branchId, setBranchId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
  email?: string;
  password?: string;
  branchId?: string;
  general?: string;
}>({});

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get default dashboard based on user type
  const getDefaultDashboard = (userType: UserType): string => {
    switch (userType) {
      case "SuperAdmin":
        return "/superAdminDashboard";
      case "BusinessOwner":
        return "/bodashboard";
      case "Staff":
        return "/pos/takeOrder";
      default:
        return "/bodashboard";
    }
  };

  // Note: Redirect path is determined in handleSubmit based on user type

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const newErrors: typeof errors = {};

  if (!email.trim()) {
    newErrors.email = "Email ID is required";
  }

  if (!password.trim()) {
    newErrors.password = "Password is required";
  }

  if (userType === "Staff" && !branchId.trim()) {
    newErrors.branchId = "Branch ID is required";
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setLoading(true);

  try {
    if (userType === "Staff") {
      await login(userType, { email, password, branchId });
    } else {
      await login(userType, { email, password });
    }

    CRUDToasts.welcome(email.split("@")[0]);

    const redirectPath =
      (location.state as any)?.from?.pathname ||
      getDefaultDashboard(userType);

    navigate(redirectPath, { replace: true });
  } catch (err: any) {
    // 👇 Only set password error
    setErrors({
      password: "Invalid Email or password",
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <AuthLayout>
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center">
          <LogIn size={40} />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-center mb-1">
        Login
      </h1>
      <p className="text-sm text-gray-600 text-center mb-6">
        Enter Your details to get Login to Your Account
      </p>

      {/* Error Message */}
      {/* {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )} */}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Type Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-800">
            Login As
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
<InputField
  label="Email ID"
  type="email"
  value={email}
  onChange={(e) => {
    setEmail(e.target.value);
    setErrors((prev) => ({ ...prev, email: undefined }));
  }}
  disabled={loading}
  error={errors.email}
  placeholder="Email Id"
/>
<InputField
  label="Password"
  type={showPassword ? "text" : "password"}
  value={password}
  onChange={(e) => {
    setPassword(e.target.value);

    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  }}
  disabled={loading}
  placeholder="Enter your password"
  error={errors.password}
  rightIcon={
    showPassword ? (
      <EyeOff
        size={18}
        className="text-gray-500 cursor-pointer"
        onClick={() => setShowPassword(false)}
      />
    ) : (
      <Eye
        size={18}
        className="text-gray-500 cursor-pointer"
        onClick={() => setShowPassword(true)}
      />
    )
  }
/>
        {/* Branch ID field - only for Staff login */}
        {userType === "Staff" && (
  <>
    <InputField
      label="Branch ID"
      type="text"
      value={branchId}
      onChange={(e) => {
        setBranchId(e.target.value);
        setErrors((prev) => ({ ...prev, branchId: undefined }));
      }}
      disabled={loading}
      error={errors.branchId}
    />

    {errors.branchId && (
      <p className="text-xs text-red-500 mt-1">
        {errors.branchId}
      </p>
    )}
  </>
)}

        {/* Forgot password */}
        <div className="text-right">
          <button
            type="button"
            className="text-sm text-yellow-600 hover:underline"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot password?
          </button>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading}
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
              <span>Logging in...</span>
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
