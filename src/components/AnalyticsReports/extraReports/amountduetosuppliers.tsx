import { useState, useEffect, useCallback } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import Select from "../../form/Select";
import { Search } from "lucide-react";
import { LoadingSpinner } from "../../Common";
import { getSuppliers, Supplier } from "../../../services/supplierService";

const AmountDueToSuppliers = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSuppliers();
      if (response.success && response.data) {
        setSuppliers(response.data.suppliers);
      } else {
        setError("Failed to load amount due report");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load amount due report");
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
        <LoadingSpinner message="Loading amount due to suppliers report..." />
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

  return (
      <div className="mx-2 sm:mx-4 mt-4">

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-xl font-semibold">
            Amount Due to Suppliers
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

        {/* ================= FILTERS ================= */}
        <div className="flex flex-wrap justify-end gap-2 mb-4">
          <div className="w-52">
            <Select
              value="Filter by Date"
              options={[
                { label: "Filter by Date", value: "Filter by Date" },
                { label: "Today", value: "Today" },
                { label: "This Month", value: "This Month" },
              ]}
            />
          </div>

          <div className="w-52">
            <Select
              value="Options"
              options={[
                { label: "Options", value: "Options" },
                { label: "Dine In", value: "Dine In" },
                { label: "Take Away", value: "Take Away" },
              ]}
            />
          </div>

          <button className="bg-yellow-400 text-black px-4 py-2 rounded-md text-sm font-medium">
            Clear
          </button>
        </div>

        {/* ================= TABLE ================= */}
        <div className="bg-white rounded-lg overflow-hidden border border-gray-300">
          <div className="overflow-x-auto">
            <table className="min-w-[1800px] text-sm text-black">
              <thead className="bg-yellow-400">
                <tr>
                  <th className="px-4 py-3 text-left">Supplier Name</th>
                  <th className="px-4 py-3">Supplier Code</th>
                  <th className="px-4 py-3">Branch Name</th>
                  <th className="px-4 py-3">Branch Code</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Phone Number</th>
                  <th className="px-4 py-3">GST TIN</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created On</th>
                  <th className="px-4 py-3">Created By</th>
                  <th className="px-4 py-3">Invoice Number</th>
                  <th className="px-4 py-3">Invoice Date</th>
                  <th className="px-4 py-3">Sub Total</th>
                  <th className="px-4 py-3">Taxes</th>
                  <th className="px-4 py-3">Discounts</th>
                  <th className="px-4 py-3">Charges</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Amount Paid</th>
                  <th className="px-4 py-3">Amount Due</th>
                </tr>
              </thead>

              <tbody>
                {suppliers.length > 0 ? (
                  suppliers.map((supplier, idx) => (
                    <tr key={supplier.id} className={idx % 2 === 1 ? "bg-[#FFFAEB]" : "border-b"}>
                      <td className="px-4 py-3">{supplier.name}</td>
                      <td className="px-4 py-3">{supplier.code || "-"}</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">{supplier.email || "-"}</td>
                      <td className="px-4 py-3">{supplier.phone || "-"}</td>
                      <td className="px-4 py-3">{supplier.tinNumber || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded ${supplier.status === 'active' ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"}`}>
                          {supplier.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatDate(supplier.createdAt)}</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">₹ {supplier.totalAmountSpent}</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">₹ {supplier.totalAmountSpent}</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={19} className="px-4 py-8 text-center text-gray-500">
                      No supplier data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= PAGINATION ================= */}
        <div className="mt-4">
          <Pagination />
        </div>

      </div>
  );
};

export default AmountDueToSuppliers;
