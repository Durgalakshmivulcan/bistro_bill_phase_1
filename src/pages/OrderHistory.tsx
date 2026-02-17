import React, { useState, useMemo, useEffect, useCallback } from "react";
import FilterBar, { OrderFilters } from "../components/order-history/FilterBar";
import OrderTable from "../components/order-history/OrderTable";
import Pagination from "../components/order-history/Pagination";
import { OrderItem } from "../types/orderDetails";
import DashboardLayout from "../layout/DashboardLayout";
import { getOrders, Order, GetOrdersParams } from "../services/orderService";
import { TableSkeleton } from "../components/Common";

const ITEMS_PER_PAGE = 20;

const OrderHistory: React.FC = () => {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadOrders = useCallback(async (page: number, activeFilters: OrderFilters) => {
    try {
      setLoading(true);
      setError(null);

      const params: GetOrdersParams = {
        page,
        limit: ITEMS_PER_PAGE,
      };

      if (activeFilters.paymentStatus) {
        params.paymentStatus = activeFilters.paymentStatus as GetOrdersParams["paymentStatus"];
      }
      if (activeFilters.type) {
        params.type = activeFilters.type as GetOrdersParams["type"];
      }
      if (activeFilters.startDate) {
        params.startDate = activeFilters.startDate;
      }
      if (activeFilters.endDate) {
        params.endDate = activeFilters.endDate;
      }

      const response = await getOrders(params);

      if (response.success && response.data) {
        const transformedOrders: OrderItem[] = response.data.orders.map((order: Order) => ({
          id: parseInt(order.id) || 0,
          orderNo: order.orderNumber,
          branch: "-",
          customerName: order.customerName || "Guest",
          phone: order.customerPhone || "N/A",
          orderType: formatOrderType(order.type),
          orderValue: `₹ ${order.total.toFixed(2)}`,
          status: formatPaymentStatus(order.paymentStatus),
          createdAt: formatDate(order.createdAt),
          createdBy: "System",
        }));

        setOrders(transformedOrders);
        const total = response.data.total || transformedOrders.length;
        setTotalPages(Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)));
      } else {
        setError(response.error?.message || "Failed to load orders");
      }
    } catch (err) {
      console.error("Error loading orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load orders when page or filters change
  useEffect(() => {
    loadOrders(currentPage, filters);
  }, [currentPage, filters, loadOrders]);

  const handleFilterChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Helper function to format order type
  const formatOrderType = (type: string): string => {
    const typeMap: Record<string, string> = {
      DineIn: "Dine In",
      Takeaway: "Take Away",
      Delivery: "Delivery",
      Online: "Online",
    };
    return typeMap[type] || type;
  };

  // Helper function to format payment status
  const formatPaymentStatus = (status: string): "Paid" | "Unpaid" | "Due" | "Free" | "Partial Paid" => {
    const statusMap: Record<string, "Paid" | "Unpaid" | "Due" | "Free" | "Partial Paid"> = {
      Paid: "Paid",
      Unpaid: "Unpaid",
      PartiallyPaid: "Partial Paid",
      Refunded: "Unpaid",
    };
    return statusMap[status] || "Unpaid";
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  // Export orders to CSV
  const handleExport = () => {
    if (filteredOrders.length === 0) {
      alert("No orders to export");
      return;
    }

    const headers = [
      "Order No",
      "Branch",
      "Customer Name",
      "Phone",
      "Order Type",
      "Order Value",
      "Status",
      "Created At",
      "Created By",
    ];

    const rows = filteredOrders.map((order) => [
      order.orderNo,
      order.branch,
      order.customerName,
      order.phone,
      order.orderType,
      order.orderValue,
      order.status,
      order.createdAt,
      order.createdBy,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `order-history-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Search logic (Order No / Customer / Phone) - client-side on current page
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;

    const value = search.toLowerCase();

    return orders.filter(
      (order) =>
        order.orderNo.toLowerCase().includes(value) ||
        order.customerName.toLowerCase().includes(value) ||
        order.phone.toLowerCase().includes(value)
    );
  }, [search, orders]);

  return (
    <DashboardLayout>
      <div className="bb-shell">
        <div className="bb-frame flex flex-col">
          <main className="flex-1 bg-[#FFFBF3] px-4 sm:px-6 lg:px-8 py-6">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <h1 className="text-2xl font-bold">Order History</h1>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  placeholder="Search by order, customer, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-72 rounded-md border px-4 py-2 text-sm bg-white"
                  disabled={loading}
                />

                <button
                  onClick={handleExport}
                  className="border px-4 py-2 rounded-md text-sm bg-white hover:bg-gray-50"
                  disabled={loading}
                >
                  Export
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-5">
              <FilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onClear={handleClearFilters}
              />
            </div>

            {/* Error State */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
                <button
                  onClick={() => loadOrders(currentPage, filters)}
                  className="mt-2 text-sm text-red-600 underline hover:text-red-800"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="mt-6 p-8 bg-white rounded-lg shadow-sm">
                <TableSkeleton rows={10} />
              </div>
            )}

            {/* Table */}
            {!loading && !error && (
              <div className="mt-6">
                <OrderTable orders={filteredOrders} />
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && orders.length === 0 && (
              <div className="mt-6 p-8 bg-white rounded-lg shadow-sm text-center">
                <p className="text-gray-600">No orders found.</p>
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && orders.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}

          </main>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrderHistory;
