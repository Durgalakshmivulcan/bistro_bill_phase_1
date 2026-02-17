import { useState, useEffect, useCallback, useRef } from "react";
import { getAuditLog, AuditLog } from "../../../services/reportsService";
import ErrorDisplay from "../../Common/ErrorDisplay";

const ACTION_OPTIONS = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"];
const ENTITY_TYPE_OPTIONS = [
  "Product",
  "Order",
  "Customer",
  "Supplier",
  "User",
  "Settings",
  "Reservation",
  "Table",
  "Branch",
  "Staff",
  "Discount",
  "Category",
  "Menu",
  "Payment",
  "Invoice",
];
const DATE_OPTIONS = [
  "Today",
  "Yesterday",
  "Last 7 days",
  "Last 30 days",
  "Last 90 days",
];

export default function UserActivityAuditLog() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [actionFilter, setActionFilter] = useState<string[]>([]);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string[]>([]);
  const [userFilter, setUserFilter] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 25;

  // Detail modal state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let startDate: string | undefined;
      let endDate: string | undefined;
      const now = new Date();

      if (dateFilter) {
        endDate = now.toISOString().split("T")[0];

        switch (dateFilter) {
          case "Today":
            startDate = endDate;
            break;
          case "Yesterday": {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = yesterday.toISOString().split("T")[0];
            endDate = startDate;
            break;
          }
          case "Last 7 days": {
            const d = new Date(now);
            d.setDate(d.getDate() - 7);
            startDate = d.toISOString().split("T")[0];
            break;
          }
          case "Last 30 days": {
            const d = new Date(now);
            d.setDate(d.getDate() - 30);
            startDate = d.toISOString().split("T")[0];
            break;
          }
          case "Last 90 days": {
            const d = new Date(now);
            d.setDate(d.getDate() - 90);
            startDate = d.toISOString().split("T")[0];
            break;
          }
        }
      }

      const filters: {
        userId?: string;
        action?: string;
        entityType?: string;
        startDate?: string;
        endDate?: string;
      } = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (actionFilter.length > 0) filters.action = actionFilter[0];
      if (entityTypeFilter.length > 0) filters.entityType = entityTypeFilter[0];
      if (userFilter) filters.userId = userFilter;

      const response = await getAuditLog(filters, currentPage, itemsPerPage);

      setAuditLogs(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
    } catch (err: any) {
      console.error("Error fetching audit logs:", err);
      setError(err.message || "Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  }, [dateFilter, actionFilter, entityTypeFilter, userFilter, currentPage]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, actionFilter, entityTypeFilter, userFilter]);

  const handleClearFilters = () => {
    setDateFilter("");
    setActionFilter([]);
    setEntityTypeFilter([]);
    setUserFilter("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Client-side search on loaded data
  const filteredLogs = auditLogs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.userName.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.entityType.toLowerCase().includes(query) ||
      (log.entityId && log.entityId.toLowerCase().includes(query))
    );
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getChangeDescription = (log: AuditLog) => {
    if (log.action === "LOGIN") return `${log.userName} logged in`;
    if (log.action === "LOGOUT") return `${log.userName} logged out`;
    if (log.action === "CREATE")
      return `Created ${log.entityType} ${log.entityId || ""}`;
    if (log.action === "UPDATE")
      return `Updated ${log.entityType} ${log.entityId || ""}`;
    if (log.action === "DELETE")
      return `Deleted ${log.entityType} ${log.entityId || ""}`;
    return `${log.action} on ${log.entityType}`;
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "LOGIN":
        return "bg-purple-100 text-purple-800";
      case "LOGOUT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Timestamp",
      "User",
      "User Type",
      "Action",
      "Entity Type",
      "Entity ID",
      "Description",
      "IP Address",
    ];

    const rows = filteredLogs.map((log) => [
      formatTimestamp(log.timestamp),
      log.userName,
      log.userType,
      log.action,
      log.entityType,
      log.entityId || "N/A",
      getChangeDescription(log),
      log.ipAddress || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `user-activity-audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const renderDiffValue = (label: string, value: any) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "object") {
      return (
        <div className="mt-1">
          <span className="font-medium text-xs text-gray-500">{label}:</span>
          <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-40">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      );
    }
    return (
      <div className="mt-1">
        <span className="font-medium text-xs text-gray-500">{label}:</span>
        <span className="ml-1 text-sm">{String(value)}</span>
      </div>
    );
  };

  return (
    <div className="mx-3 md:mx-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          User Activity Audit Log
        </h2>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <input
              type="text"
              placeholder="Search by user, action, entity..."
              className="bb-input w-full pr-10 bg-bb-bg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          <button
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
            className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-end gap-2">
        <Dropdown
          label="Filter by Date"
          options={DATE_OPTIONS}
          selected={dateFilter}
          onSelect={(value) => setDateFilter(value as string)}
        />

        <Dropdown
          label="Filter by Action"
          multi
          options={ACTION_OPTIONS}
          selected={actionFilter}
          onSelect={(value) => setActionFilter(value as string[])}
        />

        <Dropdown
          label="Filter by Entity"
          multi
          options={ENTITY_TYPE_OPTIONS}
          selected={entityTypeFilter}
          onSelect={(value) => setEntityTypeFilter(value as string[])}
        />

        <button
          className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4"
          onClick={handleClearFilters}
        >
          Clear
        </button>
      </div>

      {/* Retention notice */}
      <div className="text-xs text-gray-400 text-right">
        Log retention: 90 days
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bb-primary"></div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <ErrorDisplay message={error} onRetry={fetchAuditLogs} />
      )}

      {/* Empty */}
      {!loading && !error && filteredLogs.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No audit logs found</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && filteredLogs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Header */}
            <div
              className="grid bg-[#F7C948] px-4 py-2 text-sm font-medium text-black"
              style={{
                gridTemplateColumns:
                  "160px 100px 130px 260px 140px 160px 130px 80px",
              }}
            >
              <div>Entity Type</div>
              <div>Action</div>
              <div>Entity ID</div>
              <div>Description</div>
              <div>User</div>
              <div>Timestamp</div>
              <div>IP Address</div>
              <div>Details</div>
            </div>

            {/* Rows */}
            {filteredLogs.map((log, i) => (
              <div
                key={log.id}
                className={`grid px-4 py-2 text-sm border-t ${
                  i % 2 === 1 ? "bg-[#FFFBEA]" : ""
                }`}
                style={{
                  gridTemplateColumns:
                    "160px 100px 130px 260px 140px 160px 130px 80px",
                }}
              >
                <div className="truncate">{log.entityType}</div>
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getActionBadgeColor(log.action)}`}
                  >
                    {log.action}
                  </span>
                </div>
                <div className="truncate" title={log.entityId || "N/A"}>
                  {log.entityId || "N/A"}
                </div>
                <div className="truncate" title={getChangeDescription(log)}>
                  {getChangeDescription(log)}
                </div>
                <div
                  className="truncate"
                  title={`${log.userName} (${log.userType})`}
                >
                  <span>{log.userName}</span>
                  <span className="text-xs text-gray-400 ml-1">
                    ({log.userType})
                  </span>
                </div>
                <div className="truncate">
                  {formatTimestamp(log.timestamp)}
                </div>
                <div className="truncate">{log.ipAddress || "N/A"}</div>
                <div>
                  {(log.oldValue || log.newValue) && (
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && filteredLogs.length > 0 && (
        <>
          <div className="text-sm text-gray-600 text-center sm:text-right">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
            audit logs
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-2 text-sm">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className={`px-2 border rounded ${
                currentPage === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              &laquo;
            </button>

            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className={`px-2 border rounded ${
                currentPage === totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              &raquo;
            </button>
          </div>
        </>
      )}

      {/* Detail Modal (before/after snapshots) */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-bb-text">
                Change Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                &times;
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Action:</span>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${getActionBadgeColor(selectedLog.action)}`}
                  >
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">
                    Entity Type:
                  </span>
                  <span className="ml-2">{selectedLog.entityType}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Entity ID:</span>
                  <span className="ml-2">
                    {selectedLog.entityId || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">User:</span>
                  <span className="ml-2">
                    {selectedLog.userName} ({selectedLog.userType})
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Timestamp:</span>
                  <span className="ml-2">
                    {formatTimestamp(selectedLog.timestamp)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">
                    IP Address:
                  </span>
                  <span className="ml-2">
                    {selectedLog.ipAddress || "N/A"}
                  </span>
                </div>
              </div>

              {/* Before / After snapshots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-red-600 mb-1">
                    Before (Old Value)
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded p-3 min-h-[60px]">
                    {selectedLog.oldValue ? (
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                        {typeof selectedLog.oldValue === "object"
                          ? JSON.stringify(selectedLog.oldValue, null, 2)
                          : String(selectedLog.oldValue)}
                      </pre>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-green-600 mb-1">
                    After (New Value)
                  </h4>
                  <div className="bg-green-50 border border-green-200 rounded p-3 min-h-[60px]">
                    {selectedLog.newValue ? (
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                        {typeof selectedLog.newValue === "object"
                          ? JSON.stringify(selectedLog.newValue, null, 2)
                          : String(selectedLog.newValue)}
                      </pre>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end px-6 py-3 border-t">
              <button
                onClick={() => setSelectedLog(null)}
                className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-6"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= Dropdown (reusable multi/single select) ================= */

function Dropdown({
  label,
  options,
  multi = false,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  multi?: boolean;
  selected: string | string[];
  onSelect: (value: string | string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedArray = Array.isArray(selected)
    ? selected
    : selected
      ? [selected]
      : [];

  const toggleOption = (opt: string) => {
    if (!multi) {
      onSelect(opt);
      setOpen(false);
      return;
    }

    const newSelected = selectedArray.includes(opt)
      ? selectedArray.filter((o) => o !== opt)
      : [...selectedArray, opt];
    onSelect(newSelected);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full sm:w-44" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="bb-input w-full bg-bb-bg flex justify-between items-center"
      >
        <span className="text-sm truncate">
          {selectedArray.length ? selectedArray.join(", ") : label}
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
            const active = selectedArray.includes(opt);
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
