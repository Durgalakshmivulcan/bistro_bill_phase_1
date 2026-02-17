import { useState, useEffect } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import { getSalesTrend, SalesTrendRow } from "../../../services/reportsService";

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

export default function SalesTrend() {
  const [trends, setTrends] = useState<SalesTrendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("Last 30 days");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { startDate, endDate } = getDateRange(dateFilter);
        const response = await getSalesTrend(startDate, endDate);
        if (response.success && response.data) {
          setTrends(response.data.trends);
        } else {
          setError(response.message || "Failed to load data");
        }
      } catch {
        setError("Failed to load sales trend");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dateFilter]);

  const filters = {
    startDate: getDateRange(dateFilter).startDate,
    endDate: getDateRange(dateFilter).endDate,
  };

  return (
    <div className="mx-3 md:mx-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">Sales Trend</h2>
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2">
          <div className="relative w-full sm:w-56">
            <input type="text" placeholder="Search here..." className="bb-input w-full pr-10 bg-bb-bg" />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 21l-4.35-4.35" />
              <circle cx="11" cy="11" r="7" />
            </svg>
          </div>
          <ReportActions reportType="sales" filters={filters} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-end gap-2">
        <Dropdown label="Filter by Date" options={["Today", "Yesterday", "Last 7 days", "Last 30 days", "Last 90 days"]} onSelect={(v) => setDateFilter(v[0] || "Last 30 days")} />
        <button onClick={() => setDateFilter("Last 30 days")} className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4 w-full sm:w-auto">Clear</button>
      </div>

      {/* Content */}
      {loading && <div className="text-center py-8 text-bb-textSoft">Loading sales trend...</div>}
      {error && <div className="text-center py-8 text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-7 bg-[#F7C948] text-black px-4 py-2 text-sm font-medium">
              <div>Branch Name</div>
              <div>Branch Code</div>
              <div>Branch Labels</div>
              <div>Current Month Sale</div>
              <div>Current Year Sale</div>
              <div>MoM%</div>
              <div>YoY%</div>
            </div>

            {trends.length === 0 && (
              <div className="px-4 py-8 text-center text-bb-textSoft">No sales trend data available for the selected period</div>
            )}

            {trends.map((row, i) => (
              <div key={`${row.branchCode}-${i}`} className={`grid grid-cols-7 px-4 py-2 text-sm border-t ${i % 2 === 1 ? "bg-[#FFFBEA]" : ""}`}>
                <div>{row.branchName}</div>
                <div>{row.branchCode}</div>
                <div>{row.branchLabel}</div>
                <div>₹{row.currentMonthSale.toLocaleString()}</div>
                <div>₹{row.currentYearSale.toLocaleString()}</div>
                <div>{row.momPercent.toFixed(2)}%</div>
                <div>{row.yoyPercent !== 0 ? `${row.yoyPercent.toFixed(2)}%` : "-"}</div>
              </div>
            ))}

            <div className="border-t px-4 py-3 flex justify-end bg-white">
              <Pagination />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= Dropdown ================= */

function Dropdown({ label, options, onSelect }: { label: string; options: string[]; onSelect?: (selected: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOption = (option: string) => {
    const newSelected = [option];
    setSelected(newSelected);
    setOpen(false);
    onSelect?.(newSelected);
  };

  return (
    <div className="relative w-full sm:w-44">
      <button onClick={() => setOpen(!open)} className="bb-input w-full bg-bb-bg flex justify-between items-center">
        <span className="text-sm truncate">{selected.length ? selected.join(", ") : label}</span>
        <svg className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow max-h-60 overflow-auto">
          {options.map((opt) => {
            const active = selected.includes(opt);
            return (
              <div key={opt} onClick={() => toggleOption(opt)} className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${active ? "bg-[#FFF3CD]" : "hover:bg-[#FFFBEA]"}`}>
                {opt}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
