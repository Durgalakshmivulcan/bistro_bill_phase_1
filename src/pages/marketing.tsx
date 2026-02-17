import { Outlet, useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";


export default function MarketingPage() {
  const navigate = useNavigate();
  const location = useLocation();
 const isRootMarketing = location.pathname === "/marketing";

  return (
    <DashboardLayout>
      <div className="bg-bb-bg min-h-screen p-6 space-y-6">

        {/* SHOW THIS ONLY ON ROOT MARKETING PAGE */}
        {isRootMarketing && (
          <>
            <h1 className="text-2xl font-bold">Marketing</h1>

            <div className="space-y-4">
              <div className="p-3 bg-[#FFFAEB] border border-coloredborder">
              <div className="text-[20px] font-medium">Discounts</div>
              <button
                onClick={() => navigate("/marketing/discounts")}
                className="w-full text-left bg-[#FFFFFF] border px-4 py-3 rounded hover:border-yellow-400"
              >
                <div className="text-sm font-medium">Discounts</div>
                <div className="text-xs text-gray-500">
                  Setup discounts for items in catalog
                </div>
              </button>
              </div>
              <div className="p-3 bg-[#FFFAEB] border border-coloredborder">
              <div className="text-[20px] font-medium">Advertisements</div>
              <button
                onClick={() => navigate("/marketing/advertisements")}
                className="w-full text-left bg-[#FFFFFF] border px-4 py-3 rounded hover:border-yellow-400"
              >
                <div className="text-sm font-medium">Advertisements</div>
                <div className="text-xs text-gray-500">
                  Create, View, Modify Advertisements
                </div>
              </button>
              </div>
              <div className="p-3 bg-[#FFFAEB] border border-coloredborder">
              <div className="text-[20px] font-medium">Feedback</div>
              <button
                onClick={() => navigate("/marketing/feedbackCampaign")}
                className="w-full text-left bg-[#FFFFFF] border px-4 py-3 rounded hover:border-yellow-400"
              >
                <div className="text-sm font-medium">Feedback Campaign</div>
                <div className="text-xs text-gray-500">
                  Create, View, Modify Feedback Campaign
                </div>
              </button>
              </div>
              <div className="p-3 bg-[#FFFAEB] border border-coloredborder">
              <div className="text-[20px] font-medium">Feedback Response</div>
              <button
                onClick={() => navigate("/marketing/feedback_responses")}
                className="w-full text-left bg-[#FFFFFF] border px-4 py-3 rounded hover:border-yellow-400"
              >
                <div className="text-sm font-medium">Feedback Response</div>
                <div className="text-xs text-gray-500">
                  View Feedback Responses
                </div>
              </button>
              </div>
            </div>
          </>
        )}

        {/* CHILD ROUTES RENDER HERE */}
        <Outlet />
      </div>
    </DashboardLayout>
  );
}
