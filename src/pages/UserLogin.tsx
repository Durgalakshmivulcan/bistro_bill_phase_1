import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AuthLayout from "../components/Auth/AuthLayout";
import InputField from "../components/Common/InputField";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { users } from "../data/usersLogin";
import { useAuth } from "../contexts/AuthContext";

const UserLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Get selected user from query params, fallback to first user
  const selectedUserId = searchParams.get("userId");
  const selectedUser = selectedUserId
    ? users.find((u) => u.id === selectedUserId) || users[0]
    : users[0];

  const handleLogin = async () => {
    try {
      await login("Staff", { email: selectedUser.id, password, branchId: "" });
      navigate("/");
    } catch {
      // Auth errors handled by AuthContext
    }
  };

  return (
    <AuthLayout>
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
          <LogIn size={26} />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-center mb-1">User Login</h1>
      <p className="text-sm text-gray-600 text-center mb-6">
        Login by entering Password
      </p>

      {/* Selected User */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={selectedUser.avatar}
            alt={selectedUser.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-medium">{selectedUser.name}</p>
            <p className="text-xs text-gray-500">User ID: {selectedUser.id}</p>
          </div>
        </div>

        <button
          onClick={() => navigate("/select-user")}
          className="text-sm text-yellow-600 hover:underline">
          Change user
        </button>
      </div>

      {/* Password */}
      <InputField
        label="Password"
        type={showPassword ? "text" : "password"}
        placeholder="eg:1234"
        value={password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        rightIcon={
          showPassword ? (
            <EyeOff
              size={18}
              className="text-gray-500"
              onClick={() => setShowPassword(false)}
            />
          ) : (
            <Eye
              size={18}
              className="text-gray-500"
              onClick={() => setShowPassword(true)}
            />
          )
        }
      />

      {/* Forgot password */}
      <div className="text-right mt-2">
        <button className="text-sm text-yellow-600 hover:underline">
          Forgot password?
        </button>
      </div>

      {/* Login Button */}
      <button
        onClick={handleLogin}
        className="
          mt-6
          w-full
          h-11
          rounded-lg
          bg-yellow-400
          text-black
          font-medium
          hover:bg-yellow-500
          transition
        "
      >
        Login
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-sm text-gray-500">Or</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      {/* Login with User ID */}
      <button
        className="
          w-full
          h-11
          rounded-lg
          border
          border-yellow-400
          text-black
          font-medium
          hover:bg-yellow-50
          transition
        "
      >
        Login with User ID
      </button>
    </AuthLayout>
  );
};

export default UserLogin;
