import AuthLayout from "../components/Auth/AuthLayout";
import { MailCheck } from "lucide-react";

const CheckEmail = () => {
  return (
    <AuthLayout>
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
          <MailCheck size={30} />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-center mb-3">
        Check your Email!
      </h1>

      {/* Description */}
      <p className="text-sm text-gray-600 text-center leading-relaxed mb-6">
        Thank you! We’ve sent an email with a link to verify your account
        ownership and reset your password. If you don’t see the email,
        please check your spam folder.
      </p>

      {/* Resend */}
      <p className="text-sm text-center mb-4">
        Didn't receive the Email?{" "}
        <span className="text-yellow-700 font-medium cursor-pointer">
          Resend in 00:30
        </span>
      </p>

      {/* Divider */}
      <div className="flex items-center gap-4 my-4">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-sm text-gray-500">Or</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      {/* Back to Login */}
      <p className="text-sm text-center">
        Remember your Password?{" "}
        <span className="text-yellow-700 font-medium cursor-pointer">
          Login
        </span>
      </p>
    </AuthLayout>
  );
};

export default CheckEmail;
