import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ActivityTimeline from "../components/order-activity/ActivityTimeline";
import InvoiceCard from "../components/order-activity/InvoiceCard";
import { getOrder } from "../services/orderService";
import DashboardLayout from "../layout/DashboardLayout";
import { ErrorDisplay } from "../components/Common";

const OrderActivity = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderID } = location.state || {};

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderID) {
      setLoading(false);
      setError("Order not found. No order ID was provided.");
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getOrder(orderID);
        if (response.success && response.data) {
          setOrder(response.data.order);
        } else {
          setError(response.error?.message || "Failed to load order details.");
        }
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError("Failed to load order details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderID]);

  const handleRetry = () => {
    if (orderID) {
      setOrder(null);
      setLoading(true);
      setError(null);
      getOrder(orderID)
        .then((response) => {
          if (response.success && response.data) {
            setOrder(response.data.order);
          } else {
            setError(response.error?.message || "Failed to load order details.");
          }
        })
        .catch(() => {
          setError("Failed to load order details. Please try again.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  return (
    <DashboardLayout>
      <div className="bb-shell">
        <div className="bb-frame">
          <main className="flex-1 bg-[#FFFBF3] px-4 sm:px-6 lg:px-8 py-6">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bb-primary mr-3" />
                <span className="text-gray-600">Loading order details...</span>
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="max-w-lg mx-auto mt-10">
                <ErrorDisplay
                  message={error}
                  title={orderID ? "Error Loading Order" : "Order Not Found"}
                  onRetry={orderID ? handleRetry : undefined}
                />
                <div className="mt-4 text-center">
                  <button
                    onClick={() => navigate("/order-history")}
                    className="text-sm text-bb-primary hover:underline"
                  >
                    Back to Order History
                  </button>
                </div>
              </div>
            )}

            {/* Order Content */}
            {!loading && !error && order && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <ActivityTimeline order={order} />
                <InvoiceCard order={order} />
              </div>
            )}
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrderActivity;
