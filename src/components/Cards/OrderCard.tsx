import { KDSOrder, KDSOrderItem, KDSDeliveryStatus } from "../../types/kds";
import { useState } from "react";
import { withOptimisticUpdate } from "../../utils/optimisticUpdate";

const DELIVERY_BADGE_STYLES: Record<KDSDeliveryStatus, { bg: string; text: string; border: string; label: string }> = {
  Assigned: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300", label: "Assigned" },
  PickedUp: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-300", label: "Picked Up" },
  InTransit: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-300", label: "In Transit" },
  Delivered: { bg: "bg-green-50", text: "text-green-700", border: "border-green-300", label: "Delivered" },
  Cancelled: { bg: "bg-red-50", text: "text-red-700", border: "border-red-300", label: "Cancelled" },
};

interface Props {
  order: KDSOrder;
  kotId?: string;
  orderId?: string;
  onStatusUpdate?: () => void;
}

const getItemBg = (status?: string) => {
  if (status === "ready") return "bg-green-200";
  if (status === "preparing") return "bg-yellow-200";
  return "";
};

const OrderCard = ({ order, kotId, orderId, onStatusUpdate }: Props) => {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [optimisticItems, setOptimisticItems] = useState<KDSOrderItem[] | null>(null);

  // Use optimistic items if available, otherwise use order items
  const displayItems = optimisticItems ?? order.items;

  const handleSelectAll = () => {
    const allIndices = new Set(order.items.map((_, idx) => idx));
    setSelectedItems(allIndices);
  };

  const handleUnselectAll = () => {
    setSelectedItems(new Set());
  };

  const handlePrepare = async () => {
    if (!kotId) {
      alert("KOT ID not available");
      return;
    }

    const originalItems = order.items;
    setIsUpdating(true);

    try {
      const { updateKOTStatus } = await import("../../services/kdsService");

      await withOptimisticUpdate({
        operation: async () => {
          const response = await updateKOTStatus(kotId, { status: "Preparing" });
          if (!response.success) {
            throw new Error(response.error?.message || "Failed to update status");
          }
          return response;
        },
        onOptimisticUpdate: () => {
          // Immediately show items as "preparing"
          setOptimisticItems(
            originalItems.map(item => ({ ...item, status: "preparing" as const }))
          );
        },
        onRollback: () => {
          setOptimisticItems(null);
        },
        errorMessage: "Failed to update KOT status. Reverting change.",
        onSuccess: () => {
          setOptimisticItems(null);
          onStatusUpdate?.();
        },
      });
    } catch {
      // withOptimisticUpdate already handled rollback and toast
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReady = async () => {
    if (!kotId) {
      alert("KOT ID not available");
      return;
    }

    const originalItems = order.items;
    setIsUpdating(true);

    try {
      const { updateKOTStatus } = await import("../../services/kdsService");

      await withOptimisticUpdate({
        operation: async () => {
          const response = await updateKOTStatus(kotId, { status: "Ready" });
          if (!response.success) {
            throw new Error(response.error?.message || "Failed to update status");
          }
          return response;
        },
        onOptimisticUpdate: () => {
          // Immediately show items as "ready"
          setOptimisticItems(
            originalItems.map(item => ({ ...item, status: "ready" as const }))
          );
        },
        onRollback: () => {
          setOptimisticItems(null);
        },
        errorMessage: "Failed to update KOT status. Reverting change.",
        onSuccess: () => {
          setOptimisticItems(null);
          onStatusUpdate?.();
        },
      });
    } catch {
      // withOptimisticUpdate already handled rollback and toast
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="border rounded-md bg-white">

      {/* Header */}
      <div className="flex justify-between items-center px-2 py-1 border-b">
        <span className="font-medium text-sm">{order.id}</span>
        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
          {order.time}
        </span>
      </div>

      {/* Meta */}
      <div className="px-2 py-1 text-xs text-gray-600 space-y-0.5">
        <div className="flex justify-between">
          <span>KOT No: {order.kot}</span>
          <span>{order.orderTime}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>
            {order.type}
            {order.source && ` | ${order.source}`}
          </span>
          {order.deliveryStatus && (
            <span className={`text-[10px] border px-1.5 py-0.5 rounded ${DELIVERY_BADGE_STYLES[order.deliveryStatus].bg} ${DELIVERY_BADGE_STYLES[order.deliveryStatus].text} ${DELIVERY_BADGE_STYLES[order.deliveryStatus].border}`}>
              {DELIVERY_BADGE_STYLES[order.deliveryStatus].label}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span>{order.table}</span>
          {order.trackingUrl && (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-600 hover:underline"
            >
              Track
            </a>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="divide-y">
        {displayItems.map((item, idx) => (
          <div
            key={idx}
            className={`px-2 py-1 text-xs ${getItemBg(item.status)}`}
          >
            <div className="font-medium">{item.name}</div>
            {item.variant && (
              <div className="italic text-gray-600">{item.variant}</div>
            )}
            <div className="flex justify-between items-center">
              <span>Qty: {item.qty}</span>

              {item.status === "ready" && (
                <span className="text-[10px] border border-green-600 text-green-700 px-1 rounded">
                  Ready
                </span>
              )}

              {item.status === "preparing" && (
                <span className="text-[10px] border border-yellow-600 text-yellow-700 px-1 rounded">
                  Preparing in 00:25:00
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer buttons (only where required) */}
      <div className="flex gap-2 p-2 border-t">
        <button
          className="text-xs border px-2 py-0.5 rounded hover:bg-gray-100 disabled:opacity-50"
          onClick={handleSelectAll}
          disabled={isUpdating}
        >
          Select All
        </button>
        <button
          className="text-xs border px-2 py-0.5 rounded hover:bg-gray-100 disabled:opacity-50"
          onClick={handleUnselectAll}
          disabled={isUpdating}
        >
          Unselect All
        </button>
        <button
          className="text-xs border px-2 py-0.5 rounded bg-yellow-100 hover:bg-yellow-200 disabled:opacity-50"
          onClick={handlePrepare}
          disabled={isUpdating || !kotId}
        >
          {isUpdating ? "Updating..." : "Prepare"}
        </button>
        <button
          className="text-xs border px-2 py-0.5 rounded bg-green-100 hover:bg-green-200 disabled:opacity-50"
          onClick={handleReady}
          disabled={isUpdating || !kotId}
        >
          {isUpdating ? "Updating..." : "Ready"}
        </button>
      </div>

    </div>
  );
};

export default OrderCard;
