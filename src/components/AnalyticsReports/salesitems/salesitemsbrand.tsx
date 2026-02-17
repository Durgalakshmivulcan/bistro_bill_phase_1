import { useState, useEffect, useMemo, useCallback } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import Select from "../../form/Select";
import { Search } from "lucide-react";
import { getProductSales } from "../../../services/reportsService";
import { getBranches, Branch } from "../../../services/branchService";
import LoadingSpinner from "../../Common/LoadingSpinner";

/* ===================== TABLE COLUMNS ===================== */
const TABLE_COLUMNS = [

  { key: "skuCode", label: "SKU Code" },
  { key: "productName", label: "Product Name" },
  { key: "brand", label: "Brand" },
  { key: "category", label: "Category" },
  { key: "subCategory", label: "Sub-Category" },
  { key: "measuringUnit", label: "Measuring Unit" },
  { key: "totalAmount", label: "Total Amount" },
  { key: "averagePrice", label: "Average Price" },
  { key: "totalQuantity", label: "Total Quantity" },
  { key: "undefinedSession", label: "Undefined Session" },
];

/* ===================== DATE HELPERS ===================== */
function getDateRange(filter: string) {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start = end;
  if (filter === "This Month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  } else if (filter === "Last 30 days") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    start = d.toISOString().split("T")[0];
  }
  return { startDate: start, endDate: end };
}

const SalesItemByBrand = () => {
  const [tableData, setTableData] = useState<Record<string, string | number>[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("This Month");
  const [optionFilter, setOptionFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  // Load branches on mount
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await getBranches({ status: "Active" });
        if (res.success && res.data) {
          setBranches(res.data.branches || []);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };
    loadBranches();
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(dateFilter);
      const res = await getProductSales(startDate, endDate, undefined, 1, 100, selectedBranch || undefined);
      if (res.success && res.data) {
        const mapped = res.data.map((item) => ({
          skuCode: item.product.sku || "-",
          productName: item.product.name,
          brand: "-",
          category: item.product.categoryName || "-",
          subCategory: "-",
          measuringUnit: "-",
          totalAmount: `₹ ${item.revenue}`,
          averagePrice: `₹ ${item.avgPrice}`,
          totalQuantity: item.quantitySold,
          undefinedSession: "-",
        }));
        setTableData(mapped);
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, selectedBranch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side search filter
  const filteredData = useMemo(() => {
    if (!searchQuery) return tableData;
    const q = searchQuery.toLowerCase();
    return tableData.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [tableData, searchQuery]);

  const handleClear = () => {
    setDateFilter("This Month");
    setOptionFilter("");
    setSearchQuery("");
    setSelectedBranch("");
  };

  return (
    <div className="mx-3 md:mx-4 mt-4 space-y-4">

      {/* ================= HEADER ================= */}
     <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
             <h2 className="text-xl font-semibold text-bb-text">
               Sales Items by Brand
             </h2>

             <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
               <div className="relative w-full sm:w-64">
                 <Search
                   size={16}
                   className="absolute right-3 top-1/2 -translate-y-1/2"
                 />
                 <input
                   placeholder="Search here..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full border border-grey rounded-md px-3 pr-10 py-2 text-sm bg-bb-bg placeholder:text-black"
                 />
               </div>

  <ReportActions reportType="products" />
             </div>
           </div>

           {/* Filters */}
           <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-end sm:items-center">
             {/* Filter by Date */}
             <div className="w-full sm:w-56">
               <Select
                 value={dateFilter}
                 onChange={(value) => setDateFilter(value)}
                 options={[
                   { label: "Today", value: "Today" },
                   { label: "This Month", value: "This Month" },
                   { label: "Last 30 days", value: "Last 30 days" },
                 ]}
               />
             </div>

             {/* Filter by Branch */}
             <div className="w-full sm:w-56">
               <Select
                 value={selectedBranch}
                 onChange={(value) => setSelectedBranch(value)}
                 options={[
                   { label: "All Branches", value: "" },
                   ...branches.map((b) => ({ label: b.name, value: b.id })),
                 ]}
               />
             </div>

             {/* Options */}
             <div className="w-full sm:w-56">
               <Select
                 value={optionFilter}
                 onChange={(value) => setOptionFilter(value)}
                 options={[
                   { label: "All Types", value: "" },
                   { label: "Dine In", value: "DineIn" },
                   { label: "Take Away", value: "Takeaway" },
                 ]}
               />
             </div>

             {/* Clear Button */}
             <button
               onClick={handleClear}
               className="bg-yellow-400 px-4 py-2 rounded border border-black w-full sm:w-auto"
             >
               Clear
             </button>
           </div>

      {/* ================= LOADING ================= */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading data..." />
        </div>
      )}

      {/* ================= TABLE ================= */}
      {!loading && (
        <div className="bg-white rounded-xl border border-bb-border ">
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] text-sm whitespace-nowrap">
              <thead className="bg-bb-primary sticky top-0 z-10">
                <tr>
                  {TABLE_COLUMNS.map(col => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left font-semibold"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredData.map((row, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 1 ? "bg-bb-hover" : "border-b"}
                  >
                    {TABLE_COLUMNS.map(col => (
                      <td key={col.key} className="px-4 py-3">
                        {row[col.key] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}

                {filteredData.length === 0 && (
                  <tr>
                    <td
                      colSpan={TABLE_COLUMNS.length}
                      className="px-4 py-8 text-center text-bb-textSoft"
                    >
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= PAGINATION ================= */}
      <div className="pt-2">
        <Pagination />
      </div>

    </div>
  );
};

export default  SalesItemByBrand;
