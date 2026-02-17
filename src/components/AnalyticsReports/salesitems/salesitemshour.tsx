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
  { key: "brand", label: "Brand" },
  { key: "category", label: "Category" },
  { key: "subCategory", label: "Sub-Category" },
  { key: "measuringUnit", label: "Measuring Unit" },
  { key: "productName", label: "Product Name" },

  { key: "h00_totalAmount", label: "00:00-Total Amount" },
  { key: "h00_averagePrice", label: "00:00-Average Price" },
  { key: "h00_totalQuantity", label: "00:00-Total Quantity" },

  { key: "h01_totalAmount", label: "01:00-Total Amount" },
  { key: "h01_averagePrice", label: "01:00-Average Price" },
  { key: "h01_totalQuantity", label: "01:00-Total Quantity" },

  { key: "h02_totalAmount", label: "02:00-Total Amount" },
  { key: "h02_averagePrice", label: "02:00-Average Price" },
  { key: "h02_totalQuantity", label: "02:00-Total Quantity" },

  { key: "h03_totalAmount", label: "03:00-Total Amount" },
  { key: "h03_averagePrice", label: "03:00-Average Price" },
  { key: "h03_totalQuantity", label: "03:00-Total Quantity" },

  { key: "h04_totalAmount", label: "04:00-Total Amount" },
  { key: "h04_averagePrice", label: "04:00-Average Price" },
  { key: "h04_totalQuantity", label: "04:00-Total Quantity" },

  { key: "h05_totalAmount", label: "05:00-Total Amount" },
  { key: "h05_averagePrice", label: "05:00-Average Price" },
  { key: "h05_totalQuantity", label: "05:00-Total Quantity" },

  { key: "h06_totalAmount", label: "06:00-Total Amount" },
  { key: "h06_averagePrice", label: "06:00-Average Price" },
  { key: "h06_totalQuantity", label: "06:00-Total Quantity" },

  { key: "h07_totalAmount", label: "07:00-Total Amount" },
  { key: "h07_averagePrice", label: "07:00-Average Price" },
  { key: "h07_totalQuantity", label: "07:00-Total Quantity" },

  { key: "h08_totalAmount", label: "08:00-Total Amount" },
  { key: "h08_averagePrice", label: "08:00-Average Price" },
  { key: "h08_totalQuantity", label: "08:00-Total Quantity" },

  { key: "h09_totalAmount", label: "09:00-Total Amount" },
  { key: "h09_averagePrice", label: "09:00-Average Price" },
  { key: "h09_totalQuantity", label: "09:00-Total Quantity" },

  { key: "h10_totalAmount", label: "10:00-Total Amount" },
  { key: "h10_averagePrice", label: "10:00-Average Price" },
  { key: "h10_totalQuantity", label: "10:00-Total Quantity" },

  { key: "h11_totalAmount", label: "11:00-Total Amount" },
  { key: "h11_averagePrice", label: "11:00-Average Price" },
  { key: "h11_totalQuantity", label: "11:00-Total Quantity" },

  { key: "h12_totalAmount", label: "12:00-Total Amount" },
  { key: "h12_averagePrice", label: "12:00-Average Price" },
  { key: "h12_totalQuantity", label: "12:00-Total Quantity" },

  { key: "h13_totalAmount", label: "13:00-Total Amount" },
  { key: "h13_averagePrice", label: "13:00-Average Price" },
  { key: "h13_totalQuantity", label: "13:00-Total Quantity" },

  { key: "h14_totalAmount", label: "14:00-Total Amount" },
  { key: "h14_averagePrice", label: "14:00-Average Price" },
  { key: "h14_totalQuantity", label: "14:00-Total Quantity" },

  { key: "h15_totalAmount", label: "15:00-Total Amount" },
  { key: "h15_averagePrice", label: "15:00-Average Price" },
  { key: "h15_totalQuantity", label: "15:00-Total Quantity" },

  { key: "h16_totalAmount", label: "16:00-Total Amount" },
  { key: "h16_averagePrice", label: "16:00-Average Price" },
  { key: "h16_totalQuantity", label: "16:00-Total Quantity" },

  { key: "h17_totalAmount", label: "17:00-Total Amount" },
  { key: "h17_averagePrice", label: "17:00-Average Price" },
  { key: "h17_totalQuantity", label: "17:00-Total Quantity" },

  { key: "h18_totalAmount", label: "18:00-Total Amount" },
  { key: "h18_averagePrice", label: "18:00-Average Price" },
  { key: "h18_totalQuantity", label: "18:00-Total Quantity" },

  { key: "h19_totalAmount", label: "19:00-Total Amount" },
  { key: "h19_averagePrice", label: "19:00-Average Price" },
  { key: "h19_totalQuantity", label: "19:00-Total Quantity" },

  { key: "h20_totalAmount", label: "20:00-Total Amount" },
  { key: "h20_averagePrice", label: "20:00-Average Price" },
  { key: "h20_totalQuantity", label: "20:00-Total Quantity" },

  { key: "h21_totalAmount", label: "21:00-Total Amount" },
  { key: "h21_averagePrice", label: "21:00-Average Price" },
  { key: "h21_totalQuantity", label: "21:00-Total Quantity" },

  { key: "h22_totalAmount", label: "22:00-Total Amount" },
  { key: "h22_averagePrice", label: "22:00-Average Price" },
  { key: "h22_totalQuantity", label: "22:00-Total Quantity" },

  { key: "h23_totalAmount", label: "23:00-Total Amount" },
  { key: "h23_averagePrice", label: "23:00-Average Price" },
  { key: "h23_totalQuantity", label: "23:00-Total Quantity" },
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

const SalesItemHour = () => {
  const [tableData, setTableData] = useState<Record<string, string | number>[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("This Month");
  const [optionFilter, setOptionFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(dateFilter);
      const res = await getProductSales(startDate, endDate, undefined, 1, 100, selectedBranch || undefined);
      if (res.success && res.data) {
        const mapped = res.data.map((item) => {
          const row: Record<string, string | number> = {
            skuCode: item.product.sku || "-",
            brand: "-",
            category: item.product.categoryName || "-",
            subCategory: "-",
            measuringUnit: "-",
            productName: item.product.name,
          };
          // Initialize all hourly columns to default
          for (let h = 0; h < 24; h++) {
            const prefix = `h${String(h).padStart(2, "0")}`;
            row[`${prefix}_totalAmount`] = "₹ 0";
            row[`${prefix}_averagePrice`] = "₹ 0";
            row[`${prefix}_totalQuantity`] = 0;
          }
          return row;
        });
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
          Sales Items Quantity by Hour
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
          <ReportActions />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-end sm:items-center">
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
        <div className="bg-white rounded-xl border border-bb-border">
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] text-sm whitespace-nowrap">
              <thead className="bg-bb-primary sticky top-0 z-10">
                <tr>
                  {TABLE_COLUMNS.map(col => (
                    <th key={col.key} className="px-4 py-3 text-left font-semibold">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredData.map((row, index) => (
                  <tr key={index} className={index % 2 === 1 ? "bg-bb-hover" : "border-b"}>
                    {TABLE_COLUMNS.map(col => (
                      <td key={col.key} className="px-4 py-3">
                        {row[col.key] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}

                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={TABLE_COLUMNS.length} className="px-4 py-8 text-center text-bb-textSoft">
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

export default SalesItemHour;
