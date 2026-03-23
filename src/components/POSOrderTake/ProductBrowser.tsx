import { Search, Download } from "lucide-react";
import { useState, useCallback, useRef } from "react";

import OrdersStatusSidebar from "./OrdersStatusSidebar";
import OrdersList, { OrderFilterParams } from "./OrdersList";
import OnlineOrdersList from "./OnlineOrdersList";
import OnlineAggregatorTabs from "./OnlineAggregatorTabs";
import POSActionsBar from "../NavTabs/POSActionsBar";
import Select from "../form/Select";
import { Order } from "./OrderCard";
import { Aggregator, OnlineOrder } from "./OnlineOrderCard";
import PaymentModal from "../POSTakeOrder/Modals/PaymentModal";
import { getOrder, generateKOT, Order as ApiOrder } from "../../services/orderService";
import { showSuccessToast, showErrorToast } from "../../utils/toast";

type AnyOrder = Order | OnlineOrder;

type ProductBrowserProps = {
  onSelectOrder: (order: AnyOrder) => void;
};

// Map sidebar labels to API query params
const SIDEBAR_FILTER_MAP: Record<string, Partial<OrderFilterParams>> = {
  // Map to backend enums: Placed->Confirmed, InProgress->Preparing
  "Open Orders": { status: "Confirmed,Preparing,Ready" },
  "Closed Orders": { status: "Completed" },
  "Cancelled Orders": { status: "Cancelled" },
  "Amount Due": { paymentStatus: "Unpaid,PartiallyPaid" },
  "Advance Orders": { type: "Delivery,Online" },
  "Hold Orders": { status: "OnHold" },
};

// Helper to get date range
const getDateRange = (filter: string): { startDate?: string; endDate?: string } => {
  const now = new Date();
  if (filter === "Today") {
    const today = now.toISOString().split("T")[0];
    return { startDate: today, endDate: today };
  }
  if (filter === "This Month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: start.toISOString().split("T")[0], endDate: now.toISOString().split("T")[0] };
  }
  return {};
};

