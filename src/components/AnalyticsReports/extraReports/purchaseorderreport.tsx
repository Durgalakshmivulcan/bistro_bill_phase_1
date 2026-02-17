import { useState, useEffect, useCallback } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import Select from "../../form/Select";
import { Search } from "lucide-react";
import { LoadingSpinner } from "../../Common";
import { getPurchaseOrders, PurchaseOrder } from "../../../services/purchaseOrderService";

const PurchaseOrdersReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPurchaseOrders();
      if (response.success && response.data) {
        setOrders(response.data.purchaseOrders);
      } else {
        setError("Failed to load purchase order report");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load purchase order report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading) {
    return (
      <div className="mx-2 sm:mx-4 mt-4">
        <LoadingSpinner message="Loading purchase order report..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-2 sm:mx-4 mt-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 mb-3">{error}</p>
          <button
            onClick={fetchReport}
            className="bg-bb-primary text-black px-4 py-2 rounded-md font-medium hover:bg-yellow-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB");
  };

  const statusColors: Record<string, string> = {
    Received: "bg-blue-100 text-blue-600",
    Approved: "bg-green-100 text-green-600",
    Pending: "bg-yellow-100 text-yellow-600",
    Declined: "bg-red-100 text-red-600",
  };

  return (
    <div className="mx-2 sm:mx-4 mt-4">

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-xl font-semibold">
            Purchase Order Report
          </h3>

          <div className="flex flex-wrap gap-2">
            <div className="relative w-64">
              <Search
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black"
              />
              <input
                placeholder="Search here..."
                className="w-full border border-gray-600 rounded-md px-3 pr-10 py-2 text-sm"
              />
            </div>

            <ReportActions />


          </div>
        </div>
        {/* ================= FILTER BAR ================= */}
        <div className="flex justify-end gap-3 mb-6 flex-wrap">

          <div className="w-48">
            <Select
              value="Filter by Date"
              options={[
                { label: "Filter by Date", value: "Filter by Date" },
                { label: "Today", value: "Today" },
                { label: "This Month", value: "This Month" },
              ]}
            />
          </div>

          <div className="w-44">
            <Select
              value="Options"
              options={[
                { label: "Options", value: "Options" },
                { label: "Delivered", value: "Delivered" },
                { label: "Approved", value: "Approved" },
              ]}
            />
          </div>

          <button className="bg-yellow-400 text-black px-6 py-2 rounded-md font-medium">
            Clear
          </button>

        </div>

        {/* ================= TABLE ================= */}
        <div className="bg-white rounded-lg overflow-hidden">

          <div className="overflow-x-auto">

            <table className="min-w-[1900px] w-full text-sm text-black">

              <thead className="bg-yellow-400">
                <tr>
                  {[
                    "Invoice Number",
                    "Invoice Date",
                    "Supplier Name",
                    "Supplier Code",
                    "Branch Name",
                    "Branch Code",
                    "Sub Total",
                    "Taxes",
                    "Discounts",
                    "Charges",
                    "Total",
                    "Created On",
                    "Created by",
                    "Status",
                    "Status Marked by",
                    "Modified On",
                    "Modified by",
                    "Expected Delivery Date",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {orders.length > 0 ? (
                  orders.map((order, idx) => (
                    <tr key={order.id} className={idx % 2 === 1 ? "bg-[#FFFAEB]" : "border-b"}>
                      <td className="px-4 py-3">{order.invoiceNumber || "-"}</td>
                      <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3">{order.supplier.name}</td>
                      <td className="px-4 py-3">{order.supplier.code || "-"}</td>
                      <td className="px-4 py-3">{order.branch.name}</td>
                      <td className="px-4 py-3">{order.branch.code || "-"}</td>
                      <td className="px-4 py-3">₹ {order.grandTotal}</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">₹ {order.grandTotal}</td>
                      <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">
                        <span className={`${statusColors[order.status] || "bg-gray-100 text-gray-600"} px-3 py-1 rounded-full text-xs`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">{formatDate(order.updatedAt)}</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={18} className="px-4 py-8 text-center text-gray-500">
                      No purchase order data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= PAGINATION ================= */}
        <div className="flex justify-end mt-6">
          <Pagination />
        </div>

      </div>
  );
};

export default PurchaseOrdersReport;
