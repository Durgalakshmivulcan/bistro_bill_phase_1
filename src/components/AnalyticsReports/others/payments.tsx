import { useState, useEffect, useCallback } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import { getPaymentTransactions, PaymentRow } from "../../../services/reportsService";
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

const COLUMNS = [
  { key: "branch", label: "Branch Name" },
  { key: "code", label: "Branch Code" },
  { key: "label", label: "Branch Labels" },
  { key: "brand", label: "Business Brand" },
  { key: "bdate", label: "Business Date" },
  { key: "order", label: "Order Type" },
  { key: "pdate", label: "Payment Date" },
  { key: "ptime", label: "Payment Time" },
  { key: "amount", label: "Payment Amount" },
  { key: "ptype", label: "Payment Type" },
  { key: "pmode", label: "Payment Mode" },
  { key: "posted", label: "Posted by" },
  { key: "pid", label: "Payment Id" },
  { key: "tid", label: "Transaction Id" },
  { key: "inv", label: "Invoice Number" },
  { key: "idate", label: "Invoice Date" },
  { key: "itype", label: "Invoice Type" },
  { key: "status", label: "Sale Status" },
  { key: "warn", label: "Warnings" },
  { key: "orderno", label: "Order No." },
];

export default function Payments() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
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
      const response = await getPaymentTransactions(startDate, endDate, branchId);
      if (response.success && response.data) {
        setRows(response.data.payments);
      } else {
        setError(response.message || "Failed to load data");
      }
    } catch {
      setError("Failed to load payment transactions");
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
          Payments
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
            "Branch Labels",
            "Business Brand",
            "Business Date",
            "Order Type",
            "Payment Date",
            "Payment Time",
            "Payment Amount",
            "Payment Type",
            "Payment Mode",
            "Posted by",
            "Payment Id",
            "Transaction Id",
            "Invoice Number",
            "Invoice Date",
            "Invoice Type",
            "Sale Status",
            "Warnings",
            "Statement Number",
            "Order No.",
          ]}
        />

        <button onClick={() => { setDateFilter("Last 30 days"); setBranchFilter([]); }} className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4">
          Clear
        </button>
      </div>

      {/* Content */}
      {loading && <div className="text-center py-8 text-bb-textSoft">Loading payments...</div>}
      {error && <div className="text-center py-8 text-red-500">{error}</div>}
      {!loading && !error && rows.length === 0 && <div className="text-center py-8 text-bb-textSoft">No data available</div>}

      {!loading && !error && rows.length > 0 && (
        <>
          {/* ================= Table ================= */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <div className="min-w-[2650px]">
              {/* Header */}
              <div
                className="grid bg-[#F7C948] text-black px-4 py-2 text-xs font-medium"
                style={{
                  gridTemplateColumns:
                    "140px 100px 120px 140px 120px 120px 120px 120px 140px 120px 120px 120px 180px 180px 140px 120px 120px 120px 140px 120px",
                }}
              >
                {COLUMNS.map(col => (
                  <div key={col.key}>{col.label}</div>
                ))}
              </div>

              {/* Rows */}
              {rows.map((row, i) => (
                <div
                  key={i}
                  className={`grid px-4 py-2 text-xs border-t ${
                    i % 2 === 1 ? "bg-[#FFFBEA]" : ""
                  }`}
                  style={{
                    gridTemplateColumns:
                      "140px 100px 120px 140px 120px 120px 120px 120px 140px 120px 120px 120px 180px 180px 140px 120px 120px 120px 140px 120px",
                  }}
                >
                  {COLUMNS.map(col => {
                    const val = row[col.key];
                    if (col.key === "status") {
                      return (
                        <div key={col.key}>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              val === "Closed"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {val}
                          </span>
                        </div>
                      );
                    }
                    return <div key={col.key}>{val}</div>;
                  })}
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

        {/* Arrow stays the same */}
        <svg
          className={`w-4 h-4 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          stroke="currentColor"
          fill="none"
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
                {/* checkbox from reference */}
                {multi && (
                  <span
                    className={`w-4 h-4 border flex items-center justify-center text-xs
                      ${
                        active
                          ? "bg-black text-white border-black"
                          : "border-gray-300"
                      }`}
                  >
                    {active ? "✓" : ""}
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
