import { useState, useEffect, useCallback } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import Select from "../../form/Select";
import { Search } from "lucide-react";
import { LoadingSpinner } from "../../Common";
import { getPaymentTransactions, PaymentRow } from "../../../services/reportsService";

const PurchaseOrderPaymentReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      const endDate = today.toISOString().split("T")[0];
      const response = await getPaymentTransactions(startDate, endDate);
      if (response.success && response.data) {
        setPayments(response.data.payments);
      } else {
        setError(response.error?.message || "Failed to load purchase order payment report");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load purchase order payment report");
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
        <LoadingSpinner message="Loading purchase order payment report..." />
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

  const headers = [
    "Invoice Number",
    "Invoice Date",
    "Supplier Name",
    "Supplier Code",
    "Branch Name",
    "Branch Code",
    "Amount Paid",
    "Amount Due",
    "Sub Total",
    "Taxes",
    "Discounts",
    "Charges",
    "Total",
    "Payment Date",
    "Payment Type",
    "Payment Mode",
    "Sales by",
  ];

  const fieldKeys = [
    "invoiceNumber",
    "invoiceDate",
    "supplierName",
    "supplierCode",
    "branchName",
    "branchCode",
    "amountPaid",
    "amountDue",
    "subTotal",
    "taxes",
    "discounts",
    "charges",
    "total",
    "paymentDate",
    "paymentType",
    "paymentMode",
    "salesBy",
  ];

  return (
    <div className="mx-2 sm:mx-4 mt-4">

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-xl font-semibold">
            Purchase Order Payment
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
                { label: "Cash", value: "Cash" },
                { label: "UPI", value: "UPI" },
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
                  {headers.map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {payments.length > 0 ? (
                  payments.map((payment, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? "bg-[#FFFAEB]" : "border-b"}>
                      {fieldKeys.map((key) => (
                        <td key={key} className="px-4 py-3">
                          {payment[key] !== undefined ? String(payment[key]) : "-"}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={17} className="px-4 py-8 text-center text-gray-500">
                      No payment data available
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

export default PurchaseOrderPaymentReport;
