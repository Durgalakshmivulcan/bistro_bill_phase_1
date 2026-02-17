import { useState, useEffect } from "react";
import ReportActions from "../../Common/ReportActions";
import { getBranches, Branch } from "../../../services/branchService";

export default function SalesSummaryByDayOfTheWeek() {
  const [open, setOpen] = useState({
    gross: true,
    tax: true,
    transactions: true,
    fulfillment: true,
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

  const toggle = (k: keyof typeof open) =>
    setOpen((p) => ({ ...p, [k]: !p[k] }));

  const GRID =
    "grid grid-cols-[260px_90px_repeat(7,70px)] md:grid-cols-[380px_100px_repeat(7,80px)] items-center";

  return (
    <div className="mx-3 md:mx-4 space-y-3">
      {/* ================= Header ================= */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Sales Summary by Day of Week
        </h2>

        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2">
          <div className="relative w-full sm:w-56">
            <input
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
          options={["Today", "Yesterday", "Last 7 days", "Last 30 days"]}
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
            "Gross Amount",
            "Net Amount",
            "Taxes",
            "No. of Transactions",
          ]}
        />

        <button className="bb-btn bg-[#F7C948] border border-black px-4 rounded-md w-full sm:w-auto">
          Clear
        </button>
      </div>

      {/* ================= Table ================= */}
      <div className="bg-white border rounded-lg overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header */}
          <div className={`${GRID} bg-[#F7C948] px-4 py-2 text-sm font-medium`}>
            <div>Description</div>
            <div className="text-right">Amount</div>
            <div className="text-right">Mon</div>
            <div className="text-right">Tue</div>
            <div className="text-right">Wed</div>
            <div className="text-right">Thu</div>
            <div className="text-right">Fri</div>
            <div className="text-right">Sat</div>
            <div className="text-right">Sun</div>
          </div>

          {/* ================= Gross ================= */}
          <SectionRow
            grid={GRID}
            title="Gross Sales (Net Sales - Direct Charges + Discounts + Returns)"
            amount="₹ 30"
            days={["", "", "₹ 30", "", "", "", ""]}
            open={open.gross}
            onClick={() => toggle("gross")}
          />

          {open.gross && (
            <>
              <SubRow grid={GRID} label="Sales Return" />
              <SubRow grid={GRID} label="Discounts" />
              <SubRow grid={GRID} label="Packaging Charges (Direct Charges)" />
              <SubRow grid={GRID} label="Net Sales" amount="₹ 30" wed="₹ 30" />
              <SubRow grid={GRID} label="Service Charges (Indirect Charges)" />
              <SubRow grid={GRID} label="Taxes" amount="₹ 1.5" wed="₹ 1.5" />
              <SubRow grid={GRID} label="Rounding" amount="₹ 0.5" wed="₹ 0.5" />
              <SubRow grid={GRID} label="Tip" />
              <SubRow
                grid={GRID}
                label="Total Gross Revenue"
                amount="₹ 32"
                wed="₹ 32"
              />
              <SubRow grid={GRID} label="Payment Balance" />
              <SubRow grid={GRID} label="Charge Total" />
            </>
          )}

          {/* ================= Tax ================= */}
          <SectionRow
            grid={GRID}
            title="Tax Summary"
            amount="₹ 1.5"
            days={["", "", "₹ 1.5", "", "", "", ""]}
            open={open.tax}
            onClick={() => toggle("tax")}
          />

          {open.tax && (
            <>
              <SubRow grid={GRID} label="CGST 2.5%" amount="₹ 0.75" wed="₹ 0.75" />
              <SubRow
                grid={GRID}
                label="CGST 2.5% Taxable Amount"
                amount="₹ 30"
                wed="₹ 30"
              />
              <SubRow grid={GRID} label="SGST 2.5%" amount="₹ 0.75" wed="₹ 0.75" />
              <SubRow
                grid={GRID}
                label="SGST 2.5% Taxable Amount"
                amount="₹ 30"
                wed="₹ 30"
              />
            </>
          )}

          {/* ================= Transactions ================= */}
          <SectionRow
            grid={GRID}
            title="Transactions Summary"
            open={open.transactions}
            onClick={() => toggle("transactions")}
          />

          {open.transactions && (
            <>
              <SubRow grid={GRID} label="No. of Transactions" amount="1" wed="1" />
              <SubRow
                grid={GRID}
                label="Average Sale per Transaction"
                amount="₹ 30"
                wed="₹ 30"
              />
              <SubRow grid={GRID} label="No. of People (PAX)" />
              <SubRow grid={GRID} label="Average Sale per Person" />
              <SubRow grid={GRID} label="Resource Capacity" />
              <SubRow grid={GRID} label="Capacity Utilization Ratio" />
            </>
          )}

          {/* ================= Fulfillment ================= */}
          <SectionRow
            grid={GRID}
            title="Fulfillment Summary"
            open={open.fulfillment}
            onClick={() => toggle("fulfillment")}
          />

          {open.fulfillment && (
            <>
              <SubRow grid={GRID} label="Acceptance Rate (%)" />
              <SubRow grid={GRID} label="Processed Rate (%)" />
              <SubRow grid={GRID} label="Time to Accept (Mins)" />
              <SubRow grid={GRID} label="Time to Prepare (Mins)" />
              <SubRow grid={GRID} label="Time to Process (Mins)" />
              <SubRow grid={GRID} label="Time to Dispatch (Mins)" />
              <SubRow grid={GRID} label="Time to Deliver (Mins)" />
            </>
          )}

          {/* ================= Category ================= */}
          <SectionRow
            grid={GRID}
            title="Category Summary"
            amount="₹ 30"
            days={["", "", "₹ 30", "", "", "", ""]}
            open={open.category}
            onClick={() => toggle("category")}
          />
          {open.category && (
            <SubRow grid={GRID} label="Chinese" amount="₹ 30" wed="₹ 30" />
          )}

          {/* ================= Channel ================= */}
          <SectionRow
            grid={GRID}
            title="Channel Summary"
            open={open.channel}
            onClick={() => toggle("channel")}
          />
          {open.channel && (
            <>
              <SubRow grid={GRID} label="Delivery" />
              <SubRow grid={GRID} label="Net Sales" amount="₹ 30" wed="₹ 30" />
              <SubRow grid={GRID} label="No. of Transactions" amount="1" wed="1" />
              <SubRow
                grid={GRID}
                label="Average Sale per Transaction"
                amount="₹ 30"
                wed="₹ 30"
              />
              <SubRow grid={GRID} label="Packaging Charges (Direct Charges)" />
            </>
          )}

          {/* ================= Source ================= */}
          <SectionRow
            grid={GRID}
            title="Source Summary"
            open={open.source}
            onClick={() => toggle("source")}
          />
          {open.source && (
            <>
              <SubRow grid={GRID} label="POS" />
              <SubRow grid={GRID} label="Net Sales" amount="₹ 30" wed="₹ 30" />
              <SubRow grid={GRID} label="No. of Transactions" amount="1" wed="1" />
              <SubRow
                grid={GRID}
                label="Average Sale per Transaction"
                amount="₹ 30"
                wed="₹ 30"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= Components ================= */

function SectionRow({ grid, title, amount, days = [], open, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`${grid} bg-[#FFF7E6] px-4 py-2 text-[13px] font-medium cursor-pointer border-t`}
    >
      <div className="flex gap-2 items-start break-words">
        <Chevron open={open} />
        <span className="break-words">{title}</span>
      </div>
      <div className="text-right">{amount}</div>
      {days.map((d: string, i: number) => (
        <div key={i} className="text-right">
          {d}
        </div>
      ))}
    </div>
  );
}

function SubRow({ grid, label, amount = "", wed = "" }: any) {
  return (
    <div className={`${grid} px-4 md:px-8 py-1.5 border-t text-sm`}>
      <div className="break-words">{label}</div>
      <div className="text-right">{amount}</div>
      <div />
      <div />
      <div className="text-right">{wed}</div>
      <div />
      <div />
      <div />
      <div />
    </div>
  );
}

/* 🔽 UPDATED SECTION ARROW */
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

  const toggle = (o: string) => {
    if (!multi) {
      setSelected([o]);
      setOpen(false);
    } else {
      setSelected((p) =>
        p.includes(o) ? p.filter((x) => x !== o) : [...p, o]
      );
    }
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
        <div className="absolute z-20 w-full bg-white border rounded-md shadow">
          {options.map((o: string) => (
            <div
              key={o}
              onClick={() => toggle(o)}
              className="flex gap-2 px-3 py-2 hover:bg-[#FFF3CD] cursor-pointer"
            >
              {multi && (
                <span
                  className={`w-4 h-4 border flex items-center justify-center ${
                    selected.includes(o)
                      ? "bg-black text-white border-black"
                      : ""
                  }`}
                >
                  {selected.includes(o) && "✓"}
                </span>
              )}
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}