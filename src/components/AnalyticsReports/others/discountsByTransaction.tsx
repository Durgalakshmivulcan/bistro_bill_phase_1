import { useState, useEffect, useMemo, useCallback } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import { getDiscountUsage, DiscountAnalytics } from "../../../services/reportsService";
import { getBranches, Branch } from "../../../services/branchService";
import LoadingSpinner from "../../Common/LoadingSpinner";

/* ================= COLUMN DEFINITIONS ================= */

const columns = [
  "Branch Name",
  "Branch Code",
  "Branch Labels",
  "Business Brand",
  "Discount Code",
  "Product Name",
  "Product SKU",
  "Product Quantity for Discount",
  "Discount Amount",
  "Discount %",
  "Discount On",
  "Discount Type",
  "Source",
  "Reason for Discount",
  "Remarks for Discount",
  "Discount Applied by",
  "Business Date",
  "Invoice Date",
  "Invoice Number",
  "Invoice Type",
  "Channel Name",
  "Channel Label",
  "Session",
  "Coupon Code",
  "Coupon Provider",
  "Campaign Name",
  "Category",
  "Sub-Category",
  "Product Brand",
  "Account Name",
  "Product Group Name",
  "Variants",
  "Label",
  "No. of People",
  "Loyalty Points Redeemed",
  "Customer Id",
  "Customer Name",
  "Customer Group",
  "Phone Number",
  "Statement Number",
  "Order No.",
];

/* ================= DATE HELPERS ================= */
function getDateRange(filter: string) {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start = end;
  if (filter === "Yesterday") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    start = d.toISOString().split("T")[0];
  } else if (filter === "Last 7 days") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    start = d.toISOString().split("T")[0];
  } else if (filter === "Last 30 days") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    start = d.toISOString().split("T")[0];
  }
  return { startDate: start, endDate: end };
}

/* ================= MAIN COMPONENT ================= */

export default function DiscountsByTransaction() {
  const [discounts, setDiscounts] = useState<DiscountAnalytics[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("Last 30 days");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Load discount data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(dateFilter);
      const res = await getDiscountUsage(startDate, endDate);
      if (res.success && res.data) {
        setDiscounts(res.data.discounts || []);
      } else {
        setDiscounts([]);
      }
    } catch (err) {
      console.error("Failed to load discount data:", err);
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Map discount analytics to row arrays for the grid display
  const data = useMemo(() => {
    return discounts.map((d) => [
      "-", // Branch Name
      "-", // Branch Code
      "-", // Branch Labels
      "-", // Business Brand
      d.code || "-",
      d.name || "-",
      "-", // Product SKU
      String(d.usageCount || 0),
      `₹ ${d.totalDiscountGiven || 0}`,
      d.valueType === "percentage" ? `${d.value}%` : "-",
      "-", // Discount On
      d.type || "-",
      "-", // Source
      "-", // Reason
      "-", // Remarks
      "-", // Applied by
      "-", // Business Date
      "-", // Invoice Date
      "-", // Invoice Number
      "-", // Invoice Type
      "-", // Channel Name
      "-", // Channel Label
      "-", // Session
      d.code || "-",
      "-", // Coupon Provider
      "-", // Campaign Name
      "-", // Category
      "-", // Sub-Category
      "-", // Product Brand
      "-", // Account Name
      "-", // Product Group Name
      "-", // Variants
      "-", // Label
      "-", // No. of People
      "-", // Loyalty Points Redeemed
      "-", // Customer Id
      "-", // Customer Name
      "-", // Customer Group
      "-", // Phone Number
      "-", // Statement Number
      `${d.ordersAffected || 0} orders`,
    ]);
  }, [discounts]);

  // Client-side search
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  const handleClear = () => {
    setDateFilter("Last 30 days");
    setSearchQuery("");
  };

  return (
    <div className="mx-3 md:mx-4 space-y-4">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Discounts by Transaction
        </h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <input
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bb-input w-full pr-10 bg-bb-bg"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <ReportActions />
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap justify-end gap-2">
        <Dropdown
          label="Filter by Date"
          options={["Today", "Yesterday", "Last 7 days", "Last 30 days"]}
          onSelect={(val) => setDateFilter(val)}
        />

        <Dropdown
          label="Filter by Branch"
          multi
          options={branches.map((b) => b.name)}
        />

        <Dropdown
          label="Options"
          multi
          options={columns}
        />

        <button
          onClick={handleClear}
          className="bb-btn bg-[#F7C948] text-black border border-black px-4 rounded-md w-full sm:w-auto"
        >
          Clear
        </button>
      </div>

      {/* ================= LOADING ================= */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading discount data..." />
        </div>
      )}

      {/* ================= TABLE ================= */}
      {!loading && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <div className="min-w-[5800px]">

            {/* Header */}
            <div
              className="grid bg-[#F7C948] text-black text-xs font-semibold px-3 py-2"
              style={{ gridTemplateColumns: `repeat(${columns.length}, 140px)` }}
            >
              {columns.map((col) => (
                <div key={col} className="break-words leading-tight">
                  {col}
                </div>
              ))}
            </div>

            {/* Rows */}
            {filteredData.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No data available
              </div>
            ) : (
              filteredData.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className={`grid px-3 py-2 text-xs border-t ${
                    rowIndex % 2 === 0 ? "bg-[#FFFBEA]" : "bg-white"
                  }`}
                  style={{
                    gridTemplateColumns: `repeat(${columns.length}, 140px)`,
                  }}
                >
                  {row.map((cell, cellIndex) => (
                    <div key={cellIndex} className="whitespace-nowrap">
                      {cell}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= PAGINATION ================= */}
      <div className="flex justify-center sm:justify-end">
        <Pagination />
      </div>
    </div>
  );
}

/* ================= DROPDOWN (REFERENCE MATCH) ================= */

function Dropdown({
  label,
  options,
  multi = false,
  onSelect,
}: {
  label: string;
  options: string[];
  multi?: boolean;
  onSelect?: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (opt: string) => {
    if (!multi) {
      setSelected([opt]);
      setOpen(false);
      onSelect?.(opt);
      return;
    }
    setSelected((p) =>
      p.includes(opt) ? p.filter((x) => x !== opt) : [...p, opt]
    );
  };

  return (
    <div className="relative w-full sm:w-44">
      <button
        onClick={() => setOpen(!open)}
        className="bb-input w-full bg-bb-bg flex justify-between items-center"
      >
        <span className="text-sm truncate">
          {selected.length ? selected.join(", ") : label}
        </span>

        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border rounded-md shadow max-h-60 overflow-auto">
          {options.map((opt) => {
            const active = selected.includes(opt);
            return (
              <div
                key={opt}
                onClick={() => toggle(opt)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm
                  ${active ? "bg-[#FFF3CD]" : "hover:bg-[#FFFBEA]"}`}
              >
                {multi && (
                  <span
                    className={`w-4 h-4 border flex items-center justify-center text-xs
                      ${
                        active
                          ? "bg-black text-white border-black"
                          : "border-gray-300"
                      }`}
                  >
                    {active && "✓"}
                  </span>
                )}
                {opt}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
