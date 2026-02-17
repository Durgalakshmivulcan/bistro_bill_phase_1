import AuthLayout from "../components/Auth/AuthLayout";
import { BadgeCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PasswordChanged = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
          <BadgeCheck size={32} />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-center mb-2">
        Password Changed!
      </h1>

      {/* Description */}
      <p className="text-sm text-gray-600 text-center mb-6">
        You’ve successfully completed your password Reset!
      </p>

      {/* Button */}
      <button
        onClick={() => navigate("/login")}
        className="
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
        Login Now
      </button>
    </AuthLayout>
  );
};

export default PasswordChanged;
