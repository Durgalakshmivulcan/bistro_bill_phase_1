import { useState, useEffect } from "react";
import ReportActions from "../../Common/ReportActions";
import { getBranches, Branch } from "../../../services/branchService";

export default function SalesSummaryBySession() {
  const [open, setOpen] = useState({
    gross: true,
    tax: true,
    account: true,
    transactions: true,
    fulfillment: true,
    category: true,
    channel: true,
  });

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

  const toggle = (k: keyof typeof open) =>
    setOpen((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="mx-3 md:mx-4 space-y-3">
      {/* ================= Header ================= */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-bb-text">
          Sales Summary by Session
        </h2>

        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2">
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
              <path d="M21 21l-4.35-4.35" />
              <circle cx="11" cy="11" r="7" />
            </svg>
          </div>

  <ReportActions />
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
            "All",
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

        <button className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4 w-full sm:w-auto">
          Clear
        </button>
      </div>

      {/* ================= Table ================= */}
      <div className="bg-white border rounded-lg overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid grid-cols-[3fr_1fr_1fr] bg-[#F7D25C] px-4 py-2 text-sm font-medium">
            <div>Description</div>
            <div className="text-right">Total</div>
            <div className="text-right">Undefined Session</div>
          </div>

          <div className="text-[13px] divide-y">
            {/* Gross */}
            <SectionRow
              title="Gross Sales (Net Sales - Direct Charges + Discounts + Returns)"
              total="₹ 30"
              session="₹ 30"
              open={open.gross}
              onClick={() => toggle("gross")}
            />
            {open.gross && (
              <>
                <SubRow label="Sales Return" />
                <SubRow label="Discounts" />
                <SubRow label="Packaging Charges (Direct Charges)" />
                <SubRow label="Net Sales" total="₹ 30" session="₹ 30" />
                <SubRow label="Taxes" total="₹ 1.5" session="₹ 1.5" />
                <SubRow label="Rounding" total="₹ 0.5" session="₹ 0.5" />
                <SubRow label="Total Gross Revenue" total="₹ 32" session="₹ 32" />
                <SubRow label="Payment Balance" />
              </>
            )}

            {/* Tax */}
            <SectionRow
              title="Tax Summary"
              total="₹ 1.5"
              session="₹ 1.5"
              open={open.tax}
              onClick={() => toggle("tax")}
            />
            {open.tax && (
              <>
                <SubRow label="CGST 2.5%" total="₹ 0.75" session="₹ 0.75" />
                <SubRow label="SGST 2.5%" total="₹ 0.75" session="₹ 0.75" />
              </>
            )}

            {/* Account */}
            <SectionRow
              title="Account Summary - Overall"
              open={open.account}
              onClick={() => toggle("account")}
            />
            {open.account && (
              <SubRow label="Packaging Charges (Direct Charges)" />
            )}

            {/* Transactions */}
            <SectionRow
              title="Transactions Summary"
              open={open.transactions}
              onClick={() => toggle("transactions")}
            />
            {open.transactions && (
              <>
                <SubRow label="No. of Transactions" total="1" session="1" />
                <SubRow
                  label="Average Sale per Transaction"
                  total="₹ 30"
                  session="₹ 30"
                />
              </>
            )}

            {/* Fulfillment */}
            <SectionRow
              title="Fulfillment Summary"
              open={open.fulfillment}
              onClick={() => toggle("fulfillment")}
            />

            {/* Category */}
            <SectionRow
              title="Category Summary"
              total="₹ 30"
              session="₹ 30"
              open={open.category}
              onClick={() => toggle("category")}
            />
            {open.category && (
              <SubRow label="Chinese" total="₹ 30" session="₹ 30" />
            )}

            {/* Channel */}
            <SectionRow
              title="Channel Summary"
              open={open.channel}
              onClick={() => toggle("channel")}
            />
            {open.channel && (
              <>
                <SubRow label="Delivery" />
                <SubRow label="Net Sales" total="₹ 30" session="₹ 30" />
                <SubRow label="No. of Transactions" total="1" session="1" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= Helpers ================= */

function SectionRow({ title, total, session, open, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="grid grid-cols-[3fr_1fr_1fr] px-4 py-1.5
                 bg-[#FFF3CD] text-[13px] font-medium cursor-pointer"
    >
      <div className="flex items-start gap-2 break-words">
        <Chevron open={open} />
        <span className="break-words">{title}</span>
      </div>
      <div className="text-right">{total || ""}</div>
      <div className="text-right">{session || ""}</div>
    </div>
  );
}

function SubRow({ label, total, session }: any) {
  return (
    <div className="grid grid-cols-[3fr_1fr_1fr] px-4 md:px-8 py-1 text-[#6B6B6B]">
      <div className="break-words">{label}</div>
      <div className="text-right">{total || ""}</div>
      <div className="text-right">{session || ""}</div>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 mt-1 transition-transform ${
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
}: {
  label: string;
  options: string[];
  multi?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOption = (option: string) => {
    if (!multi) {
      setSelected([option]);
      setOpen(false);
      return;
    }

    setSelected((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  return (
    <div className="relative w-full sm:w-44">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="bb-input w-full bg-bb-bg flex items-center justify-between gap-2"
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
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-64 overflow-auto">
          {options.map((opt) => {
            const active = selected.includes(opt);
            return (
              <div
                key={opt}
                onClick={() => toggleOption(opt)}
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-[#FFF3CD]"
              >
                {multi && (
                  <span
                    className={`w-4 h-4 border flex items-center justify-center text-xs
                      ${
                        active
                          ? "bg-black border-black text-white"
                          : "border-gray-400 bg-white"
                      }`}
                  >
                    {active && "✓"}
                  </span>
                )}
                <span>{opt}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}