import { useEffect, useState } from "react";

import ProductBrowser from "../components/POSOrderTake/ProductBrowser";
import OrderSummary from "../components/POSOrderTake/OrderSummary";

import { Order } from "../components/POSOrderTake/OrderCard";
import { OnlineOrder } from "../components/POSOrderTake/OnlineOrderCard";
import POSHeader from "../layout/POSHeader";
import { useLocation, useNavigate } from "react-router-dom";

type AnyOrder = Order | OnlineOrder;

const POSOrdersPage: React.FC = () => {
  const [selectedOrder, setSelectedOrder] =
    useState<AnyOrder | null>(null);

  const [openSummary, setOpenSummary] =
    useState(false);

  const navigate = useNavigate();
  const location = useLocation();

useEffect(() => {
  if (location.state?.posEntry) {
    sessionStorage.setItem(
      "posEntry",
      location.state.posEntry
    );
  }
}, [location.state]);


 const handleBack = () => {
  const entryPath =
    sessionStorage.getItem("posEntry") ||
    sessionStorage.getItem("lastNonPOS") ||
    "/";

  sessionStorage.removeItem("posEntry");
  navigate(entryPath);
};



  // Order selection is handled by ProductBrowser component

  return (
    <div className="min-h-screen bg-bb-bg p-3 sm:p-4 lg:p-6">
      <POSHeader />

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleBack}
          className="text-[#655016] hover:opacity-80 transition text-lg"
          aria-label="Back"
        >
          ←
        </button>

        <h1 className="text-sm sm:text-base lg:text-lg font-medium text-[#655016]">
          Point Of Sale
        </h1>
      </div>

      {/* CONTENT */}
      <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[2.2fr_1fr]">

        {/* LEFT – ORDER LIST */}
        <div>
          <ProductBrowser
            onSelectOrder={(order: AnyOrder) => {
              setSelectedOrder(order);
              setOpenSummary(true);
            }}
          />
        </div>

        {/* RIGHT – DESKTOP SUMMARY */}
        <div className="hidden xl:block overflow-hidden min-w-0">
          {selectedOrder && (
            <OrderSummary order={selectedOrder} />
          )}
        </div>

        {/* MOBILE EDGE BUTTON */}
        {selectedOrder && (
          <button
            onClick={() => setOpenSummary(true)}
            className="
              fixed right-0 top-1/2 -translate-y-1/2 z-40 xl:hidden
              h-24 w-8 bg-gray-700 text-white rounded-l-full
              flex items-center justify-center shadow-lg
            "
          >
            &lt;
          </button>
        )}

        {/* MOBILE DRAWER */}
        {openSummary && selectedOrder && (
          <div className="fixed inset-0 z-50 xl:hidden">

            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpenSummary(false)}
            />

            {/* Panel */}
            <div
              className="
                absolute right-0 top-0
                h-full w-[90%] max-w-sm
                bg-white
                animate-slide-in
              "
            >
              <OrderSummary
                order={selectedOrder}
                onClose={() => setOpenSummary(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSOrdersPage;
