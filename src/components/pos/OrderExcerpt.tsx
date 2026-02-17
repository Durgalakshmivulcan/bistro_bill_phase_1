import { Order } from "../../services/orderService";

type Props = {
  order: Order;
  onOpen: () => void;
  onTransfer?: () => void;
};

const statusColors: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-800",
  Placed: "bg-blue-100 text-blue-800",
  InProgress: "bg-yellow-100 text-yellow-800",
  Ready: "bg-green-100 text-green-800",
  Completed: "bg-green-200 text-green-900",
  Cancelled: "bg-red-100 text-red-800",
  OnHold: "bg-orange-100 text-orange-800",
};

const OrderExcerpt = ({ order, onOpen, onTransfer }: Props) => {
  const items = order.items ?? [];
  const statusClass = statusColors[order.status] ?? "bg-yellow-100 text-yellow-800";

  return (
    <div className="fixed right-4 bottom-4 z-40 w-[300px] bg-white border rounded-lg shadow-lg p-4">
      <div className="flex justify-between mb-2">
        <div>
          <p className="font-semibold text-sm">
            #{order.orderNumber}
          </p>
          <p className="text-xs text-gray-500">
            {order.tableId ? `Table ${order.tableId} • ` : ""}{order.type}
          </p>
        </div>

        <span className={`text-xs px-2 py-1 rounded ${statusClass}`}>
          {order.status}
        </span>
      </div>

      <div className="text-sm space-y-1 mb-3">
        {items.length === 0 ? (
          <p className="text-xs text-gray-400">No items</p>
        ) : (
          <>
            {items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex justify-between"
              >
                <span className="truncate">
                  {item.productName}
                </span>
                <span>× {item.quantity}</span>
              </div>
            ))}

            {items.length > 3 && (
              <p className="text-xs text-gray-400">
                +{items.length - 3} more items
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex justify-between items-center">
        <p className="font-semibold">
          ₹ {order.total}
        </p>

        <button
          onClick={onOpen}
          className="bg-black text-white px-3 py-1 rounded text-sm"
        >
          Open
        </button>
      </div>
    </div>
  );
};

export default OrderExcerpt;
