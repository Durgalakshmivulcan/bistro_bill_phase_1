import Input from "../form/Input";
import DashboardLayout from "../../layout/DashboardLayout";
import { useState } from "react";
import PasswordSuccessModal from "./settings/passwordsuccessmodal";
// import PasswordSuccessModal from "./passwordsuccessmodal";

export default function ManagePassword() {
const [showSuccess, setShowSuccess] = useState(false);

    return (
        <DashboardLayout>
            <div className="bg-bb-bg min-h-screen p-6 space-y-6">
                <h1 className="text-xl font-bold">Manage Password</h1>

                <div className="bg-bb-bg rounded-xl p-6 max-w-md space-y-4">
                    <div>
                        <Input
                            label="Old Password"
                            type="password"
                            value="Admin@2025"
                        />

                        <p className="text-xs text-red-500 mt-1">
                            Please enter a valid password.
                        </p>
                    </div>
                    <div>
                        <Input
                            label="New Password"
                            type="password"
                            placeholder="Enter New Password"
                        />
                        <p className="text-xs text-red-500 mt-1">
                            Password must be at least 8 characters long and contain letters, numbers and special characters.
                        </p>
                        <p className="text-xs text-red-500 mt-1">
                            <span className="text-xs text-black mt-1">Password Steanth:</span> Week
                        </p>
                    </div>
                    <Input label="Confirm New Password" />

                    <button className="bg-yellow-400 w-full py-2 rounded font-medium mt-4"
                     onClick={() => setShowSuccess(true)}
                    >
                        
                        Create New Password
                    </button>
                </div>
            </div>
            <PasswordSuccessModal
                open={showSuccess}
                onClose={() => setShowSuccess(false)}
            />
        </DashboardLayout>
     
    
    );
}
