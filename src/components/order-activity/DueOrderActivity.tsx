import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import { getOrder, Order } from "../../services/orderService";

const DueOrderActivity: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError("Order ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getOrder(orderId);

        if (response.data?.order) {
          setOrder(response.data.order);
        } else {
          setError("Order not found");
        }
      } catch (err: any) {
        console.error("Error fetching order:", err);
        setError(err.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const formatCurrency = (amount: number) => {
    return `₹ ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const formatDateTime = (dateString: string) => {
    return `on ${formatDate(dateString)} at ${formatTime(dateString)}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="bg-[#FFFBF2] min-h-screen px-6 py-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout>
        <div className="bg-[#FFFBF2] min-h-screen px-6 py-6">
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-auto mt-20">
            <h2 className="text-xl font-semibold mb-2 text-red-600">
              {error || "Order not found"}
            </h2>
            <p className="text-gray-600">
              {orderId
                ? `Unable to load details for order ${orderId}`
                : "No order ID provided"}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-[#FFFBF2] min-h-screen px-6 py-6">
        {/* PAGE TITLE */}
        <h2 className="text-xl font-semibold mb-1">Order Activity Log</h2>
        <p className="text-sm text-gray-600 mb-6">
          Detail information about Order Number{" "}
          <span className="font-semibold">#{order.orderNumber}</span>
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ================= LEFT : TIMELINE ================= */}
          <div className="relative pl-10">
            {/* Continuous yellow line */}
            <div className="absolute left-[50px] top-[24px] bottom-[24px] w-[2px] bg-yellow-400" />

            {order.timeline && order.timeline.length > 0 ? (
              order.timeline.map((item, index) => {
                // Determine if this is an order-closed event
                const isClosedEvent = item.eventType.toLowerCase().includes('closed');
                const inactive = isClosedEvent && order.status !== 'Completed';

                return (
                  <div key={index} className="relative flex gap-4 mb-6">
                    {/* Tick */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10
                        ${
                          inactive
                            ? "bg-gray-300 text-white"
                            : "bg-yellow-400 text-black"
                        }`}
                    >
                      ✓
                    </div>

                    {/* Content */}
                    <div>
                      <p className="font-medium">{item.eventType}</p>

                      {item.eventData && (
                        <p className="text-xs text-gray-500">
                          {typeof item.eventData === "string"
                            ? item.eventData
                            : JSON.stringify(item.eventData)}
                        </p>
                      )}

                      {!inactive && (
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDateTime(item.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-gray-500 text-sm">
                No timeline information available
              </div>
            )}
          </div>

          {/* ================= RIGHT : INVOICE ================= */}
          <div className="bg-white rounded-xl border shadow-sm p-6 max-w-[420px]">
            {/* Invoice Header */}
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">
                Invoice:{" "}
                <span className="font-medium text-black">
                  {order.orderNumber}
                </span>
              </p>
              <button className="text-gray-500 hover:text-black">🖨</button>
            </div>

            {/* Business Info - Placeholder */}
            <div className="text-center mb-4">
              <p className="font-semibold">Restaurant Name</p>
              <p className="text-xs text-gray-500">Branch Information</p>
            </div>

            <hr className="my-3" />

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-y-2 text-xs mb-4">
              <Meta label="Date" value={formatDate(order.createdAt)} />
              <Meta label="Time" value={formatTime(order.createdAt)} />
              <Meta label="Order Type" value={order.type} />
              <Meta label="Status" value={order.status} />
              {order.customerName && (
                <Meta label="Customer" value={order.customerName} />
              )}
              {order.tableId && <Meta label="Table" value={order.tableId} />}
            </div>

            <hr className="my-3" />

            {/* Items */}
            <Row header left="Items" mid="Qty" right="Price" />
            {order.items && order.items.length > 0 ? (
              order.items.map((item, idx) => (
                <Row
                  key={idx}
                  left={item.productName}
                  mid={item.quantity.toString()}
                  right={formatCurrency(item.totalPrice)}
                />
              ))
            ) : (
              <div className="text-gray-500 text-center py-2">
                No items found
              </div>
            )}

            <hr className="my-3" />

            {/* Summary */}
            <Summary label="Subtotal" value={formatCurrency(order.subtotal)} />
            <Summary
              label="Discount sales"
              value={`- ${formatCurrency(order.discountAmount)}`}
            />
            <Summary
              label="Total Tax"
              value={formatCurrency(order.taxAmount)}
            />

            <hr className="my-3" />

            <Summary label="Total" value={formatCurrency(order.total)} bold />

            {order.paidAmount > 0 && (
              <Summary
                label="Paid"
                value={formatCurrency(order.paidAmount)}
              />
            )}

            <Summary
              label="Due Amount"
              value={formatCurrency(order.dueAmount)}
            />

            <p className="text-center text-sm mt-6">Thank You Visit Again</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DueOrderActivity;

/* ================= HELPERS ================= */

const Meta = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <p>
    <span className="text-gray-500">{label}:</span>{" "}
    <span className="font-medium">{value}</span>
  </p>
);

const Row = ({
  left,
  mid,
  right,
  header,
}: {
  left: string;
  mid: string;
  right: string;
  header?: boolean;
}) => (
  <div
    className={`grid grid-cols-3 py-1 ${
      header ? "font-medium text-xs text-gray-500" : "text-sm"
    }`}
  >
    <span>{left}</span>
    <span className="text-center">{mid}</span>
    <span className="text-right">{right}</span>
  </div>
);

const Summary = ({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) => (
  <div
    className={`flex justify-between py-1 ${
      bold ? "font-semibold" : "text-sm"
    }`}
  >
    <span>{label}</span>
    <span>{value}</span>
  </div>
);
