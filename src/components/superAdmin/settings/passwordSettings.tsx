import { useState } from "react";
import Input from "../../../components/form/Input";
import PasswordSuccessModal from "./passwordsuccessmodal";

export default function ManagePasswordSettings() {
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <>
      <div className="min-h-[70vh] flex flex-col">
        {/* FORM */}
        <div className="max-w-md w-full space-y-6">
          <Input
            value="12345"
            label="Old Password"
            type="password"
            placeholder="Enter Old Password"
          />

          <Input
            value="123456"
            label="New Password"
            type="password"
            placeholder="Enter New Password"
          />

          <Input
            value="12345"
            label="Confirm Password"
            type="password"
            placeholder="Confirm New Password"
          />
        </div>

        {/* ACTION BUTTON */}
        <div className="flex justify-end pt-10">
          <button
            onClick={() => setShowSuccess(true)} // ✅ open modal
            className="bg-yellow-400 px-6 py-2 rounded font-medium"
          >
            Save Password
          </button>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      <PasswordSuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </>
  );
}
