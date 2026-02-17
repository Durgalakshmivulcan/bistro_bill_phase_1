import { useState, useEffect } from "react";
import ReportActions from "../../Common/ReportActions";
import { getBranches, Branch } from "../../../services/branchService";

export default function SalesSummaryByHour() {
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

  const toggle = (key: keyof typeof open) =>
    setOpen((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="mx-3 md:mx-4 space-y-3">
      {/* ================= Header ================= */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Sales Summary by Hour
        </h2>

        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2">
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
          ]}
        />

        <Dropdown
          label="Filter by Branch"
          multi
          options={branchNames}
        />

        <Dropdown
          label="Filter by Time"
          multi
          options={["10:00", "11:00", "12:00", "14:00"]}
        />

        <Dropdown
          label="Options"
          multi
          options={[
            "Gross Amount",
            "Net Amount",
            "Taxes",
            "Transactions",
          ]}
        />

        <button className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4 w-full sm:w-auto">
          Clear
        </button>
      </div>

      {/* ================= Table ================= */}
      <div className="bg-white rounded-lg border overflow-x-auto">
        <div className="min-w-[680px]">
          {/* Header */}
          <div className="grid grid-cols-[2.8fr_1fr_1fr] bg-[#F7C948] px-4 py-2 text-sm font-medium">
            <div>Description</div>
            <div className="text-right">Total</div>
            <div className="text-right">14:00</div>
          </div>

          <div className="divide-y text-sm">
            {/* Gross Sales */}
            <SectionRow
              title="Gross Sales (Net Sales - Direct Charges + Discounts + Returns)"
              total="₹ 30"
              hour="₹ 30"
              open={open.gross}
              onClick={() => toggle("gross")}
            />
            {open.gross && (
              <>
                <SubRow label="Sales Return" total="₹ 0" hour="₹ 0" />
                <SubRow label="Discounts" total="₹ 0" hour="₹ 0" />
                <SubRow label="Packaging Charges (Direct Charges)" total="₹ 0" hour="₹ 0" />
                <SubRow label="Net Sales" total="₹ 30" hour="₹ 30" />
                <SubRow label="Service Charges (Indirect Charges)" total="₹ 0" hour="₹ 0" />
                <SubRow label="Taxes" total="₹ 1.5" hour="₹ 1.5" />
                <SubRow label="Rounding" total="₹ 0.5" hour="₹ 0.5" />
                <SubRow label="Tip" total="₹ 0" hour="₹ 0" />
                <SubRow label="Total Gross Revenue" total="₹ 32" hour="₹ 32" />
                <SubRow label="Payment Balance" total="₹ 0" hour="₹ 0" />
              </>
            )}

            {/* Tax Summary */}
            <SectionRow
              title="Tax Summary"
              total="₹ 1.5"
              hour="₹ 1.5"
              open={open.tax}
              onClick={() => toggle("tax")}
            />
            {open.tax && (
              <>
                <SubRow label="CGST 2.5%" total="₹ 0.75" hour="₹ 0.75" />
                <SubRow label="CGST 2.5% Taxable Amount" total="₹ 30" hour="₹ 30" />
                <SubRow label="SGST 2.5%" total="₹ 0.75" hour="₹ 0.75" />
                <SubRow label="SGST 2.5% Taxable Amount" total="₹ 30" hour="₹ 30" />
              </>
            )}

            {/* Account Summary */}
            <SectionRow
              title="Account Summary - Overall"
              total="₹ 0"
              hour="₹ 0"
              open={open.account}
              onClick={() => toggle("account")}
            />
            {open.account && (
              <SubRow label="Packaging Charges (Direct Charges)" total="₹ 0" hour="₹ 0" />
            )}

            {/* Transactions */}
            <SectionRow
              title="Transactions Summary"
              open={open.transactions}
              onClick={() => toggle("transactions")}
            />
            {open.transactions && (
              <>
                <SubRow label="No. of Transactions" total="1" hour="1" />
                <SubRow label="Average Sale per Transaction" total="₹ 30" hour="₹ 30" />
                <SubRow label="No. of People (PAX)" total="" hour="" />
                <SubRow label="Average Sale per Person" total="₹ 0" hour="₹ 0" />
                <SubRow label="Resource Capacity" total="" hour="" />
                <SubRow label="Capacity Utilization Ratio" total="" hour="" />
              </>
            )}

            {/* Fulfillment */}
            <SectionRow
              title="Fulfillment Summary"
              open={open.fulfillment}
              onClick={() => toggle("fulfillment")}
            />
            {open.fulfillment && (
              <>
                <SubRow label="Acceptance Rate (%)" total="" hour="" />
                <SubRow label="Processed Rate (%)" total="" hour="" />
                <SubRow label="Time to Accept (Mins)" total="" hour="" />
                <SubRow label="Time to Prepare (Mins)" total="" hour="" />
                <SubRow label="Time to Process (Mins)" total="" hour="" />
                <SubRow label="Time to Dispatch (Mins)" total="" hour="" />
                <SubRow label="Time to Deliver (Mins)" total="" hour="" />
              </>
            )}

            {/* Category */}
            <SectionRow
              title="Category Summary"
              total="₹ 30"
              hour="₹ 30"
              open={open.category}
              onClick={() => toggle("category")}
            />
            {open.category && (
              <SubRow label="Chinese" total="₹ 30" hour="₹ 30" />
            )}

            {/* Channel */}
            <SectionRow
              title="Channel Summary"
              open={open.channel}
              onClick={() => toggle("channel")}
            />
            {open.channel && (
              <>
                <SubRow label="Delivery" total="" hour="" />
                <SubRow label="Net Sales" total="₹ 30" hour="₹ 30" />
                <SubRow label="No. of Transactions" total="1" hour="1" />
                <SubRow label="Average Sale per Transaction" total="₹ 30" hour="₹ 30" />
                <SubRow label="Packaging Charges (Direct Charges)" total="" hour="" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= Components ================= */

function SectionRow({ title, total, hour, open, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="grid grid-cols-[2.8fr_1fr_1fr] px-4 py-2 cursor-pointer
                 bg-[#FFF8E6] text-[13px] font-medium"
    >
      <div className="flex items-start gap-2 break-words">
        <Chevron open={open} />
        <span className="break-words">{title}</span>
      </div>
      <div className="text-right">{total ?? ""}</div>
      <div className="text-right">{hour ?? ""}</div>
    </div>
  );
}

function SubRow({ label, total, hour }: any) {
  return (
    <div className="grid grid-cols-[2.8fr_1fr_1fr] px-4 md:px-10 py-1.5 text-xs text-gray-600">
      <div className="break-words">{label}</div>
      <div className="text-right">{total ?? ""}</div>
      <div className="text-right">{hour ?? ""}</div>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 mt-1 transition-transform ${
        open ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* ================= Dropdown ================= */

function Dropdown({ label, options, multi = false }: any) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOption = (opt: string) => {
    if (!multi) {
      setSelected([opt]);
      setOpen(false);
      return;
    }
    setSelected((p) =>
      p.includes(opt) ? p.filter((o) => o !== opt) : [...p, opt]
    );
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
        <div className="absolute z-30 w-full bg-white border rounded-md shadow max-h-64 overflow-auto">
          {options.map((opt: string) => {
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
                          : "border-gray-400"
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