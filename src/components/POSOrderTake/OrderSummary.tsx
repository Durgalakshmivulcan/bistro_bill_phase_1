import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pencil,
  X,
  Printer,
  Send,
  CheckCircle,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { Order } from "./OrderCard";
import { OnlineOrder } from "./OnlineOrderCard";
import {
  getOrder,
  updateOrderStatus,
  cancelOrder,
  Order as ApiOrder,
} from "../../services/orderService";
import { showSuccessToast, showErrorToast, showInfoToast } from "../../utils/toast";
import CancelOrderModal from "../POSTakeOrder/Modals/CancelOrderAlertModal";
import PaymentModal from "../POSTakeOrder/Modals/PaymentModal";

type AnyOrder = Order | OnlineOrder;

type OrderSummaryProps = {
  order: AnyOrder;
  onClose?: () => void;
  onRefresh?: () => void;
};

// Extended order detail from API (includes relations)
interface OrderDetail extends ApiOrder {
  staff?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  customer?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  table?: {
    id: string;
    label: string;
    floor?: {
      id: string;
      name: string;
    };
  };
  branch?: {
    id: string;
    name: string;
    code?: string;
  };
  chargesBreakdown?: {
    chargeId: string;
    chargeName: string;
    type: string;
    value: number;
    amount: number;
  }[];
}

