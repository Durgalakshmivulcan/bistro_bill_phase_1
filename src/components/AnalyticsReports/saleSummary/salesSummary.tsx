import { useState, useEffect } from "react";
import ReportActions from "../../Common/ReportActions";
import { getSalesSummary } from "../../../services/reportsService";
import type { SalesSummary as SalesSummaryReport } from "../../../services/reportsService";
import { getBranches, Branch } from "../../../services/branchService";

export default function SalesSummary() {
  const [open, setOpen] = useState({
    gross: true,
    payment: true,
    tax: true,
    transactions: true,
    category: true,
    channel: true,
    source: true,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesData, setSalesData] = useState<SalesSummaryReport | null>(null);

  const [branchNames, setBranchNames] = useState<string[]>([]);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await getBranches({ status: "Active" });
        if (res.success && res.data) {
          setBranchNames(["All", ...res.data.branches.map((b: Branch) => b.name)]);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };
    loadBranches();
  }, []);

  const [dateFilter, setDateFilter] = useState<string>("Last 7 days");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const toggle = (key: keyof typeof open) =>
    setOpen((p) => ({ ...p, [key]: !p[key] }));

  useEffect(() => {
    fetchSalesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, startDate, endDate]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    switch (dateFilter) {
      case "Today":
        start.setHours(0, 0, 0, 0);
        break;
      case "Yesterday":
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case "Last 7 days":
        start.setDate(start.getDate() - 7);
        break;
      case "Last 30 days":
        start.setDate(start.getDate() - 30);
        break;
      case "Last 90 days":
        start.setDate(start.getDate() - 90);
        break;
      case "+ Custom Date":
        if (startDate && endDate) {
          return { start: startDate, end: endDate };
        }
        start.setDate(start.getDate() - 7);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }

    return { start: start.toISOString(), end: end.toISOString() };
  };

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { start, end } = getDateRange();

      if (dateFilter === "+ Custom Date" && (!startDate || !endDate)) {
        return;
      }

      const response = await getSalesSummary(start, end);

      if (response.success && response.data) {
        setSalesData(response.data);
      } else {
        setError(response.message || "Failed to load sales data");
      }
    } catch (err) {
      setError("An error occurred while loading sales data");
      console.error("Error fetching sales summary:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-3 md:mx-4 space-y-4">

      {/* ================= Header ================= */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Sales Summary
        </h2>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-56">
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

  <ReportActions
            reportType="sales"
            filters={{
              startDate: getDateRange().start,
              endDate: getDateRange().end
            }}
          />
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
            "+ Custom Date",
          ]}
          onSelect={(value) => setDateFilter(value)}
        />

        <Dropdown
          label="Filter by Branch"
          multi
          options={branchNames}
        />

        <Dropdown
          label="Options"
          multi
          options={[
            "Customer Id",
            "First Name",
            "Last Name",
            "Email Address",
            "Phone Number",
            "Gross Amount",
            "No. of Sales",
            "Net Amount",
            "Taxes",
            "Charges",
          ]}
        />

        <button
          onClick={() => {
            setDateFilter("Last 7 days");
            setStartDate("");
            setEndDate("");
          }}
          className="bb-btn bg-[#F7C948] text-black border border-black px-4 rounded-md"
        >
          Clear
        </button>
      </div>

      {/* ================= Error State ================= */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* ================= Loading State ================= */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bb-primary"></div>
        </div>
      )}

      {/* ================= Table ================= */}
      {!loading && salesData && (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <div className="min-w-[600px]">

            {/* Header */}
            <div className="grid grid-cols-2 bg-bb-primary text-bb-secondary px-4 py-2 text-sm font-medium">
              <div>Description</div>
              <div className="text-right">Amount</div>
            </div>

            <div className="divide-y divide-gray-200 text-sm">
              <SectionRow
                title="Gross Sales (Net Sales - Direct Charges + Discounts + Returns)"
                amount={`₹ ${salesData.currentPeriod.totalRevenue?.toFixed(2) || 0}`}
                open={open.gross}
                onClick={() => toggle("gross")}
              />
              {open.gross && (
                <>
                  <SubRow label="Sales Return" value="₹ 0" />
                  <SubRow label="Discounts" value={`₹ ${salesData.currentPeriod.totalDiscounts?.toFixed(2) || 0}`} />
                  <SubRow label="Packaging Charges (Direct Charges)" value="₹ 0" />
                  <SubRow label="Net Sales" value={`₹ ${(salesData.currentPeriod.totalRevenue - salesData.currentPeriod.totalTax)?.toFixed(2) || 0}`} />
                  <SubRow label="Service Charges (Indirect Charges)" value="₹ 0" />
                  <SubRow label="Taxes" value={`₹ ${salesData.currentPeriod.totalTax?.toFixed(2) || 0}`} />
                  <SubRow label="Rounding" value="₹ 0" />
                  <SubRow label="Tip" value="₹ 0" />
                  <SubRow label="Total Gross Revenue" value={`₹ ${salesData.currentPeriod.totalRevenue?.toFixed(2) || 0}`} />
                </>
              )}

              <SectionRow
                title="Payment Summary"
                amount={`₹ ${salesData.currentPeriod.totalRevenue?.toFixed(2) || 0}`}
                open={open.payment}
                onClick={() => toggle("payment")}
              />
              {open.payment && (
                <>
                  <SubRow label="Total Amount" value={`₹ ${salesData.currentPeriod.totalRevenue?.toFixed(2) || 0}`} />
                </>
              )}

              <SectionRow
                title="Tax Summary"
                amount={`₹ ${salesData.currentPeriod.totalTax?.toFixed(2) || 0}`}
                open={open.tax}
                onClick={() => toggle("tax")}
              />
              {open.tax && (
                <>
                  <SubRow label="Total Tax" value={`₹ ${salesData.currentPeriod.totalTax?.toFixed(2) || 0}`} />
                </>
              )}

              <SectionRow
                title="Transactions Summary"
                open={open.transactions}
                onClick={() => toggle("transactions")}
              />
              {open.transactions && (
                <>
                  <SubRow label="No. of Transactions" value={salesData.currentPeriod.totalOrders?.toString() || "0"} />
                  <SubRow label="Average Sale per Transaction" value={`₹ ${salesData.currentPeriod.avgOrderValue?.toFixed(2) || 0}`} />
                </>
              )}

              <SectionRow
                title="Period Comparison"
                open={open.category}
                onClick={() => toggle("category")}
              />
              {open.category && (
                <>
                  <SubRow label="Orders Change" value={`${salesData.comparison.ordersChange?.toFixed(2) || 0}%`} />
                  <SubRow label="Revenue Change" value={`${salesData.comparison.revenueChange?.toFixed(2) || 0}%`} />
                  <SubRow label="Avg Order Value Change" value={`${salesData.comparison.avgOrderValueChange?.toFixed(2) || 0}%`} />
                </>
              )}

              <SectionRow
                title="Previous Period"
                open={open.channel}
                onClick={() => toggle("channel")}
              />
              {open.channel && (
                <>
                  <SubRow label="Total Orders" value={salesData.previousPeriod.totalOrders?.toString() || "0"} />
                  <SubRow label="Total Revenue" value={`₹ ${salesData.previousPeriod.totalRevenue?.toFixed(2) || 0}`} />
                  <SubRow label="Avg Order Value" value={`₹ ${salesData.previousPeriod.avgOrderValue?.toFixed(2) || 0}`} />
                </>
              )}

              <SectionRow
                title="Source Summary"
                open={open.source}
                onClick={() => toggle("source")}
              />
              {open.source && (
                <>
                  <SubRow label="POS" value="" />
                  <SubRow label="Total Revenue" value={`₹ ${salesData.currentPeriod.totalRevenue?.toFixed(2) || 0}`} />
                  <SubRow label="No. of Transactions" value={salesData.currentPeriod.totalOrders?.toString() || "0"} />
                  <SubRow label="Average Sale per Transaction" value={`₹ ${salesData.currentPeriod.avgOrderValue?.toFixed(2) || 0}`} />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= Reusable Components ================= */

function SectionRow({ title, amount, open, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="grid grid-cols-2 px-4 py-2 cursor-pointer
                 bg-[#FFF3CD] font-medium border-t border-gray-200"
    >
      <div className="flex items-start gap-2">
        <Chevron open={open} />
        <span className="break-words">{title}</span>
      </div>
      <div className="text-right">{amount ?? ""}</div>
    </div>
  );
}

function SubRow({ label, value }: any) {
  return (
    <div className="grid grid-cols-2 px-6 sm:px-8 py-1.5 border-t border-gray-100">
      <div className="break-words">{label}</div>
      <div className="text-right">{value}</div>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 mt-0.5 transition-transform ${
        open ? "rotate-90" : ""
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
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
      if (onSelect) onSelect(opt);
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