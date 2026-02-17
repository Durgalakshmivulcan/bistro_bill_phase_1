import { useState, useEffect, useMemo, useCallback } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import { getSalesTransactions, SalesTransactionRow } from "../../../services/reportsService";
import { getBranches, Branch } from "../../../services/branchService";
import LoadingSpinner from "../../Common/LoadingSpinner";

/* ================= SINGLE SOURCE OF TRUTH ================= */

const TABLE_GRID =
  "grid grid-cols-[140px_120px_120px_140px_140px_140px_160px_140px_160px_160px_140px_140px_160px_160px_160px_140px_140px_160px_140px_140px_140px_120px_140px_140px_140px_180px_180px_180px_160px_160px_160px_180px_180px_160px_160px_160px_180px]";

const HEADERS = [
  "Branch Name",
  "Branch Code",
  "Branch Labels",
  "Business Brand",
  "Business Date",
  "Invoice Date",
  "Invoice Number",
  "Invoice Type",
  "Sale Status",
  "Fulfillment Status",
  "Order No.",
  "Order Source",
  "Source Order No.",
  "Source Outlet Id",
  "Open Order Amount",
  "Sub Total",
  "Discounts",
  "Direct Charge Amount",
  "Net Amount",
  "Other Charge Amount",
  "Taxes",
  "Rounding",
  "Tips",
  "Total",
  "Paid Amount",
  "Balance Due",
  "Channel Name",
  "Commission Calculation On",
  "Include Goods Tax",
  "Commissionable Amount",
  "Commissionable Fee Type",
  "Commissionable Fee Rate",
  "Commission Amount",
  "Convenience Fee Type",
  "Convenience Fee Rate",
  "Convenience Fee Amount",
  "Total Commission Amount",
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
  } else if (filter === "Last 90 days") {
    const d = new Date(now);
    d.setDate(d.getDate() - 90);
    start = d.toISOString().split("T")[0];
  }
  return { startDate: start, endDate: end };
}

/* ================= MAIN COMPONENT ================= */

export default function SaleCommission() {
  const [transactions, setTransactions] = useState<SalesTransactionRow[]>([]);
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

  // Load transaction data (commission is derived from sales transactions)
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(dateFilter);
      const res = await getSalesTransactions(startDate, endDate);
      if (res.success && res.data) {
        setTransactions(res.data.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Failed to load commission data:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Map transactions to row arrays for the grid display
  const ROWS = useMemo(() => {
    return transactions.map((t) => [
      String(t.branchName || "-"),
      String(t.branchCode || "-"),
      "-", // Branch Labels
      "-", // Business Brand
      String(t.businessDate || "-"),
      String(t.invoiceDate || "-"),
      String(t.invoiceNumber || "-"),
      String(t.invoiceType || "-"),
      "-", // Sale Status
      "-", // Fulfillment Status
      String(t.orderLink || "-"),
      String(t.orderSource || "-"),
      "-", // Source Order No.
      "-", // Source Outlet Id
      "-", // Open Order Amount
      String(t.subTotal || "-"),
      String(t.discounts || "-"),
      "-", // Direct Charge Amount
      String(t.netAmount || "-"),
      String(t.otherCharges || "-"),
      String(t.taxes || "-"),
      String(t.rounding || "-"),
      String(t.tips || "-"),
      String(t.total || "-"),
      String(t.amountPaid || "-"),
      String(t.amountDue || "-"),
      String(t.channel || "-"),
      "-", // Commission Calculation On
      "-", // Include Goods Tax
      "-", // Commissionable Amount
      "-", // Commissionable Fee Type
      "-", // Commissionable Fee Rate
      "-", // Commission Amount
      "-", // Convenience Fee Type
      "-", // Convenience Fee Rate
      "-", // Convenience Fee Amount
      "-", // Total Commission Amount
    ]);
  }, [transactions]);

  // Client-side search
  const filteredRows = useMemo(() => {
    if (!searchQuery) return ROWS;
    const q = searchQuery.toLowerCase();
    return ROWS.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(q))
    );
  }, [ROWS, searchQuery]);

  const handleClear = () => {
    setDateFilter("Last 30 days");
    setSearchQuery("");
  };

  return (
    <div className="mx-3 md:mx-4 space-y-4">

      {/* ================= Header ================= */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Sale Commission
        </h2>

        <div className="flex flex-col sm:flex-row gap-2">
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

      {/* ================= Filters ================= */}
      <div className="flex flex-wrap justify-end gap-2">
        <Dropdown
          label="Filter by Date"
          options={["Today", "Yesterday", "Last 7 days", "Last 30 days", "Last 90 days"]}
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
          options={["Invoice Number", "Commission Amount", "Total Commission Amount"]}
        />

        <button
          onClick={handleClear}
          className="bb-btn bg-[#F7C948] text-black border border-black px-4 rounded-md"
        >
          Clear
        </button>
      </div>

      {/* ================= Loading ================= */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading commission data..." />
        </div>
      )}

      {/* ================= Table ================= */}
      {!loading && (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <div className="min-w-[5650px]">

            {/* ===== Header ===== */}
            <div className={`${TABLE_GRID} bg-[#F7C948] px-4 py-2 text-sm font-medium text-black`}>
              {HEADERS.map((h) => (
                <div key={h} className="break-words leading-tight">
                  {h}
                </div>
              ))}
            </div>

            {/* ===== Rows ===== */}
            {filteredRows.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No data available
              </div>
            ) : (
              filteredRows.map((row, i) => (
                <div
                  key={i}
                  className={`${TABLE_GRID} px-4 py-2 text-sm border-t ${
                    i % 2 === 1 ? "bg-[#FFFBEA]" : ""
                  }`}
                >
                  {row.map((cell, idx) => (
                    <div key={idx} className="whitespace-nowrap">
                      {cell}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= Pagination ================= */}
      <div className="flex justify-center sm:justify-end">
        <Pagination />
      </div>
    </div>
  );
}

/* ================= Dropdown (REFERENCE MATCHED) ================= */

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

  const toggleOption = (opt: string) => {
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
                onClick={() => toggleOption(opt)}
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
