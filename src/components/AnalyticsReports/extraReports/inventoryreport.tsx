import { useState, useEffect, useCallback } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import Select from "../../form/Select";
import { Search } from "lucide-react";
import { LoadingSpinner } from "../../Common";
import { getInventoryReport, InventoryReport as InventoryReportData } from "../../../services/reportsService";
import { getBranches } from "../../../services/branchService";

const InventoryReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<InventoryReportData | null>(null);
  const [branchOptions, setBranchOptions] = useState<Array<{ label: string; value: string }>>([]);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await getBranches({ status: "Active" });
        if (res.success && res.data) {
          setBranchOptions([
            { label: "Filter by Branch", value: "Filter by Branch" },
            ...res.data.branches.map((b) => ({ label: b.name, value: b.name })),
          ]);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };
    loadBranches();
  }, []);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getInventoryReport();
      if (response.success && response.data) {
        setReportData(response.data);
      } else {
        setError(response.error?.message || "Failed to load inventory report");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory report");
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
        <LoadingSpinner message="Loading inventory report..." />
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

  return (
    <div className="mx-2 sm:mx-4 mt-4">

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-xl font-semibold">
            Inventory Report
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

          <div className="w-48">
            <Select
              value="Filter by Branch"
              options={branchOptions.length > 0 ? branchOptions : [{ label: "Filter by Branch", value: "Filter by Branch" }]}
            />
          </div>

          <div className="w-40">
            <Select
              value="Options"
              options={[
                { label: "Options", value: "Options" },
                { label: "SKU Wise", value: "sku" },
                { label: "Branch Wise", value: "branch" },
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

            <table className="min-w-[1700px] w-full text-sm text-black">

              <thead className="bg-yellow-400">
                <tr>
                  {[
                    "Product Name",
                    "Brand",
                    "SKU Code",
                    "SKU Type",
                    "Branch Name",
                    "Branch Code",
                    "Quantity Available",
                    "Sold Quantity",
                    "Cost Price",
                    "Selling Price",
                    "Expiry Date",
                    "Supplier Name",
                    "Supplier Code",
                  ].map((h) => (
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
                {reportData?.itemsBySupplier && reportData.itemsBySupplier.length > 0 ? (
                  reportData.itemsBySupplier.map((item, idx) => (
                    <tr key={item.supplierId} className={idx % 2 === 1 ? "bg-[#FFFAEB]" : "border-b"}>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">{item.itemCount}</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">{item.supplierName}</td>
                      <td className="px-4 py-3">{item.supplierId}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                      No inventory data available
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

export default InventoryReport;
