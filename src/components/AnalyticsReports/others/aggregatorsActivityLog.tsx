import { useState, useEffect, useMemo, useCallback } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import { getAuditLog, AuditLog } from "../../../services/reportsService";
import { getBranches, Branch } from "../../../services/branchService";
import LoadingSpinner from "../../Common/LoadingSpinner";

/* ================= TABLE COLUMNS ================= */
const TABLE_HEADERS = [
  "Branch Name",
  "Branch Code",
  "Brand",
  "Aggregator",
  "Activity",
  "Change Logs",
  "Activity Status",
  "User",
  "Timestamp",
  "User Device Label",
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

export default function AggregatorsActivityLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
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

  // Load audit logs filtered for aggregator activity
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(dateFilter);
      const res = await getAuditLog(
        { entityType: "Aggregator", startDate, endDate },
        1,
        50
      );
      if (res.success && res.data) {
        setLogs(res.data || []);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("Failed to load aggregator logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Map audit logs to table rows
  const rows = useMemo(() => {
    return logs.map((log) => ({
      branch: "-",
      code: "-",
      brand: "-",
      aggregator: log.entityType || "-",
      activity: log.action || "-",
      changeLogs: log.oldValue && log.newValue
        ? `${JSON.stringify(log.oldValue).slice(0, 30)} → ${JSON.stringify(log.newValue).slice(0, 30)}`
        : "-",
      status: "Active",
      user: log.userName || "-",
      timestamp: log.timestamp ? new Date(log.timestamp).toLocaleString() : "-",
      deviceLabel: "-",
    }));
  }, [logs]);

  // Client-side search
  const filteredRows = useMemo(() => {
    if (!searchQuery) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, searchQuery]);

  const handleClear = () => {
    setDateFilter("Last 30 days");
    setSearchQuery("");
  };

  return (
    <div className="mx-3 md:mx-4 space-y-4">
      {/* ================= Header ================= */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Aggregators Activity Log
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <input
              type="text"
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
              <path d="M21 21l-4.35-4.35" />
              <circle cx="11" cy="11" r="7" />
            </svg>
          </div>
          <ReportActions />
        </div>
      </div>

      {/* ================= Filters ================= */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap justify-end gap-2">
        <Dropdown
          label="Filter by Date"
          options={[
            "Today",
            "Yesterday",
            "Last 7 days",
            "Last 30 days",
            "Last 90 days",
          ]}
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
          options={TABLE_HEADERS}
        />

        <button
          onClick={handleClear}
          className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4 w-full sm:w-auto"
        >
          Clear
        </button>
      </div>

      {/* ================= Loading ================= */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading activity logs..." />
        </div>
      )}

      {/* ================= Table ================= */}
      {!loading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Header */}
            <div className="grid grid-cols-10 bg-[#F7C948] px-4 py-2 text-sm font-medium text-black">
              {TABLE_HEADERS.map((h) => (
                <div key={h}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            {filteredRows.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No data available
              </div>
            ) : (
              filteredRows.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-10 px-4 py-2 text-sm border-t ${
                    i % 2 === 1 ? "bg-[#FFFBEA]" : ""
                  }`}
                >
                  <div>{row.branch}</div>
                  <div>{row.code}</div>
                  <div>{row.brand}</div>
                  <div>{row.aggregator}</div>
                  <div>{row.activity}</div>
                  <div>{row.changeLogs}</div>
                  <div>
                    <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs">
                      {row.status}
                    </span>
                  </div>
                  <div>{row.user}</div>
                  <div>{row.timestamp}</div>
                  <div>{row.deviceLabel}</div>
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
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
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
                    {active && "\u2713"}
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
