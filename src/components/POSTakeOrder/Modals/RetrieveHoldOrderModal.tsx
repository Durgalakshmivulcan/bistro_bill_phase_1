import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getHeldOrders, retrieveHeldOrder } from "../../../services/orderService";
import type { Order } from "../../../services/orderService";
import { useAuth } from "../../../contexts/AuthContext";

interface RetrieveHoldOrderModalProps {
  open: boolean;
  onClose: () => void;
  onRetrieve?: (order: Order) => void;
}

const RetrieveHoldOrderModal = ({
  open,
  onClose,
  onRetrieve,
}: RetrieveHoldOrderModalProps) => {
  const [heldOrders, setHeldOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      loadHeldOrders();
    }
  }, [open]);

  const loadHeldOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get branchId from user context
      let branchId: string | undefined;

      if (user?.userType === 'Staff') {
        branchId = user.branch?.id;
      } else if (user?.userType === 'BusinessOwner') {
        branchId = user.branches?.find(b => b.isMainBranch)?.id || user.branches?.[0]?.id;
      }

      if (!branchId) {
        setError("Branch information not found. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await getHeldOrders(branchId);

      if (response.success && response.data) {
        setHeldOrders(response.data.orders);
      } else {
        setError(response.error?.message || "Failed to load held orders");
      }
    } catch (err) {
      setError("Error loading held orders");
      console.error("Error loading held orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrieve = async (orderId: string) => {
    try {
      const response = await retrieveHeldOrder(orderId);

      if (response.success && response.data) {
        // Call the onRetrieve callback with the retrieved order
        if (onRetrieve) {
          onRetrieve(response.data.order);
        }
        onClose();
      } else {
        setError("Failed to retrieve order");
      }
    } catch (err) {
      setError("Error retrieving order");
      console.error("Error retrieving order:", err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Retrieve Held Orders</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-bb-primary border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Loading held orders...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          {!loading && !error && heldOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No held orders found
            </div>
          )}

          {!loading && !error && heldOrders.length > 0 && (
            <div className="space-y-3">
              {heldOrders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">
                        {order.orderNumber}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {order.customerName || "Walk-in Customer"}
                        {order.tableId && ` • Table: ${order.tableId}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        Items: {order.items?.length || 0} • Total: ₹
                        {order.total.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Held at: {new Date(order.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRetrieve(order.id)}
                      className="ml-4 px-4 py-2 bg-bb-primary hover:bg-bb-primary/90 text-black font-medium rounded-lg transition"
                    >
                      Retrieve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RetrieveHoldOrderModal;
