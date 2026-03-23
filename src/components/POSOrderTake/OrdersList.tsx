import { useEffect, useState, useRef, useCallback } from "react";
import OrderCard, { Order, OrderType } from "./OrderCard";
import { getOrders, Order as ApiOrder } from "../../services/orderService";
import { PaymentStatus } from "./OrderTypes";
import { ErrorDisplay } from "../Common";
import { handleError } from "../../utils/errorHandler";

export type OrderFilterParams = {
  status?: string;
  paymentStatus?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
};

type Props = {
  onSelectOrder: (order: Order) => void;
  onPrintKOT?: (order: Order) => void;
  onPayBill?: (order: Order) => void;
  filters?: OrderFilterParams;
  refreshTrigger?: number;
  onOrdersLoaded?: (orders: Order[]) => void;
};

// Helper to format order type from backend to frontend
const formatOrderType = (type: string): OrderType => {
  switch (type) {
    case 'DineIn':
      return 'Dine In';
    case 'TakeAway':
    case 'Takeaway':
      return 'Take Away';
    case 'Delivery':
      return 'Catering'; // Map Delivery to Catering as closest match
    case 'Catering':
      return 'Catering';
    case 'Subscription':
      return 'Subscription';
    case 'Online':
      return 'Subscription'; // Map Online to Subscription as closest match
    default:
      return 'Dine In';
  }
};

// Helper to format payment status from backend to frontend
const formatPaymentStatus = (status: string): PaymentStatus => {
  switch (status) {
    case 'Paid':
      return 'Paid';
    case 'PartiallyPaid':
      return 'Partial Paid';
    case 'Unpaid':
      return 'Unpaid';
    default:
      return 'Unpaid';
  }
};