// Helper to export orders as CSV
const exportOrdersAsCSV = (orders: Order[]) => {
  const headers = ["Order ID", "Customer", "Type", "Status", "Payment Status", "Total", "Date"];
  const rows = orders.map((o) => [
    o.orderNumber || o.id,
    o.customer,
    o.type,
    o.statusText || "",
    o.payment,
    o.total.toFixed(2),
    o.date,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-export-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};


const ProductBrowser: React.FC<ProductBrowserProps> = ({
  onSelectOrder,
}) => {

  const [orderMode, setOrderMode] =
    useState<"offline" | "online">("offline");

  const [aggregatorTab, setAggregatorTab] =
    useState<Aggregator>("All");

  // Filter state
  const [sidebarFilter, setSidebarFilter] = useState<string>("Open Orders");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Track current orders for export
  const currentOrdersRef = useRef<Order[]>([]);

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<ApiOrder | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Print KOT handler
  const handlePrintKOT = useCallback(async (order: Order) => {
    try {
      const res = await generateKOT(order.id, { kitchenId: 'default' });
      if (res.success && res.data) {
        // Generate KOT receipt HTML
        const kotHtml = `
          <html>
          <head>
            <title>KOT - ${res.data.kotNumber}</title>
            <style>
              body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
              h2 { text-align: center; margin-bottom: 4px; }
              .info { text-align: center; font-size: 12px; margin-bottom: 12px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { text-align: left; padding: 4px 2px; border-bottom: 1px dashed #ccc; }
              th:last-child, td:last-child { text-align: center; }
              .footer { text-align: center; margin-top: 12px; font-size: 11px; }
            </style>
          </head>
          <body>
            <h2>Kitchen Order Ticket</h2>
            <div class="info">
              <div>KOT #${res.data.kotNumber}</div>
              <div>Order #${order.orderNumber || order.id}</div>
              <div>${order.type} | ${order.date} ${order.time}</div>
              <div>${order.customer}</div>
            </div>
            <table>
              <thead>
                <tr><th>Item</th><th>Qty</th></tr>
              </thead>
              <tbody>
                ${res.data.items.map(item =>
                  `<tr><td>${item.productName}${item.variantName ? ` (${item.variantName})` : ''}</td><td>${item.quantity}</td></tr>`
                ).join('')}
              </tbody>
            </table>
            <div class="footer">
              <div>Printed: ${new Date().toLocaleString()}</div>
            </div>
          </body>
          </html>
        `;

        // Open print dialog via hidden iframe
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
          doc.write(kotHtml);
          doc.close();
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }

        // Clean up iframe after print
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);

        showSuccessToast(`KOT #${res.data.kotNumber} sent to printer`);
      } else {
        showErrorToast('Failed to generate KOT');
      }
    } catch {
      showErrorToast('Failed to generate KOT');
    }
  }, []);

  // Pay Bill handler — fetch full order details then open PaymentModal
  const handlePayBill = useCallback(async (order: Order) => {
    try {
      const res = await getOrder(order.id);
      if (res.success && res.data) {
        setSelectedOrderForPayment(res.data.order);
        setPaymentModalOpen(true);
      } else {
        showErrorToast('Failed to load order details');
      }
    } catch {
      showErrorToast('Failed to load order details');
    }
  }, []);

  // On successful payment, refresh orders list
  const handlePaymentSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  }, []);

  const handleClear = useCallback(() => {
    setSidebarFilter("Open Orders");
    setDateFilter("");
    setOrderTypeFilter("");
    setStatusFilter("");
    setSearchTerm("");
    setDebouncedSearch("");
  }, []);

  // Build combined filters for OrdersList
  const buildFilters = useCallback((): OrderFilterParams => {
    const filters: OrderFilterParams = {};

    // Sidebar filter
    const sidebarParams = SIDEBAR_FILTER_MAP[sidebarFilter];
    if (sidebarParams) {
      Object.assign(filters, sidebarParams);
    }

    // Date filter (overrides sidebar dates if set)
    if (dateFilter) {
      const dateRange = getDateRange(dateFilter);
      Object.assign(filters, dateRange);
    }

    // Order type filter (overrides sidebar type if set)
    if (orderTypeFilter) {
      filters.type = orderTypeFilter;
    }

    // Status filter from dropdown (overrides sidebar status if set)
    if (statusFilter) {
      filters.status = statusFilter;
    }

    // Client-side search
    if (debouncedSearch) {
      filters.search = debouncedSearch;
    }

    return filters;
  }, [sidebarFilter, dateFilter, orderTypeFilter, statusFilter, debouncedSearch]);

  // Capture orders for export
  const handleOrdersLoaded = useCallback((orders: Order[]) => {
    currentOrdersRef.current = orders;
  }, []);

  // Capture orders for export via a wrapper callback
  const handleSelectOrder = useCallback((order: AnyOrder) => {
    onSelectOrder(order);
  }, [onSelectOrder]);

  return (
    <>
      <POSActionsBar />

      <div className="flex-1 bg-bb-bg px-3 sm:px-6 lg:px-8 py-4 space-y-5 overflow-y-auto">

        {/* TOP ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">

          {/* MODE TOGGLE */}
          <div className="flex gap-3 border-b border-gray-200">
            <button
              onClick={() => setOrderMode("offline")}
              className={`px-4 sm:px-5 py-2 rounded-t-md text-sm font-medium transition
                ${
                  orderMode === "offline"
                    ? "bg-black text-white"
                    : "hover:bg-gray-50"
                }
              `}
            >
              Offline Orders
            </button>

            <button
              onClick={() => setOrderMode("online")}
              className={`px-4 sm:px-5 py-2 rounded-t-md text-sm font-medium transition
                ${
                  orderMode === "online"
                    ? "bg-black text-white"
                    : "hover:bg-gray-50"
                }
              `}
            >
              Online Orders
            </button>
          </div>

          {/* SEARCH */}
          <div className="relative w-full sm:w-[260px] md:w-[320px] sm:ml-auto">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-black"
            />
            <input
              placeholder="Search here..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* FILTER ROW */}
        <div className="flex flex-wrap justify-end gap-2 mb-4">

          <div className="w-52">
            <Select
              value={dateFilter || ""}
              onChange={(val) => setDateFilter(val === "" ? "" : val)}
              options={[
                { label: "Filter by Date", value: "" },
                { label: "Today", value: "Today" },
                { label: "This Month", value: "This Month" },
              ]}
            />
          </div>

          <div className="w-52">
            <Select
              value={orderTypeFilter || ""}
              onChange={(val) => setOrderTypeFilter(val === "" ? "" : val)}
              options={[
                { label: "Order Type", value: "" },
                { label: "Dine In", value: "DineIn" },
                { label: "Take Away", value: "Takeaway" },
                { label: "Delivery", value: "Delivery" },
                { label: "Online", value: "Online" },
              ]}
            />
          </div>

          <div className="w-52">
            <Select
              value={statusFilter || ""}
              onChange={(val) => setStatusFilter(val === "" ? "" : val)}
              options={[
                { label: "Filter by Status", value: "" },
                { label: "Active", value: "Placed,InProgress,Ready" },
                { label: "Completed", value: "Completed" },
                { label: "Cancelled", value: "Cancelled" },
              ]}
            />
          </div>

          <button
            onClick={handleClear}
            className="bg-yellow-400 text-black px-4 py-2 rounded-md text-sm font-medium border border-black"
          >
            Clear
          </button>

          <button
            onClick={() => exportOrdersAsCSV(currentOrdersRef.current)}
            className="px-3 sm:px-4 py-2 rounded-xl border bg-bb-bg text-sm flex items-center gap-2 border-black"
          >
            <Download size={16} />
            Export
          </button>
        </div>

        {/* AGGREGATOR TABS */}
        {orderMode === "online" && (
          <OnlineAggregatorTabs
            value={aggregatorTab}
            onChange={setAggregatorTab}
          />
        )}

        {/* CONTENT */}
        <div className="flex gap-4 min-w-0">

          {/* SIDEBAR */}
          <div className="hidden lg:block shrink-0">
            <OrdersStatusSidebar
              activeFilter={sidebarFilter}
              onFilterChange={setSidebarFilter}
            />
          </div>

          {/* LIST */}
          <div className="flex-1 min-w-0">
            {orderMode === "offline" && (
              <OrdersList
                onSelectOrder={handleSelectOrder}
                onPrintKOT={handlePrintKOT}
                onPayBill={handlePayBill}
                filters={buildFilters()}
                refreshTrigger={refreshTrigger}
                onOrdersLoaded={handleOrdersLoaded}
              />
            )}

            {orderMode === "online" && (
              <OnlineOrdersList
                aggregator={aggregatorTab}
                onSelectOrder={onSelectOrder}
              />
            )}
          </div>
        </div>

        {/* MOBILE SIDEBAR */}
        <div className="block lg:hidden pt-4">
          <OrdersStatusSidebar
            activeFilter={sidebarFilter}
            onFilterChange={setSidebarFilter}
          />
        </div>

      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedOrderForPayment(null);
        }}
        order={selectedOrderForPayment}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default ProductBrowser;
