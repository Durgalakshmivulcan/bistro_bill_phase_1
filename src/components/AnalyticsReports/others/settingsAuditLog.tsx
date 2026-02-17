import { useState, useEffect, useCallback } from "react";
import ReportActions from "../../Common/ReportActions";
import { getAuditLog, AuditLog } from "../../../services/reportsService";
import ErrorDisplay from "../../Common/ErrorDisplay";

export default function SettingsAuditLog() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [actionFilter, setActionFilter] = useState<string[]>([]);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 25;

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on filter
      let startDate: string | undefined;
      let endDate: string | undefined;
      const now = new Date();

      if (dateFilter) {
        endDate = now.toISOString().split('T')[0];

        switch (dateFilter) {
          case "Today":
            startDate = endDate;
            break;
          case "Yesterday":
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = yesterday.toISOString().split('T')[0];
            endDate = startDate;
            break;
          case "Last 7 days":
            const last7Days = new Date(now);
            last7Days.setDate(last7Days.getDate() - 7);
            startDate = last7Days.toISOString().split('T')[0];
            break;
          case "Last 30 days":
            const last30Days = new Date(now);
            last30Days.setDate(last30Days.getDate() - 30);
            startDate = last30Days.toISOString().split('T')[0];
            break;
          case "Last 90 days":
            const last90Days = new Date(now);
            last90Days.setDate(last90Days.getDate() - 90);
            startDate = last90Days.toISOString().split('T')[0];
            break;
        }
      }

      const filters: any = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (actionFilter.length > 0) filters.action = actionFilter[0]; // API supports single action filter
      if (entityTypeFilter.length > 0) filters.entityType = entityTypeFilter[0]; // API supports single entity type filter

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
  }, [dateFilter, actionFilter, entityTypeFilter, currentPage]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleClearFilters = () => {
    setDateFilter("");
    setActionFilter([]);
    setEntityTypeFilter([]);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Filter logs by search query (client-side filtering on displayed data)
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
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getChangeDescription = (log: AuditLog) => {
    if (log.action === 'CREATE') {
      return `Created ${log.entityType} ${log.entityId || ''}`;
    } else if (log.action === 'UPDATE') {
      return `Updated ${log.entityType} ${log.entityId || ''}`;
    } else if (log.action === 'DELETE') {
      return `Deleted ${log.entityType} ${log.entityId || ''}`;
    }
    return `${log.action} on ${log.entityType}`;
  };

  return (
    <div className="mx-3 md:mx-4 space-y-4">
      {/* ================= Header ================= */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Settings Audit Log
        </h2>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <input
              type="text"
              placeholder="Search here..."
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
            <ReportActions />
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
          selected={dateFilter}
          onSelect={(value) => setDateFilter(value as string)}
        />

        <Dropdown
          label="Filter by Action"
          multi
          options={["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"]}
          selected={actionFilter}
          onSelect={(value) => setActionFilter(value as string[])}
        />

        <Dropdown
          label="Filter by Entity"
          multi
          options={["Product", "Order", "Customer", "Supplier", "User", "Settings"]}
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

      {/* ================= Loading State ================= */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bb-primary"></div>
        </div>
      )}

      {/* ================= Error State ================= */}
      {error && !loading && (
        <ErrorDisplay message={error} onRetry={fetchAuditLogs} />
      )}

      {/* ================= Empty State ================= */}
      {!loading && !error && filteredLogs.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No audit logs found</p>
        </div>
      )}

      {/* ================= Table ================= */}
      {!loading && !error && filteredLogs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <div className="min-w-[1170px]">
            {/* Header */}
            <div
              className="grid bg-[#F7C948] px-4 py-2 text-sm font-medium text-black"
              style={{
                gridTemplateColumns:
                  "160px 120px 140px 220px 120px 160px 140px",
              }}
            >
              <div>Entity Type</div>
              <div>Action</div>
              <div>Entity ID</div>
              <div>Change Description</div>
              <div>Changed By</div>
              <div>Timestamp</div>
              <div>IP Address</div>
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
                    "160px 120px 140px 220px 120px 160px 140px",
                }}
              >
                <div className="truncate">{log.entityType}</div>
                <div className="truncate">{log.action}</div>
                <div className="truncate">{log.entityId || 'N/A'}</div>
                <div className="truncate" title={getChangeDescription(log)}>
                  {getChangeDescription(log)}
                </div>
                <div className="truncate" title={`${log.userName} (${log.userType})`}>
                  {log.userName}
                </div>
                <div className="truncate">{formatTimestamp(log.timestamp)}</div>
                <div className="truncate">{log.ipAddress || 'N/A'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= Pagination ================= */}
      {!loading && !error && filteredLogs.length > 0 && (
        <>
          {/* Info text */}
          <div className="text-sm text-gray-600 text-center sm:text-right">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} audit logs
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-center sm:justify-end gap-2 text-sm">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-2 border rounded ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-100'
              }`}
            >
              «
            </button>

            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-2 border rounded ${
                currentPage === totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-100'
              }`}
            >
              »
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ================= Dropdown (FIXED CHECKBOX UI) ================= */

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

  const selectedArray = Array.isArray(selected) ? selected : (selected ? [selected] : []);

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

  return (
    <div className="relative w-full sm:w-44">
      <button
        onClick={() => setOpen(!open)}
        className="bb-input w-full bg-bb-bg flex justify-between items-center"
      >
        <span className="text-sm truncate">
          {selectedArray.length ? selectedArray.join(", ") : label}
        </span>

        {/* Arrow (reference-matching) */}
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
                    {/* ✅ Tick only when selected */}
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
