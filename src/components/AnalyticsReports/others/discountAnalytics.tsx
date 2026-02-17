import { useState, useEffect, useCallback } from "react";
import ReportActions from "../../Common/ReportActions";
import {
  getDiscountUsage,
  DiscountUsageReport,
  DiscountAnalytics as DiscountAnalyticsType,
} from "../../../services/reportsService";
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

const fmt = (n: number) => `₹ ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CHANNEL_COLORS = ["#FDC836", "#4CAF50", "#2196F3", "#FF5722", "#9C27B0", "#607D8B"];

const TABLE_GRID =
  "grid grid-cols-[120px_180px_100px_100px_100px_120px_120px_100px_100px]";

/* ================= Component ================= */

export default function DiscountAnalyticsPage() {
  const [data, setData] = useState<DiscountUsageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("Last 30 days");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getDateRange(dateFilter);
      const response = await getDiscountUsage(startDate, endDate);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to load discount analytics");
      }
    } catch {
      setError("Failed to load discount analytics");
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [dateFilter]);

  const filters = {
    startDate: getDateRange(dateFilter).startDate,
    endDate: getDateRange(dateFilter).endDate,
  };

  const filteredDiscounts = (data?.discounts || []).filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.code.toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q)
    );
  });

  // Sort by usage count descending for "most-used" display
  const sortedDiscounts = [...filteredDiscounts].sort(
    (a, b) => b.usageCount - a.usageCount
  );

  // Channel breakdown (group by discount type as proxy for channel usage)
  const channelBreakdown = sortedDiscounts.reduce<
    Record<string, { count: number; amount: number }>
  >((acc, d) => {
    const key = d.type || "Other";
    if (!acc[key]) acc[key] = { count: 0, amount: 0 };
    acc[key].count += d.usageCount;
    acc[key].amount += d.totalDiscountGiven;
    return acc;
  }, {});

  const channelData = Object.entries(channelBreakdown).map(([name, val]) => ({
    name,
    usageCount: val.count,
    amount: val.amount,
  }));

  // Bar chart data: top 10 most-used discounts
  const barChartData = sortedDiscounts.slice(0, 10).map((d) => ({
    name: d.code.length > 10 ? d.code.slice(0, 10) + "…" : d.code,
    usageCount: d.usageCount,
    totalDiscount: d.totalDiscountGiven,
  }));

  const handleExportCSV = () => {
    if (!sortedDiscounts.length) return;

    const headers = [
      "Code",
      "Name",
      "Type",
      "Value Type",
      "Value",
      "Status",
      "Usage Count",
      "Total Discount Given",
      "Orders Affected",
      "Usage Limit",
      "Remaining Uses",
    ];
    const rows = sortedDiscounts.map((d) => [
      d.code,
      d.name,
      d.type,
      d.valueType,
      d.value,
      d.status,
      d.usageCount,
      d.totalDiscountGiven,
      d.ordersAffected,
      d.usageLimit ?? "N/A",
      d.remainingUses ?? "N/A",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `discount-analytics-${filters.startDate}-to-${filters.endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-3 md:mx-4 space-y-4">
      {/* ================= Header ================= */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Discount Analytics
        </h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <div className="relative w-full sm:w-56">
            <input
              type="text"
              placeholder="Search by code or name..."
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
          <ReportActions reportType="sales" filters={filters} />
        </div>
      </div>

      {/* ================= Filters ================= */}
      <div className="flex flex-wrap justify-end gap-2">
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
        <button
          onClick={() => {
            setDateFilter("Last 30 days");
            setSearchQuery("");
          }}
          className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4"
        >
          Clear
        </button>
        <button
          onClick={handleExportCSV}
          className="bb-btn bg-bb-secondary text-white rounded-md hover:bg-black/90 px-4"
        >
          Export CSV
        </button>
      </div>

      {/* ================= Loading / Error / Empty ================= */}
      {loading && (
        <div className="text-center py-8 text-bb-textSoft">
          Loading discount analytics...
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
      {!loading && !error && !data && (
        <div className="text-center py-8 text-bb-textSoft">
          No discount analytics available
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* ================= Summary Cards ================= */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <SummaryCard
              title="Total Discounts"
              value={String(data.summary.totalDiscounts)}
            />
            <SummaryCard
              title="Active Discounts"
              value={String(data.summary.activeDiscounts)}
            />
            <SummaryCard
              title="Total Redemptions"
              value={String(data.summary.totalUsageCount)}
            />
            <SummaryCard
              title="Total Discount Given"
              value={fmt(data.summary.totalDiscountGiven)}
            />
            <SummaryCard
              title="Orders Affected"
              value={String(data.summary.totalOrdersAffected)}
            />
          </div>

          {/* ================= Charts ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Usage Over Time (Bar Chart) */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-bb-text mb-3">
                Top Discounts by Usage
              </h3>
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number | undefined, name: string | undefined) => [
                        name === "totalDiscount" ? fmt(value ?? 0) : (value ?? 0),
                        name === "totalDiscount"
                          ? "Discount Amount"
                          : "Redemptions",
                      ]}
                    />
                    <Bar
                      dataKey="usageCount"
                      fill="#FDC836"
                      name="Redemptions"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-bb-textSoft text-sm">
                  No usage data available
                </div>
              )}
            </div>

            {/* Usage by Type (Pie Chart) */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-bb-text mb-3">
                Discount Usage by Type
              </h3>
              {channelData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={channelData}
                      dataKey="usageCount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                      }
                    >
                      {channelData.map((_, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | undefined) => [value ?? 0, "Redemptions"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-bb-textSoft text-sm">
                  No channel data available
                </div>
              )}
            </div>
          </div>

          {/* ================= Revenue vs Discount ================= */}
          {data.summary.totalOrdersAffected > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-bb-text mb-2">
                Total Revenue Discount vs Total Sales
              </h3>
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-bb-textSoft">Total Discount Given: </span>
                  <span className="font-semibold">
                    {fmt(data.summary.totalDiscountGiven)}
                  </span>
                </div>
                <div>
                  <span className="text-bb-textSoft">Orders Affected: </span>
                  <span className="font-semibold">
                    {data.summary.totalOrdersAffected}
                  </span>
                </div>
                <div>
                  <span className="text-bb-textSoft">
                    Avg Discount per Order:{" "}
                  </span>
                  <span className="font-semibold">
                    {fmt(
                      data.summary.totalOrdersAffected > 0
                        ? data.summary.totalDiscountGiven /
                            data.summary.totalOrdersAffected
                        : 0
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================= Discounts Table ================= */}
          <div className="bg-white border rounded-lg overflow-x-auto">
            <div className="min-w-[1140px]">
              {/* Table Header */}
              <div
                className={`${TABLE_GRID} bg-[#F7C948] px-4 py-2 text-sm font-medium`}
              >
                <div>Code</div>
                <div>Name</div>
                <div>Type</div>
                <div>Value Type</div>
                <div>Value</div>
                <div>Redemptions</div>
                <div>Discount Given</div>
                <div>Orders</div>
                <div>Status</div>
              </div>

              {/* Rows */}
              {sortedDiscounts.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-bb-textSoft">
                  No discounts found
                </div>
              )}
              {sortedDiscounts.map((d, i) => (
                <DiscountRow key={d.id} discount={d} index={i} />
              ))}
            </div>
          </div>
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

function DiscountRow({
  discount,
  index,
}: {
  discount: DiscountAnalyticsType;
  index: number;
}) {
  return (
    <div
      className={`${TABLE_GRID} px-4 py-2 text-sm border-t ${
        index % 2 ? "bg-[#FFFBEA]" : ""
      }`}
    >
      <div className="font-medium">{discount.code}</div>
      <div className="truncate">{discount.name}</div>
      <div>{discount.type}</div>
      <div>{discount.valueType}</div>
      <div>
        {discount.valueType === "Percentage"
          ? `${discount.value}%`
          : fmt(discount.value)}
      </div>
      <div className="font-medium">{discount.usageCount}</div>
      <div>{fmt(discount.totalDiscountGiven)}</div>
      <div>{discount.ordersAffected}</div>
      <div>
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            discount.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {discount.status}
        </span>
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
  onSelect?: (selected: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOption = (opt: string) => {
    let newSelected: string[];
    if (!multi) {
      newSelected = [opt];
      setOpen(false);
    } else {
      newSelected = selected.includes(opt)
        ? selected.filter((o) => o !== opt)
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
        <span className="text-sm truncate">
          {selected.length ? selected.join(", ") : label}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${
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
        <div className="absolute z-20 w-full bg-white border rounded-md shadow max-h-64 overflow-auto">
          {options.map((opt) => {
            const active = selected.includes(opt);
            return (
              <div
                key={opt}
                onClick={() => toggleOption(opt)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${
                  active ? "bg-[#FFF3CD]" : "hover:bg-[#FFF3CD]"
                }`}
              >
                {multi && (
                  <span
                    className={`w-4 h-4 border flex items-center justify-center ${
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
