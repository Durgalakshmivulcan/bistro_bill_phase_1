import { useState, useEffect, useCallback } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import Select from "../../form/Select";
import { Search } from "lucide-react";
import { LoadingSpinner } from "../../Common";
import { getStockoutPredictions, StockoutPrediction } from "../../../services/reportsService";
import { useAuth } from "../../../contexts/AuthContext";
import { getBranches } from "../../../services/branchService";

const BranchwiseRestockReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<StockoutPrediction[]>([]);
  const [branchOptions, setBranchOptions] = useState<Array<{ label: string; value: string }>>([]);
  const { user } = useAuth();

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

  const branchId = user?.userType === 'Staff'
    ? user.branch?.id
    : user?.userType === 'BusinessOwner'
      ? user.branches?.[0]?.id
      : undefined;

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!branchId) {
        setError("No branch selected");
        setLoading(false);
        return;
      }
      const response = await getStockoutPredictions(branchId);
      if (response.success && response.data) {
        setPredictions(response.data.predictions);
      } else {
        setError(response.error?.message || "Failed to load branchwise restock report");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load branchwise restock report");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading) {
    return (
      <div className="mx-2 sm:mx-4 mt-4">
        <LoadingSpinner message="Loading branchwise restock report..." />
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
                Branch Wise Assigned & Restock Report
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

        {/* ================= FILTER ROW ================= */}
        <div className="flex justify-end gap-3 mb-6 flex-wrap">

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
              value="Filter by Branch"
              options={branchOptions.length > 0 ? branchOptions : [{ label: "Filter by Branch", value: "Filter by Branch" }]}
            />
          </div>

          <div className="w-44">
            <Select
              value="Options"
              options={[
                { label: "Options", value: "Options" },
                { label: "Low Stock", value: "Low Stock" },
                { label: "Out of Stock", value: "Out of Stock" },
              ]}
            />
          </div>

          <button className="bg-yellow-400 text-black px-6 py-2 rounded-md font-medium border border-black">
            Clear
          </button>

        </div>

        {/* ================= TABLE ================= */}
        <div className="bg-white rounded-lg overflow-hidden">

          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full text-sm text-black">

              <thead className="bg-yellow-400">
                <tr>
                  <th className="px-4 py-3 text-left">Branch Name</th>
                  <th className="px-4 py-3">Branch Code</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Quantity Assigned</th>
                  <th className="px-4 py-3">Sold Quantity</th>
                  <th className="px-4 py-3">Available Quantity</th>
                  <th className="px-4 py-3">Restock History</th>
                </tr>
              </thead>

              <tbody>
                {predictions.length > 0 ? (
                  predictions.map((item, idx) => (
                    <tr key={item.productId} className={idx % 2 === 1 ? "bg-[#FFFAEB]" : "border-b"}>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">{item.productName}</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">{item.suggestedReorderQty}</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">{item.currentStock}</td>
                      <td className="px-4 py-3">
                        {item.supplierName || "-"} <br />
                        Status: {item.status} — {item.daysUntilStockout} days until stockout
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No restock data available
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

export default BranchwiseRestockReport;
