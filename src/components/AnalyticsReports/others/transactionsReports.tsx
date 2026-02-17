import { useState, useEffect, useCallback } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import { getSalesTargets, SalesTargetRow } from "../../../services/reportsService";
import { getBranches } from "../../../services/branchService";

function getDateRange(label: string): { startDate: string; endDate: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start = end;
  switch (label) {
    case "Yesterday": { const d = new Date(now); d.setDate(d.getDate() - 1); start = d.toISOString().split("T")[0]; break; }
    case "Last 7 days": { const d = new Date(now); d.setDate(d.getDate() - 7); start = d.toISOString().split("T")[0]; break; }
    case "Last 30 days": { const d = new Date(now); d.setDate(d.getDate() - 30); start = d.toISOString().split("T")[0]; break; }
    case "Last 90 days": { const d = new Date(now); d.setDate(d.getDate() - 90); start = d.toISOString().split("T")[0]; break; }
    default: break;
  }
  return { startDate: start, endDate: end };
}

const fmt = (n: number) => `₹ ${n.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

export default function TransactionReports() {
  const [rows, setRows] = useState<SalesTargetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("Last 30 days");
  const [branchFilter, setBranchFilter] = useState<string[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getBranches({ status: "Active" }).then((res) => {
      if (res.success && res.data) {
        setBranches((res.data as any).branches || []);
      }
    }).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getDateRange(dateFilter);
      const branchId = branchFilter.length === 1 ? branches.find(b => b.name === branchFilter[0])?.id : undefined;
      const response = await getSalesTargets(startDate, endDate, branchId);
      if (response.success && response.data) {
        setRows(response.data.targets);
      } else {
        setError(response.message || "Failed to load data");
      }
    } catch {
      setError("Failed to load transaction reports");
    } finally {
      setLoading(false);
    }
  }, [dateFilter, branchFilter, branches]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [dateFilter, branchFilter]);

  const filters = {
    startDate: getDateRange(dateFilter).startDate,
    endDate: getDateRange(dateFilter).endDate,
    branchId: branchFilter.length === 1 ? branches.find(b => b.name === branchFilter[0])?.id : undefined,
  };

  return (
    <div className="mx-3 md:mx-4 space-y-4">
      {/* ================= Header ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Transaction Reports
        </h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search here..."
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
            <ReportActions reportType="sales" filters={filters} />
        </div>
      </div>

      {/* ================= Filters ================= */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-end gap-2">
        <Dropdown
          label="Filter by Date"
          options={[
            "Today",
            "Yesterday",
            "Last 7 days",
            "Last 30 days",
            "Last 90 days",
          ]}
          onSelect={(v) => setDateFilter(v[0] || "Last 30 days")}
        />

        <Dropdown
          label="Filter by Branch"
          multi
          options={branches.map(b => b.name)}
          onSelect={setBranchFilter}
        />

        <Dropdown
          label="Options"
          multi
          options={[
            "Branch Name",
            "Branch Code",
            "Channel",
            "Date",
            "Target Sales Amount",
            "Actual Sales Amount",
            "Variance Amount",
            "Target Sales Transactions",
            "Actual Sales Transactions",
            "Variance Transactions",
          ]}
        />

        <button onClick={() => { setDateFilter("Last 30 days"); setBranchFilter([]); }} className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4">
          Clear
        </button>
      </div>

      {/* Content */}
      {loading && <div className="text-center py-8 text-bb-textSoft">Loading transaction reports...</div>}
      {error && <div className="text-center py-8 text-red-500">{error}</div>}
      {!loading && !error && rows.length === 0 && <div className="text-center py-8 text-bb-textSoft">No data available</div>}

      {!loading && !error && rows.length > 0 && (
        <>
          {/* ================= Table ================= */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <div className="min-w-[1610px]">
              {/* Header */}
              <div
                className="grid bg-[#F7C948] text-black px-4 py-2 text-sm font-medium"
                style={{
                  gridTemplateColumns:
                    "140px 120px 120px 120px 160px 160px 160px 200px 200px 200px",
                }}
              >
                <div>Branch Name</div>
                <div>Branch Code</div>
                <div>Channel</div>
                <div>Date</div>
                <div>Target Sales-Amount</div>
                <div>Actual Sales-Amount</div>
                <div>Variance-Amount</div>
                <div>Target Sales-Transactions</div>
                <div>Actual Sales-Transactions</div>
                <div>Variance-Transactions</div>
              </div>

              {/* Rows */}
              {rows.map((row, i) => (
                <div
                  key={i}
                  className={`grid px-4 py-2 text-sm border-t ${
                    i % 2 === 1 ? "bg-[#FFFBEA]" : ""
                  }`}
                  style={{
                    gridTemplateColumns:
                      "140px 120px 120px 120px 160px 160px 160px 200px 200px 200px",
                  }}
                >
                  <div>{row.branchName}</div>
                  <div>{row.branchCode}</div>
                  <div>{row.channel}</div>
                  <div>{row.date}</div>
                  <div>{fmt(row.targetSalesAmount)}</div>
                  <div>{fmt(row.actualSalesAmount)}</div>
                  <div>{fmt(row.varianceAmount)}</div>
                  <div>{row.targetSalesTransactions}</div>
                  <div>{row.actualSalesTransactions}</div>
                  <div>{row.varianceTransactions}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ================= Pagination ================= */}
          <div className="flex justify-center sm:justify-end">
            <Pagination />
          </div>
        </>
      )}
    </div>
  );
}

/* ================= Dropdown ================= */

function Dropdown({
  label,
  options,
  multi = false,
  onSelect,
}: {
  label: string;
  options: string[];
  multi?: boolean;
  onSelect?: (selected: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (opt: string) => {
    let newSelected: string[];
    if (!multi) {
      newSelected = [opt];
      setOpen(false);
    } else {
      newSelected = selected.includes(opt)
        ? selected.filter((x) => x !== opt)
        : [...selected, opt];
    }
    setSelected(newSelected);
    onSelect?.(newSelected);
  };

  return (
    <div className="relative w-full sm:w-44">
      <button
        onClick={() => setOpen(!open)}
        className="bb-input w-full bg-bb-bg flex justify-between items-center"
      >
        <span className="truncate text-sm">
          {selected.length ? selected.join(", ") : label}
        </span>

        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border rounded-md shadow max-h-64 overflow-auto">
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
