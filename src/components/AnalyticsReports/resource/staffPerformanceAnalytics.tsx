import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getStaffPerformance,
  StaffPerformance,
} from "../../../services/reportsService";
import {
  getBranches,
  BranchResponse,
} from "../../../services/branchService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* ================= Helpers ================= */

function getDateRange(label: string): { startDate: string; endDate: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start = end;
  switch (label) {
    case "Yesterday": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      start = d.toISOString().split("T")[0];
      break;
    }
    case "Last 7 days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split("T")[0];
      break;
    }
    case "Last 30 days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      start = d.toISOString().split("T")[0];
      break;
    }
    case "Last 90 days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      start = d.toISOString().split("T")[0];
      break;
    }
    default:
      break;
  }
  return { startDate: start, endDate: end };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const COLORS = [
  "#FDC836",
  "#4CAF50",
  "#2196F3",
  "#FF5722",
  "#9C27B0",
  "#607D8B",
  "#E91E63",
  "#00BCD4",
  "#FF9800",
  "#795548",
];

const DATE_OPTIONS = [
  "Today",
  "Yesterday",
  "Last 7 days",
  "Last 30 days",
  "Last 90 days",
];

/* ================= Component ================= */

export default function StaffPerformanceAnalytics() {
  const [staffData, setStaffData] = useState<StaffPerformance[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("Last 30 days");
  const [branchFilter, setBranchFilter] = useState("");

  // Load branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await getBranches({ status: "Active" });
        if (res.success && res.data) {
          setBranches(res.data.branches);
        }
      } catch {
        // Branch filter is optional, don't block on failure
      }
    };
    fetchBranches();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getDateRange(dateFilter);
      const res = await getStaffPerformance(
        startDate,
        endDate,
        branchFilter || undefined
      );
      if (!res.success || !res.data) {
        setError(res.error?.message || "Failed to load staff performance data");
        return;
      }
      setStaffData(res.data);
    } catch {
      setError("Failed to load staff performance data");
    } finally {
      setLoading(false);
    }
  }, [dateFilter, branchFilter]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, branchFilter]);

  // Summary stats
  const totalStaff = staffData.length;
  const totalOrders = useMemo(
    () => staffData.reduce((sum, s) => sum + s.ordersProcessed, 0),
    [staffData]
  );
  const totalRevenue = useMemo(
    () => staffData.reduce((sum, s) => sum + s.totalSales, 0),
    [staffData]
  );
  const overallAvgOrderValue = useMemo(
    () => (totalOrders > 0 ? totalRevenue / totalOrders : 0),
    [totalOrders, totalRevenue]
  );

  // Top 10 performers (already sorted by totalSales desc from API)
  const top10 = useMemo(() => staffData.slice(0, 10), [staffData]);

  // Chart data: sales by staff (top 10)
  const salesByStaffChart = useMemo(
    () =>
      top10.map((s) => ({
        name:
          s.staff.name.length > 15
            ? s.staff.name.slice(0, 15) + "…"
            : s.staff.name,
        sales: s.totalSales,
        orders: s.ordersProcessed,
      })),
    [top10]
  );

  // Pie chart: revenue share (top 10)
  const revenueShareChart = useMemo(
    () =>
      top10
        .filter((s) => s.totalSales > 0)
        .map((s) => ({
          name:
            s.staff.name.length > 15
              ? s.staff.name.slice(0, 15) + "…"
              : s.staff.name,
          value: s.totalSales,
        })),
    [top10]
  );

  // CSV export
  const handleExportCSV = () => {
    if (staffData.length === 0) return;

    const headers = [
      "Rank",
      "Staff Name",
      "Email",
      "Branch",
      "Role",
      "Orders Processed",
      "Total Sales",
      "Avg Order Value",
    ];

    const rows = staffData.map((s, i) => [
      String(i + 1),
      s.staff.name,
      s.staff.email,
      s.staff.branch,
      s.staff.role,
      String(s.ordersProcessed),
      s.totalSales.toFixed(2),
      s.avgOrderValue.toFixed(2),
    ]);

    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const { startDate, endDate } = getDateRange(dateFilter);
    link.download = `staff-performance-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-3 md:mx-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Staff Performance Report
        </h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bb-input bg-bb-bg text-sm"
          >
            {DATE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bb-input bg-bb-bg text-sm"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setDateFilter("Last 30 days");
              setBranchFilter("");
            }}
            className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4"
          >
            Clear
          </button>
          <button
            onClick={handleExportCSV}
            disabled={staffData.length === 0}
            className="bb-btn bg-bb-secondary text-white rounded-md hover:bg-black/90 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="text-center py-8 text-bb-textSoft">
          Loading staff performance data...
        </div>
      )}
      {error && (
        <div className="text-center py-8 text-red-500">
          {error}
          <button
            onClick={loadData}
            className="ml-3 text-sm underline text-bb-primary"
          >
            Retry
          </button>
        </div>
      )}
      {!loading && !error && totalStaff === 0 && (
        <div className="text-center py-8 text-bb-textSoft">
          No staff performance data available for the selected period. Try a
          different date range or branch filter.
        </div>
      )}

      {!loading && !error && totalStaff > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard title="Total Staff" value={String(totalStaff)} />
            <SummaryCard title="Total Orders" value={String(totalOrders)} />
            <SummaryCard
              title="Total Revenue"
              value={formatCurrency(totalRevenue)}
            />
            <SummaryCard
              title="Avg Order Value"
              value={formatCurrency(overallAvgOrderValue)}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sales by Staff (Bar Chart) */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-bb-text mb-3">
                Top 10 Staff by Sales
              </h3>
              {salesByStaffChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={salesByStaffChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number | undefined) => [
                        formatCurrency(value ?? 0),
                        "Sales",
                      ]}
                    />
                    <Bar
                      dataKey="sales"
                      fill="#FDC836"
                      name="Sales"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-bb-textSoft text-sm">
                  No sales data available
                </div>
              )}
            </div>

            {/* Revenue Share (Pie Chart) */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-bb-text mb-3">
                Revenue Share by Staff
              </h3>
              {revenueShareChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={revenueShareChart}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                      }
                    >
                      {revenueShareChart.map((_, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | undefined) => [
                        formatCurrency(value ?? 0),
                        "Revenue",
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-bb-textSoft text-sm">
                  No revenue data available
                </div>
              )}
            </div>
          </div>

          {/* Top 10 Performers Table */}
          <div className="bg-white border rounded-lg overflow-x-auto">
            <h3 className="text-sm font-semibold text-bb-text px-4 pt-4 pb-2">
              Top 10 Performers
            </h3>
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[50px_1fr_1fr_1fr_120px_120px_120px] bg-[#F7C948] px-4 py-2 text-sm font-medium">
                <div>Rank</div>
                <div>Staff Name</div>
                <div>Branch</div>
                <div>Role</div>
                <div className="text-right">Orders</div>
                <div className="text-right">Total Sales</div>
                <div className="text-right">Avg Order</div>
              </div>
              {top10.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-bb-textSoft">
                  No staff data found
                </div>
              )}
              {top10.map((s, i) => (
                <div
                  key={s.staff.id}
                  className={`grid grid-cols-[50px_1fr_1fr_1fr_120px_120px_120px] px-4 py-2 text-sm border-t ${
                    i % 2 ? "bg-[#FFFBEA]" : ""
                  }`}
                >
                  <div className="font-semibold">
                    {i < 3 ? (
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                          i === 0
                            ? "bg-yellow-500"
                            : i === 1
                            ? "bg-gray-400"
                            : "bg-amber-700"
                        }`}
                      >
                        {i + 1}
                      </span>
                    ) : (
                      <span className="text-bb-textSoft">{i + 1}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium truncate">{s.staff.name}</div>
                    <div className="text-xs text-bb-textSoft truncate">
                      {s.staff.email}
                    </div>
                  </div>
                  <div className="text-bb-textSoft truncate">
                    {s.staff.branch}
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      {s.staff.role}
                    </span>
                  </div>
                  <div className="text-right font-medium">
                    {s.ordersProcessed}
                  </div>
                  <div className="text-right font-medium">
                    {formatCurrency(s.totalSales)}
                  </div>
                  <div className="text-right text-bb-textSoft">
                    {formatCurrency(s.avgOrderValue)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full Staff Table (if more than 10) */}
          {staffData.length > 10 && (
            <div className="bg-white border rounded-lg overflow-x-auto">
              <h3 className="text-sm font-semibold text-bb-text px-4 pt-4 pb-2">
                All Staff ({staffData.length})
              </h3>
              <div className="min-w-[700px]">
                <div className="grid grid-cols-[50px_1fr_1fr_1fr_120px_120px_120px] bg-[#F7C948] px-4 py-2 text-sm font-medium">
                  <div>#</div>
                  <div>Staff Name</div>
                  <div>Branch</div>
                  <div>Role</div>
                  <div className="text-right">Orders</div>
                  <div className="text-right">Total Sales</div>
                  <div className="text-right">Avg Order</div>
                </div>
                {staffData.map((s, i) => (
                  <div
                    key={s.staff.id}
                    className={`grid grid-cols-[50px_1fr_1fr_1fr_120px_120px_120px] px-4 py-2 text-sm border-t ${
                      i % 2 ? "bg-[#FFFBEA]" : ""
                    }`}
                  >
                    <div className="text-bb-textSoft">{i + 1}</div>
                    <div className="font-medium truncate">{s.staff.name}</div>
                    <div className="text-bb-textSoft truncate">
                      {s.staff.branch}
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        {s.staff.role}
                      </span>
                    </div>
                    <div className="text-right">{s.ordersProcessed}</div>
                    <div className="text-right">
                      {formatCurrency(s.totalSales)}
                    </div>
                    <div className="text-right text-bb-textSoft">
                      {formatCurrency(s.avgOrderValue)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ================= Sub-Components ================= */

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white border rounded-lg p-3">
      <div className="text-xs text-bb-textSoft">{title}</div>
      <div className="text-lg font-semibold text-bb-text mt-1">{value}</div>
    </div>
  );
}
