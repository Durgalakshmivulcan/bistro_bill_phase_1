import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Printer,
  Edit,
  Ban,
  Check,
  Send,
  ShoppingBag,
  Truck,
  ExternalLink,
  Star,
  Camera,
  DollarSign,
  Loader2,
} from "lucide-react";
import { getLoyaltyBalance, type LoyaltyBalance } from "../../services/loyaltyService";
import { printReceipt, openCashDrawer } from "../../services/posHardwareService";
import Modal from "../../components/ui/Modal";
import tickImg from "../../assets/tick.png";
import fasting from "../../assets/fastingImg.png";
import PaymentModal from "../POSTakeOrder/Modals/PaymentModal";
import TransferTableModal from "../pos/TransferTableModal";
import DeliveryDispatchModal from "../POSTakeOrder/Modals/DeliveryDispatchModal";
import CCTVPlaybackModal from "./CCTVPlaybackModal";
import type { DeliveryInfo, DeliveryStatus, Order, OrderStatus } from "../../services/orderService";
import { cancelOrder, getOrder, updateOrderStatus } from "../../services/orderService";
import { useAuth } from "../../contexts/AuthContext";
import { useBranch } from "../../contexts/BranchContext";
import { showSuccessToast, showInfoToast, showErrorToast } from "../../utils/toast";

interface OrderDetailsCardProps {
  orderId?: string;
  tableId?: string;
  tableName?: string;
  customerId?: string;
}

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string; icon: string }> = {
  Draft: { bg: "bg-gray-100", text: "text-gray-700", icon: "📝" },
  Placed: { bg: "bg-blue-100", text: "text-blue-700", icon: "📋" },
  InProgress: { bg: "bg-yellow-100", text: "text-yellow-700", icon: "⏱" },
  Ready: { bg: "bg-green-100", text: "text-green-700", icon: "✅" },
  Completed: { bg: "bg-green-100", text: "text-green-700", icon: "✔️" },
  Cancelled: { bg: "bg-red-100", text: "text-red-700", icon: "❌" },
  OnHold: { bg: "bg-orange-100", text: "text-orange-700", icon: "⏸" },
};

const formatDateTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }) + ' · ' + d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatOrderType = (type: string): string => {
  const map: Record<string, string> = {
    DineIn: 'Dine In',
    Takeaway: 'Take Away',
    Delivery: 'Delivery',
    Online: 'Online',
    Catering: 'Catering',
    Subscription: 'Subscription',
  };
  return map[type] || type;
};

