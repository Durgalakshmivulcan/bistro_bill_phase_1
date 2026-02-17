import { useState, useEffect } from "react";
import ReportActions from "../../Common/ReportActions";
import { getBranches, Branch } from "../../../services/branchService";

export default function SalesSummaryByBranchLabel() {
  const [open, setOpen] = useState({
    gross: true,
    payment: true,
    tax: true,
    transactions: true,
    category: true,
    channel: true,
    source: true,
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
        <h2 className="text-lg md:text-2xl font-semibold text-bb-text">
          Sales Summary by Branch Label
        </h2>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
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

        <button className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4">
          Clear
        </button>
      </div>

      {/* ================= Table ================= */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <div className="min-w-[520px]">
          {/* Table Header */}
          <div className="grid grid-cols-2 bg-bb-primary text-bb-secondary px-4 py-2 text-sm font-medium">
            <div>Description</div>
            <div className="text-right">Amount</div>
          </div>

          <div className="divide-y divide-gray-200 text-sm">
            {/* Branch Label Row */}
            <div className="grid grid-cols-2 px-4 py-2 font-medium bg-[#FFF3CD] border-b">
              <div>Branch Label</div>
              <div className="text-right">Outlet</div>
            </div>

            <SectionRow
              title="Gross Sales (Net Sales - Direct Charges + Discounts + Returns)"
              amount="₹ 30"
              open={open.gross}
              onClick={() => toggle("gross")}
            />
            {open.gross && (
              <>
                <SubRow label="Sales Return" value="₹ 0" />
                <SubRow label="Discounts" value="₹ 0" />
                <SubRow label="Packaging Charges (Direct Charges)" value="₹ 0" />
                <SubRow label="Net Sales" value="₹ 30" />
                <SubRow label="Service Charges (Indirect Charges)" value="₹ 0" />
                <SubRow label="Taxes" value="₹ 1.5" />
                <SubRow label="Rounding" value="₹ 0.5" />
                <SubRow label="Tip" value="₹ 0" />
                <SubRow label="Total Gross Revenue" value="₹ 32" />
                <SubRow label="Payment Balance" value="₹ 0" />
              </>
            )}

            <SectionRow
              title="Payment Summary"
              amount="₹ 32"
              open={open.payment}
              onClick={() => toggle("payment")}
            />
            {open.payment && (
              <>
                <SubRow label="Cash" value="₹ 32" />
                <SubRow label="Charge Total" value="₹ 0" />
              </>
            )}

            <SectionRow
              title="Tax Summary"
              amount="₹ 1.5"
              open={open.tax}
              onClick={() => toggle("tax")}
            />
            {open.tax && (
              <>
                <SubRow label="CGST 2.5%" value="₹ 0.75" />
                <SubRow label="CGST 2.5% Taxable Amount" value="₹ 30" />
                <SubRow label="SGST 2.5%" value="₹ 0.75" />
                <SubRow label="SGST 2.5% Taxable Amount" value="₹ 30" />
              </>
            )}

            <SectionRow
              title="Transactions Summary"
              open={open.transactions}
              onClick={() => toggle("transactions")}
            />
            {open.transactions && (
              <>
                <SubRow label="No. of Transactions" value="1" />
                <SubRow label="Average Sale per Transaction" value="₹ 30" />
                <SubRow label="No. of People (PAX)" value="" />
                <SubRow label="Average Sale per Person" value="₹ 0" />
                <SubRow label="Resource Capacity" value="" />
                <SubRow label="Capacity Utilization Ratio" value="" />
              </>
            )}

            <SectionRow
              title="Category Summary"
              amount="₹ 30"
              open={open.category}
              onClick={() => toggle("category")}
            />
            {open.category && <SubRow label="Chinese" value="₹ 30" />}

            <SectionRow
              title="Channel Summary"
              open={open.channel}
              onClick={() => toggle("channel")}
            />
            {open.channel && (
              <>
                <SubRow label="Delivery" value="" />
                <SubRow label="Net Sales" value="₹ 30" />
                <SubRow label="No. of Transactions" value="1" />
                <SubRow label="Average Sale per Transaction" value="₹ 30" />
                <SubRow label="Packaging Charges (Direct Charges)" value="" />
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
                <SubRow label="Net Sales" value="₹ 30" />
                <SubRow label="No. of Transactions" value="1" />
                <SubRow label="Average Sale per Transaction" value="₹ 30" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= Reusable Components ================= */

function SectionRow({ title, amount, open, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="grid grid-cols-2 px-4 py-2 cursor-pointer bg-[#FFF3CD]
                 text-bb-textSoft font-medium border-t"
    >
      <div className="flex items-start gap-2 break-words">
        <Chevron open={open} />
        <span className="break-words">{title}</span>
      </div>
      <div className="text-right">{amount ?? ""}</div>
    </div>
  );
}

function SubRow({ label, value }: any) {
  return (
    <div className="grid grid-cols-2 px-4 sm:px-8 py-1.5 text-bb-textSoft border-t">
      <div className="break-words">{label}</div>
      <div className="text-right">{value}</div>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 mt-1 transition-transform ${
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

  const toggleOption = (opt: string) => {
    if (!multi) {
      setSelected([opt]);
      setOpen(false);
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