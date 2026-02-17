import { useState } from "react";
import AuthLayout from "../components/Auth/AuthLayout";
import InputField from "../components/Common/InputField";
import { Eye, EyeOff, LogIn } from "lucide-react";

const BusinessOwnerLogin = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthLayout>
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
          <LogIn size={26} />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-center mb-1">
        Login With Email
      </h1>
      <p className="text-sm text-gray-600 text-center mb-6">
        Enter Your details to get Login to Your Account
      </p>

      {/* Inputs */}
      <div className="space-y-4">
        <InputField
          label="Email ID/User ID"
          placeholder="Email ID/User ID"
        />

        <InputField
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="eg:1234"
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
      </div>

      {/* Forgot password */}
      <div className="text-right mt-2">
        <button className="text-sm text-yellow-600 hover:underline">
          Forgot password?
        </button>
      </div>

      {/* Login Button */}
      <button
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

      {/* Select User Button */}
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
        Select User
      </button>
    </AuthLayout>
  );
};

export default BusinessOwnerLogin;