// Helper to get payment status styling
const getPaymentClass = (status: PaymentStatus): string => {
  switch (status) {
    case 'Paid':
      return 'bg-green-100 text-green-700';
    case 'Partial Paid':
      return 'bg-yellow-100 text-yellow-700';
    case 'Unpaid':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// Helper to format date
const formatDate = (isoDate: string): { date: string; time: string } => {
  const dateObj = new Date(isoDate);
  const dateStr = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return { date: dateStr, time: timeStr };
};

// Helper to get customer initials
const getInitials = (name: string): string => {
  if (!name) return 'G'; // G for Guest
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

// Helper to transform API order to frontend Order
const transformOrder = (apiOrder: ApiOrder): Order => {
  const { date, time } = formatDate(apiOrder.createdAt);
  const paymentStatus = formatPaymentStatus(apiOrder.paymentStatus);

  return {
    id: apiOrder.id, // Use unique ID instead of orderNumber to avoid duplicate keys
    orderNumber: apiOrder.orderNumber, // Keep orderNumber for display
    customer: apiOrder.customerName || 'Guest',
    initials: getInitials(apiOrder.customerName || ''),
    type: formatOrderType(apiOrder.type),
    date,
    time,
    payment: paymentStatus,
    paymentClass: getPaymentClass(paymentStatus),
    statusText: apiOrder.status,
    items: (apiOrder.items || []).map((item) => ({
      name: item.variantName ? `${item.productName} (${item.variantName})` : item.productName,
      qty: item.quantity,
      price: item.totalPrice,
    })),
    subtotal: apiOrder.subtotal,
    collected: apiOrder.paidAmount > 0 ? apiOrder.paidAmount : undefined,
    total: apiOrder.dueAmount,
    disablePay: apiOrder.paymentStatus === 'Paid',
  };
};

const POLLING_INTERVAL = 30000; // 30 seconds

export default function OrdersList({
  onSelectOrder,
  onPrintKOT,
  onPayBill,
  filters,
  refreshTrigger,
  onOrdersLoaded,
}: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedOrderIds, setUpdatedOrderIds] = useState<Set<string>>(new Set());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousOrdersRef = useRef<Map<string, Order>>(new Map());

  const loadOrders = useCallback(async (isBackgroundUpdate = false) => {
    try {
      // Don't show loading spinner for background updates
      if (!isBackgroundUpdate) {
        setLoading(true);
      }
      setError(null);

      // Build API params from filters
      const params: Record<string, string> = {};
      if (filters?.status) params.status = filters.status;
      if (filters?.paymentStatus) params.paymentStatus = filters.paymentStatus;
      if (filters?.type) params.type = filters.type;
      if (filters?.startDate) params.startDate = filters.startDate;
      if (filters?.endDate) params.endDate = filters.endDate;

      const response = await getOrders(Object.keys(params).length > 0 ? params as any : undefined);

      if (response.success && response.data) {
        const transformedOrders = response.data.orders.map(transformOrder);

        // Detect updated orders by comparing with previous state
        if (isBackgroundUpdate && previousOrdersRef.current.size > 0) {
          const newUpdatedIds = new Set<string>();

          transformedOrders.forEach((order) => {
            const previousOrder = previousOrdersRef.current.get(order.id);

            // Check if order is new or status/payment has changed
            if (!previousOrder ||
                previousOrder.statusText !== order.statusText ||
                previousOrder.payment !== order.payment) {
              newUpdatedIds.add(order.id);

              // Show notification for status changes
              if (previousOrder && previousOrder.statusText !== order.statusText) {
                showOrderUpdateNotification(order);
              }
            }
          });

          setUpdatedOrderIds(newUpdatedIds);

          // Clear highlights after 5 seconds
          setTimeout(() => {
            setUpdatedOrderIds(new Set());
          }, 5000);
        }

        // Update previous orders map for next comparison
        const ordersMap = new Map<string, Order>();
        transformedOrders.forEach((order) => {
          ordersMap.set(order.id, order);
        });
        previousOrdersRef.current = ordersMap;

        setOrders(transformedOrders);
        onOrdersLoaded?.(transformedOrders);
      } else {
        // Only show error for initial load, not background updates
        if (!isBackgroundUpdate) {
          handleError(response.error, setError, {
            message: response.error?.message || 'Failed to load orders',
            logError: true,
          });
        } else {
          console.error('Background order update failed:', response.error?.message);
        }
      }
    } catch (err) {
      // Only show error for initial load, not background updates
      if (!isBackgroundUpdate) {
        handleError(err, setError, {
          message: 'Failed to load orders',
          logError: true,
        });
      } else {
        console.error('Background order update failed:', err);
      }
    } finally {
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    }
  }, [filters?.status, filters?.paymentStatus, filters?.type, filters?.startDate, filters?.endDate]);

  useEffect(() => {
    loadOrders();

    // Start polling for real-time updates
    pollingIntervalRef.current = setInterval(() => {
      loadOrders(true);
    }, POLLING_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [loadOrders]);

  // Refresh when parent triggers it (e.g., after payment success)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadOrders();
    }
  }, [refreshTrigger, loadOrders]);

  const showOrderUpdateNotification = (order: Order) => {
    // Simple notification - could be enhanced with a toast library
    console.log(`Order #${order.orderNumber} status changed to ${order.statusText}`);

    // Browser notification if user has granted permission
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Order Status Update', {
        body: `Order #${order.orderNumber} is now ${order.statusText}`,
        icon: '/logo192.png',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-4 text-center">
        <p className="text-gray-500">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-4">
        <ErrorDisplay
          message={error}
          onRetry={loadOrders}
          size="medium"
          variant="card"
        />
      </div>
    );
  }

  // Apply client-side search filtering
  const filteredOrders = filters?.search
    ? orders.filter((order) => {
        const searchLower = filters.search!.toLowerCase();
        return (
          order.customer.toLowerCase().includes(searchLower) ||
          (order.orderNumber || '').toLowerCase().includes(searchLower) ||
          order.type.toLowerCase().includes(searchLower)
        );
      })
    : orders;

  if (filteredOrders.length === 0) {
    return (
      <div className="p-3 sm:p-4 text-center">
        <p className="text-gray-500">
          {filters?.search || filters?.status || filters?.type || filters?.paymentStatus
            ? 'No orders match the current filters'
            : 'No orders found'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4">
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            isUpdated={updatedOrderIds.has(order.id)}
            onClick={onSelectOrder}
            onPrintKOT={onPrintKOT}
            onPayBill={onPayBill}
          />
        ))}
      </div>
    </div>
  );
}