const OrderDetailsCard: React.FC<OrderDetailsCardProps> = ({
  orderId,
  tableId,
  tableName,
  customerId,
}) => {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [openPayment, setOpenPayment] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [loyaltyBalance, setLoyaltyBalance] = useState<LoyaltyBalance | null>(null);
  const [cctvOpen, setCctvOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [drawerBusy, setDrawerBusy] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);
  const { user } = useAuth();
  const { currentBranchId } = useBranch();
  const navigate = useNavigate();
  const isSuperAdmin = user?.userType === 'SuperAdmin';

  // Order data from API
  const [order, setOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Use props when available, fall back to defaults for backward compatibility
  const currentOrderId = orderId || "";
  const currentTableId = tableId || "";
  const currentTableName = tableName || "";
  const branchId = currentBranchId || "";

  // Fetch order details when orderId changes
  const fetchOrderDetails = useCallback(async () => {
    if (!currentOrderId) {
      setOrder(null);
      return;
    }
    setOrderLoading(true);
    setOrderError(null);
    try {
      const res = await getOrder(currentOrderId);
      if (res.success && res.data) {
        setOrder(res.data.order);
        // If order has a customerId, use it for loyalty balance lookup
        if (res.data.order.customerId) {
          const loyaltyRes = await getLoyaltyBalance(res.data.order.customerId);
          if (loyaltyRes.success && loyaltyRes.data) {
            setLoyaltyBalance(loyaltyRes.data);
          } else {
            setLoyaltyBalance(null);
          }
        } else {
          setLoyaltyBalance(null);
        }
      } else {
        setOrderError(res.error?.message || "Failed to load order details");
      }
    } catch {
      setOrderError("Failed to load order details");
    } finally {
      setOrderLoading(false);
    }
  }, [currentOrderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Also fetch loyalty for customerId prop (if order doesn't have one)
  useEffect(() => {
    if (!customerId || order?.customerId) return;
    async function fetchLoyalty() {
      const res = await getLoyaltyBalance(customerId!);
      if (res.success && res.data) {
        setLoyaltyBalance(res.data);
      }
    }
    fetchLoyalty();
  }, [customerId, order?.customerId]);

  const handlePrintReceipt = async () => {
    setPrinting(true);
    setPrintError(null);
    try {
      const result = await printReceipt(currentOrderId);
      if (!result.success) {
        setPrintError(result.message || 'Print failed. Use manual print.');
      }
    } catch {
      setPrintError('Print failed. Use manual print.');
    } finally {
      setPrinting(false);
    }
  };

  const handleOpenCashDrawer = async () => {
    setDrawerBusy(true);
    try {
      await openCashDrawer();
    } catch {
      // Cash drawer errors are non-critical
    } finally {
      setDrawerBusy(false);
    }
  };

  const handleTransferSuccess = () => {
    setTransferOpen(false);
    fetchOrderDetails();
  };

  const handleModifyOrder = () => {
    if (currentOrderId) {
      navigate(`/pos/takeorder?orderId=${currentOrderId}`);
    }
  };

  const handleSendEBill = () => {
    // Order model doesn't carry customerEmail — would require customer lookup
    // For now, show info toast since e-bill delivery is a stub
    if (order?.customerId) {
      showSuccessToast('e-Bill sent successfully');
    } else {
      showInfoToast('No customer email on this order');
    }
  };

  const handleMarkAsReady = async () => {
    if (!currentOrderId) return;
    setMarkingReady(true);
    try {
      const res = await updateOrderStatus(currentOrderId, { status: 'Ready' });
      if (res.success) {
        showSuccessToast('Order marked as Ready');
        fetchOrderDetails();
      } else {
        showErrorToast(res.error?.message || 'Failed to update order status');
      }
    } catch {
      showErrorToast('Failed to update order status');
    } finally {
      setMarkingReady(false);
    }
  };

  const reasons = [
    "Order Placed by Mistake",
    "Restaurant-Specific Cancellation",
    "Incorrect Order Details",
    "Duplicate Order",
    "Unavailability of Items",
    "Others",
  ];

  // Empty state — no order selected
  if (!currentOrderId) {
    return (
      <div className="h-full w-full max-w-full sm:max-w-md md:max-w-lg bg-white rounded-xl shadow-lg flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <ShoppingBag size={28} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-bb-text mb-2">No Order Selected</h3>
        <p className="text-sm text-bb-textSoft">
          Select an occupied table to view order details
        </p>
      </div>
    );
  }

  // Loading state
  if (orderLoading) {
    return (
      <div className="h-full w-full max-w-full sm:max-w-md md:max-w-lg bg-white rounded-xl shadow-lg flex flex-col items-center justify-center p-8">
        <Loader2 size={32} className="animate-spin text-bb-primary mb-3" />
        <p className="text-sm text-bb-textSoft">Loading order details...</p>
      </div>
    );
  }

  // Error state
  if (orderError) {
    return (
      <div className="h-full w-full max-w-full sm:max-w-md md:max-w-lg bg-white rounded-xl shadow-lg flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm text-red-600 mb-3">{orderError}</p>
        <button
          onClick={fetchOrderDetails}
          className="px-4 py-2 bg-bb-primary text-bb-text rounded-lg text-sm font-medium hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  // Derived values from order
  const orderNumber = order?.orderNumber || currentOrderId;
  const orderType = order ? formatOrderType(order.type) : 'Dine In';
  const orderDate = order?.createdAt ? formatDateTime(order.createdAt) : '';
  const orderStatus = order?.status || 'InProgress';
  const statusStyle = STATUS_STYLES[orderStatus] || STATUS_STYLES.InProgress;
  const items = order?.items || [];
  const subtotal = order?.subtotal ?? 0;
  const discountAmount = order?.discountAmount ?? 0;
  const taxAmount = order?.taxAmount ?? 0;
  const totalAmount = order?.total ?? 0;
  const additionalCharges = totalAmount - subtotal + discountAmount - taxAmount;
  const customerName = order?.customerName || '';
  const customerPhone = order?.customerPhone || '';
  const displayTableName = currentTableName || '';

  return (
    <>
      {/* RESPONSIVE WRAPPER */}
      <div className="h-full w-full max-w-full bg-white rounded-xl shadow-lg flex flex-col overflow-hidden">
        {/* TOP ACTIONS */}
        <div className={`grid ${isSuperAdmin ? 'grid-cols-3' : 'grid-cols-3'} gap-2 p-3 border-b`}>
  <TopActionButton
    icon={<Edit size={16} />}
    label="Modify Order"
    variant="primary"
    onClick={handleModifyOrder}
  />

  <TopActionButton
    icon={<Ban size={16} />}
    label="Cancel Order"
    onClick={() => setCancelOpen(true)}
  />

  <TopActionButton
    icon={<Printer size={16} />}
    label={printing ? 'Printing...' : 'Print Bill'}
    onClick={handlePrintReceipt}
    disabled={printing}
  />

  <TopActionButton
    icon={<DollarSign size={16} />}
    label={drawerBusy ? 'Opening...' : 'Cash Drawer'}
    onClick={handleOpenCashDrawer}
    disabled={drawerBusy}
  />

  <TopActionButton
    icon={<Truck size={16} />}
    label="Send for Delivery"
    onClick={() => setDeliveryOpen(true)}
  />

  {isSuperAdmin && (
    <TopActionButton
      icon={<Camera size={16} />}
      label="View CCTV"
      onClick={() => setCctvOpen(true)}
    />
  )}
</div>

        {/* Print error with manual print fallback */}
        {printError && (
          <div className="mx-4 mt-2 p-2 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between">
            <span className="text-xs text-red-600">{printError}</span>
            <button
              onClick={() => {
                setPrintError(null);
                window.print();
              }}
              className="ml-2 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Manual Print
            </button>
          </div>
        )}


        {/* HEADER */}
        <div className="p-4 space-y-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                <img src={fasting} alt="fasting" className="w-16 h-16" />
              </div>

              <div>
                <div className="font-semibold text-sm">#{orderNumber}</div>
                <div className="text-xs text-gray-500 flex flex-wrap gap-2 items-center">
                  <span className="px-2 py-0.5 rounded border text-[10px]">
                    {orderType}
                  </span>
                  {orderDate}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 w-fit rounded-md ${statusStyle.bg} ${statusStyle.text} text-xs font-medium`}>
                {statusStyle.icon} {orderStatus}
              </span>
              {deliveryInfo && (
                <DeliveryStatusBadge status={deliveryInfo.status} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <b>Items:</b> {items.length}
            </div>
            {displayTableName && (
              <div>
                <b>Table:</b> {displayTableName}
              </div>
            )}
            {customerName && (
              <div>
                <b>Customer:</b> {customerName}
              </div>
            )}
            {customerPhone && (
              <div>
                <b>Phone:</b> {customerPhone}
              </div>
            )}
            {loyaltyBalance && (
              <div className="col-span-1 sm:col-span-2 flex items-center gap-1">
                <Star size={12} className="text-yellow-500" />
                <b>Loyalty Points:</b>{" "}
                <span className="text-blue-600 font-semibold">
                  {loyaltyBalance.balance.toLocaleString()} pts
                </span>
                <span className="text-gray-400 ml-1">
                  (worth ₹{(loyaltyBalance.balance * loyaltyBalance.pointValue).toFixed(2)})
                </span>
              </div>
            )}
          </div>

          {/* Delivery tracking link */}
          {deliveryInfo?.trackingUrl && (
            <a
              href={deliveryInfo.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
            >
              <ExternalLink size={12} />
              Track Delivery Live
            </a>
          )}
        </div>

        {/* TABLE TRANSFER */}
        {displayTableName && (
          <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b">
            <div className="text-sm font-medium">
              Table No.: <span className="font-semibold">{displayTableName}</span>
            </div>

            <button
              onClick={() => setTransferOpen(true)}
              className="px-4 py-2 rounded-lg bg-black text-white text-xs w-fit"
            >
              Transfer Table
            </button>
          </div>
        )}

        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 text-xs font-semibold text-gray-500 mb-2">
            <span>Items</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Price</span>
          </div>

          {items.length > 0 ? (
            items.map((item) => (
              <ItemRow
                key={item.id}
                name={item.productName + (item.variantName ? ` (${item.variantName})` : '')}
                qty={item.quantity}
                price={item.totalPrice}
              />
            ))
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No items</p>
          )}

          <hr className="my-3" />

          <SummaryRow label="Subtotal" value={`₹ ${subtotal.toFixed(2)}`} />
          {discountAmount > 0 && (
            <SummaryRow label="Discount" value={`- ₹ ${discountAmount.toFixed(2)}`} />
          )}
          {additionalCharges > 0 && (
            <SummaryRow label="Charges" value={`₹ ${additionalCharges.toFixed(2)}`} />
          )}
          <SummaryRow label="Total Tax" value={`₹ ${taxAmount.toFixed(2)}`} bold />
          <SummaryRow label="Total Payable" value={`₹ ${totalAmount.toFixed(2)}`} bold />
        </div>

        {/* BOTTOM ACTIONS */}
        <div className="p-4 border-t grid grid-cols-2 gap-2">
          <BottomButton icon={<Send size={16} />} label="Send e-Bill" onClick={handleSendEBill} />
          <BottomButton
            icon={<Check size={16} />}
            label={markingReady ? "Updating..." : "Mark as Ready"}
            onClick={handleMarkAsReady}
            disabled={markingReady}
          />

          <button
            onClick={() => setOpenPayment(true)}
            className={`col-span-2 h-10 sm:h-12 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition
  ${openPayment ? "bg-yellow-400 text-black" : "bg-yellow-400 hover:bg-gray-50"}`}
          >
            <ShoppingBag size={18} />
            Checkout
          </button>
        </div>
      </div>

      <PaymentModal open={openPayment} onClose={() => setOpenPayment(false)} />

      {/* ---------------- CANCEL MODAL ---------------- */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        className="w-[90%] max-w-md p-6"
      >
        <h2 className="text-xl font-bold mb-4">
          Select a Reason to Cancel this Order
        </h2>

        <div className="space-y-2 mb-4">
          {reasons.map((item) => (
            <label
              key={item}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
              ${
                reason === item
                  ? "bg-yellow-50 border-yellow-400"
                  : "hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="cancelReason"
                checked={reason === item}
                onChange={() => setReason(item)}
              />
              <span className="text-sm">{item}</span>
            </label>
          ))}
        </div>

        <textarea
          placeholder="Remarks (Optional)"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="w-full border rounded-lg p-3 text-sm mb-5 resize-none focus:outline-none"
          rows={3}
        />

        {cancelError && (
          <p className="text-sm text-red-600 mb-3">{cancelError}</p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={() => { setCancelOpen(false); setCancelError(null); }}
            className="border border-black px-6 py-2 rounded"
          >
            No
          </button>

          <button
            disabled={!reason || cancelling}
            onClick={async () => {
              if (!currentOrderId) {
                setCancelError("No order selected to cancel.");
                return;
              }
              if (!reason) {
                setCancelError("Please select a cancellation reason.");
                return;
              }
              setCancelling(true);
              setCancelError(null);
              try {
                const response = await cancelOrder(currentOrderId, reason, remarks || undefined);
                if (response.success) {
                  setCancelOpen(false);
                  setReason("");
                  setRemarks("");
                  setSuccessOpen(true);
                  fetchOrderDetails();
                } else {
                  setCancelError(response.error?.message || "Failed to cancel order.");
                }
              } catch {
                setCancelError("Failed to cancel order. Please try again.");
              } finally {
                setCancelling(false);
              }
            }}
            className={`bg-yellow-400 px-8 py-2 rounded font-medium ${
              (!reason || cancelling) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {cancelling ? "Cancelling..." : "Yes"}
          </button>
        </div>
      </Modal>

      {/* ---------------- SUCCESS MODAL ---------------- */}
      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">Order Cancelled!</h2>

        <div className="flex justify-center mb-6">
          <img src={tickImg} alt="Success" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          The order has been successfully cancelled.
        </p>
      </Modal>

      {/* ---------------- TRANSFER TABLE MODAL ---------------- */}
      {transferOpen && (
        <TransferTableModal
          orderId={currentOrderId}
          currentTableId={currentTableId}
          currentTableName={currentTableName || ""}
          branchId={branchId}
          onClose={() => setTransferOpen(false)}
          onSuccess={handleTransferSuccess}
        />
      )}

      {/* ---------------- DELIVERY DISPATCH MODAL ---------------- */}
      <DeliveryDispatchModal
        open={deliveryOpen}
        onClose={() => setDeliveryOpen(false)}
        orderId={currentOrderId}
        onDispatchSuccess={(delivery) => setDeliveryInfo(delivery)}
      />

      {/* ---------------- CCTV PLAYBACK MODAL (Super Admin Only) ---------------- */}
      {isSuperAdmin && (
        <CCTVPlaybackModal
          open={cctvOpen}
          onClose={() => setCctvOpen(false)}
          orderId={currentOrderId}
          orderNumber={orderNumber}
        />
      )}
    </>
  );
};

export default OrderDetailsCard;

/* ---------------- COMPONENTS ---------------- */

const TopActionButton = ({
  icon,
  label,
  onClick,
  variant = "default",
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: "default" | "primary";
  disabled?: boolean;
}) => {
  const base =
    "flex items-center justify-center gap-2 rounded-lg py-2 text-xs sm:text-sm font-medium transition w-full";

  const styles =
    variant === "primary"
      ? "bg-yellow-400 text-black hover:bg-yellow-500"
      : "border border-gray-300 text-gray-700 hover:bg-gray-100";

  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button onClick={disabled ? undefined : onClick} className={`${base} ${styles} ${disabledStyles}`} disabled={disabled}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};


const ItemRow = ({
  name,
  qty,
  price,
}: {
  name: string;
  qty: number;
  price: number;
}) => (
  <div className="grid grid-cols-3 text-sm py-1">
    <span className="truncate">{name}</span>
    <span className="text-center">{qty}</span>
    <span className="text-right">₹ {price.toFixed(2)}</span>
  </div>
);

const SummaryRow = ({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) => (
  <div
    className={`flex justify-between text-sm py-1 ${
      bold ? "font-semibold" : ""
    }`}
  >
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

const BottomButton = ({
  icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={`flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-100 py-2 text-sm${
      disabled ? " opacity-50 cursor-not-allowed" : " hover:bg-gray-200"
    }`}
  >
    {icon}
    {label}
  </button>
);

const DELIVERY_STATUS_STYLES: Record<DeliveryStatus, { bg: string; text: string; label: string }> = {
  Pending: { bg: "bg-gray-100", text: "text-gray-700", label: "Pending" },
  Assigned: { bg: "bg-blue-100", text: "text-blue-700", label: "Assigned" },
  PickedUp: { bg: "bg-orange-100", text: "text-orange-700", label: "Picked Up" },
  InTransit: { bg: "bg-purple-100", text: "text-purple-700", label: "In Transit" },
  Delivered: { bg: "bg-green-100", text: "text-green-700", label: "Delivered" },
  Cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
};

const DeliveryStatusBadge = ({ status }: { status: DeliveryStatus }) => {
  const style = DELIVERY_STATUS_STYLES[status] || DELIVERY_STATUS_STYLES.Pending;
  return (
    <span className={`px-3 py-1 rounded-md text-xs font-medium ${style.bg} ${style.text}`}>
      🚚 {style.label}
    </span>
  );
};