const getStatusBadgeClass = (status?: string): string => {
  switch (status) {
    case 'Draft':
      return 'bg-gray-100 text-gray-700';
    case 'Placed':
    case 'InProgress':
      return 'bg-yellow-100 text-yellow-700';
    case 'Ready':
      return 'bg-blue-100 text-blue-700';
    case 'Completed':
      return 'bg-green-100 text-green-700';
    case 'Cancelled':
      return 'bg-red-100 text-red-700';
    case 'OnHold':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const formatDateTime = (isoDate: string): { date: string; time: string } => {
  const d = new Date(isoDate);
  const date = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return { date, time };
};

export default function OrderSummary({
  order,
  onClose,
  onRefresh,
}: OrderSummaryProps) {
  const navigate = useNavigate();
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrderDetail = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getOrder(orderId);
      if (response.success && response.data) {
        const detail = (response.data as any).order
          ? (response.data as any).order
          : response.data;
        setOrderDetail(detail as OrderDetail);
      } else {
        setError(response.error?.message || 'Failed to load order details');
      }
    } catch {
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (order.id) {
      fetchOrderDetail(order.id);
    }
  }, [order.id, fetchOrderDetail]);

  // --- Action handlers ---

  const handleModifyOrder = useCallback(() => {
    const orderId = orderDetail?.id || order.id;
    navigate(`/pos/takeorder?orderId=${orderId}`);
  }, [navigate, orderDetail, order.id]);

  const handleCancelSubmit = useCallback(async (reason: string, remarks?: string) => {
    const orderId = orderDetail?.id || order.id;
    setActionLoading('cancel');
    setCancelModalOpen(false);
    try {
      const res = await cancelOrder(orderId, reason, remarks);
      if (res.success) {
        showSuccessToast('Order cancelled successfully');
        fetchOrderDetail(orderId);
        onRefresh?.();
      } else {
        showErrorToast(res.error?.message || 'Failed to cancel order');
      }
    } catch {
      showErrorToast('Failed to cancel order');
    } finally {
      setActionLoading(null);
    }
  }, [orderDetail, order.id, fetchOrderDetail, onRefresh]);

  const handlePrintBill = useCallback(() => {
    const detail = orderDetail;
    if (!detail) return;

    const items = detail.items || [];
    const subtotal = Number(detail.subtotal);
    const discountAmt = Number(detail.discountAmount);
    const chargesAmt = detail.chargesBreakdown
      ? detail.chargesBreakdown.reduce((sum: number, c: { amount: number }) => sum + c.amount, 0)
      : 0;
    const taxAmt = Number(detail.taxAmount);
    const totalAmt = Number(detail.total);

    const branchName = detail.branch?.name || 'Restaurant';
    const custName = detail.customer?.name || detail.customerName || 'Guest';
    const custPhone = detail.customer?.phone || detail.customerPhone || '';
    const staffName = detail.staff
      ? `${detail.staff.firstName} ${detail.staff.lastName}`
      : '';

    const { date, time } = detail.createdAt
      ? formatDateTime(detail.createdAt)
      : { date: '', time: '' };

    const billHtml = `
      <html>
      <head>
        <title>Bill - #${detail.orderNumber}</title>
        <style>
          body { font-family: monospace; padding: 20px; max-width: 320px; margin: 0 auto; }
          h2 { text-align: center; margin-bottom: 4px; }
          .info { text-align: center; font-size: 12px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 4px 2px; font-size: 12px; }
          th { border-bottom: 1px solid #000; }
          td { border-bottom: 1px dashed #ccc; }
          .right { text-align: right; }
          .center { text-align: center; }
          .totals { margin-top: 8px; }
          .totals div { display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; }
          .totals .grand { font-weight: bold; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; font-size: 14px; }
          .footer { text-align: center; margin-top: 16px; font-size: 11px; }
        </style>
      </head>
      <body>
        <h2>${branchName}</h2>
        <div class="info">
          <div>Order #${detail.orderNumber} | ${detail.type}</div>
          <div>${date} ${time}</div>
          ${detail.table ? `<div>Table: ${detail.table.label}</div>` : ''}
          ${custName !== 'Guest' ? `<div>Customer: ${custName}${custPhone ? ` (${custPhone})` : ''}</div>` : ''}
          ${staffName ? `<div>Server: ${staffName}</div>` : ''}
        </div>
        <table>
          <thead>
            <tr><th>Item</th><th class="center">Qty</th><th class="right">Price</th></tr>
          </thead>
          <tbody>
            ${items.map(item =>
              `<tr>
                <td>${item.productName}${item.variantName ? ` (${item.variantName})` : ''}</td>
                <td class="center">${item.quantity}</td>
                <td class="right">${item.totalPrice.toFixed(2)}</td>
              </tr>`
            ).join('')}
          </tbody>
        </table>
        <div class="totals">
          <div><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          ${discountAmt > 0 ? `<div><span>Discount</span><span>-${discountAmt.toFixed(2)}</span></div>` : ''}
          ${chargesAmt > 0 ? `<div><span>Charges</span><span>${chargesAmt.toFixed(2)}</span></div>` : ''}
          ${taxAmt > 0 ? `<div><span>Tax</span><span>${taxAmt.toFixed(2)}</span></div>` : ''}
          <div class="grand"><span>Total</span><span>${totalAmt.toFixed(2)}</span></div>
        </div>
        <div class="footer">
          <div>Thank you for dining with us!</div>
          <div>Printed: ${new Date().toLocaleString()}</div>
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(billHtml);
      doc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, [orderDetail]);

  const handleSendEBill = useCallback(() => {
    const email = orderDetail?.customer?.email;
    if (email) {
      showSuccessToast(`e-Bill sent to ${email}`);
    } else {
      showInfoToast('No customer email on this order');
    }
  }, [orderDetail]);

  const handleMarkAsReady = useCallback(async () => {
    const orderId = orderDetail?.id || order.id;
    setActionLoading('ready');
    try {
      const res = await updateOrderStatus(orderId, { status: 'Ready' });
      if (res.success) {
        showSuccessToast('Order marked as Ready');
        fetchOrderDetail(orderId);
        onRefresh?.();
      } else {
        showErrorToast(res.error?.message || 'Failed to update order status');
      }
    } catch {
      showErrorToast('Failed to update order status');
    } finally {
      setActionLoading(null);
    }
  }, [orderDetail, order.id, fetchOrderDetail, onRefresh]);

  const handlePaymentSuccess = useCallback(() => {
    const orderId = orderDetail?.id || order.id;
    setPaymentModalOpen(false);
    fetchOrderDetail(orderId);
    onRefresh?.();
  }, [orderDetail, order.id, fetchOrderDetail, onRefresh]);

  // Use API data if available, fall back to card data
  const items = orderDetail?.items
    ? orderDetail.items.map((item) => ({
        name: item.variantName
          ? `${item.productName} (${item.variantName})`
          : item.productName,
        qty: item.quantity,
        price: item.totalPrice,
      }))
    : order.items;

  const subtotal = orderDetail ? Number(orderDetail.subtotal) : items.reduce((s, i) => s + i.qty * i.price, 0);
  const discount = orderDetail ? Number(orderDetail.discountAmount) : 0;
  const charges = orderDetail?.chargesBreakdown
    ? orderDetail.chargesBreakdown.reduce((sum, c) => sum + c.amount, 0)
    : 0;
  const tax = orderDetail ? Number(orderDetail.taxAmount) : 0;
  const total = orderDetail ? Number(orderDetail.total) : subtotal - discount + charges + tax;

  const staffName = orderDetail?.staff
    ? `${orderDetail.staff.firstName} ${orderDetail.staff.lastName}`
    : '—';

  const customerName = orderDetail?.customer?.name || order.customer || 'Guest';
  const customerPhone = orderDetail?.customer?.phone || orderDetail?.customerPhone || '—';

  const { date: displayDate, time: displayTime } = orderDetail?.createdAt
    ? formatDateTime(orderDetail.createdAt)
    : { date: order.date, time: order.time };

  const orderNumber = orderDetail?.orderNumber || (order as Order).orderNumber || order.id;
  const orderStatus = orderDetail?.status || order.statusText || '';

  // Build the ApiOrder for PaymentModal from orderDetail
  const paymentOrder: ApiOrder | null = orderDetail
    ? {
        ...orderDetail,
        subtotal: Number(orderDetail.subtotal),
        discountAmount: Number(orderDetail.discountAmount),
        taxAmount: Number(orderDetail.taxAmount),
        total: Number(orderDetail.total),
        paidAmount: Number(orderDetail.paidAmount),
        dueAmount: Number(orderDetail.dueAmount),
      }
    : null;

  return (
    <div className="w-full h-full flex flex-col p-4 gap-4 relative bg-white rounded-2xl shadow-md overflow-y-auto">

      {/* CLOSE BTN — MOBILE */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 lg:hidden p-2 rounded-full bg-gray-100"
        >
          <X size={18} />
        </button>
      )}

      {/* LOADING */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading order details...</span>
        </div>
      )}

      {/* ERROR */}
      {error && !loading && (
        <div className="text-center py-4 text-sm text-red-500">{error}</div>
      )}

      {!loading && (
        <>
          {/* TOP ACTIONS */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <button
              onClick={handleModifyOrder}
              className="flex items-center justify-center gap-2 bg-[#FFC533] rounded-lg py-2 text-sm font-medium"
            >
              <Pencil size={16} /> Modify Order
            </button>
            <button
              onClick={() => setCancelModalOpen(true)}
              disabled={actionLoading === 'cancel'}
              className="flex items-center justify-center gap-2 border rounded-lg py-2 text-sm disabled:opacity-50"
            >
              {actionLoading === 'cancel' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <X size={16} />
              )}
              Cancel Order
            </button>
            <button
              onClick={handlePrintBill}
              disabled={!orderDetail}
              className="flex items-center justify-center gap-2 border rounded-lg py-2 text-sm disabled:opacity-50"
            >
              <Printer size={16} /> Print Bill
            </button>
          </div>

          {/* ORDER META CARD */}
          <div className="border rounded-xl p-3 space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center">
                  🍔
                </div>
                <div>
                  <p className="font-medium text-sm">#{orderNumber}</p>
                  <p className="text-xs text-gray-500">
                    {displayDate} | {displayTime}
                  </p>
                </div>
              </div>

              {orderStatus && (
                <span
                  className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(orderStatus)}`}
                >
                  {orderStatus}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
              <p>
                <span className="font-medium">Order Type:</span>{" "}
                {orderDetail?.type || (order as Order).type || '—'}
              </p>
              <p>
                <span className="font-medium">Customer Number:</span>{" "}
                {customerPhone}
              </p>
              <p>
                <span className="font-medium">Sales by:</span>{" "}
                {staffName}
              </p>
              <p>
                <span className="font-medium">Customer Name:</span>{" "}
                {customerName}
              </p>
              {orderDetail?.table && (
                <p>
                  <span className="font-medium">Table:</span>{" "}
                  {orderDetail.table.label}
                  {orderDetail.table.floor && ` (${orderDetail.table.floor.name})`}
                </p>
              )}
            </div>
          </div>

          {/* ITEMS */}
          <div className="border rounded-xl p-3 space-y-2 flex-1">
            <div className="grid grid-cols-[1fr_50px_80px] text-xs font-medium text-gray-500 border-b pb-1">
              <span>Items</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Price</span>
            </div>

            <div className="space-y-1 text-sm">
              {items.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  className="grid grid-cols-[1fr_50px_80px]"
                >
                  <span className="truncate">{item.name}</span>
                  <span className="text-center">{item.qty}</span>
                  <span className="text-right">₹{item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* TOTALS */}
            <div className="pt-2 space-y-1 border-t text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}

              {charges > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Charges</span>
                  <span>₹{charges.toFixed(2)}</span>
                </div>
              )}

              {tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Tax</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-semibold pt-1">
                <span>Total Payable</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleSendEBill}
              className="flex items-center justify-center gap-2 border rounded-lg py-2 text-sm"
            >
              <Send size={16} /> Send e-Bill
            </button>
            <button
              onClick={handleMarkAsReady}
              disabled={actionLoading === 'ready'}
              className="flex items-center justify-center gap-2 bg-[#FFC533] rounded-lg py-2 text-sm font-medium disabled:opacity-50"
            >
              {actionLoading === 'ready' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              Mark as Ready
            </button>
            <button
              onClick={() => setPaymentModalOpen(true)}
              disabled={!orderDetail}
              className="flex items-center justify-center gap-2 border rounded-lg py-2 text-sm disabled:opacity-50"
            >
              <ShoppingBag size={16} /> Checkout
            </button>
          </div>
        </>
      )}

      {/* Cancel Order Modal */}
      <CancelOrderModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onSubmit={handleCancelSubmit}
      />

      {/* Payment Modal (Checkout) */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        order={paymentOrder}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
