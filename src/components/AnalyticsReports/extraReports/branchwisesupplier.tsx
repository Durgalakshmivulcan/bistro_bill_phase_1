import { useState, useEffect, useCallback } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import Select from "../../form/Select";
import { Search } from "lucide-react";
import { LoadingSpinner } from "../../Common";
import { getSuppliers, Supplier } from "../../../services/supplierService";
import { getBranches } from "../../../services/branchService";

const BranchwiseSuppliersReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
      const response = await getSuppliers();
      if (response.success && response.data) {
        setSuppliers(response.data.suppliers);
      } else {
        setError("Failed to load branchwise suppliers report");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load branchwise suppliers report");
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
        <LoadingSpinner message="Loading branchwise suppliers report..." />
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
           Branch Wise Suppliers
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
                { label: "Active", value: "Active" },
                { label: "Inactive", value: "Inactive" },
              ]}
            />
          </div>

          <button className="bg-yellow-400 text-black px-6 py-2 rounded-md font-medium border border-black">
            Clear
          </button>

        </div>
        <div className="bg-white rounded-lg overflow-hidden">

          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full text-sm text-black">

              <thead className="bg-yellow-400">
                <tr>
                  <th className="px-4 py-3 text-left">Supplier Name</th>
                  <th className="px-4 py-3">Supplier Code</th>
                  <th className="px-4 py-3">Branch Name</th>
                  <th className="px-4 py-3">Branch Code</th>
                  <th className="px-4 py-3">GST TIN</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created On</th>
                  <th className="px-4 py-3">Created by</th>
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
                      <td className="px-4 py-3">{supplier.tinNumber || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`${supplier.status === 'active' ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-500"} px-3 py-1 rounded-full text-xs`}>
                          {supplier.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatDate(supplier.createdAt)}</td>
                      <td className="px-4 py-3">-</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No supplier data available
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

export default BranchwiseSuppliersReport;
