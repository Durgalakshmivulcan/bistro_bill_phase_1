import { useState, useEffect } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import { getBranches, Branch } from "../../../services/branchService";

export default function PAndLStatement() {
  const [branchNames, setBranchNames] = useState<string[]>([]);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await getBranches({ status: "Active" });
        if (res.success && res.data) {
          setBranchNames(res.data.branches.map((b: Branch) => b.name));
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };
    loadBranches();
  }, []);

  const [open, setOpen] = useState<string[]>([
    "income",
    "offline",
    "swiggy",
    "zomato",
    "otherOnline",
    "expenses",
    "cogs",
    "commission",
    "profit",
  ]);

  const toggle = (key: string) => {
    setOpen((p) =>
      p.includes(key) ? p.filter((x) => x !== key) : [...p, key]
    );
  };

  return (
    <div className="mx-3 md:mx-4 space-y-4">
      {/* ================= Header ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          P&amp;L Statement
        </h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
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
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <ReportActions />

          {/* <button className="bb-btn-secondary border border-black bg-bb-bg rounded-md">
            Email Report
          </button>

          <button className="bb-btn bg-black text-white rounded-md">
            Download Full Report
          </button> */}
        </div>
      </div>

      {/* ================= Filters ================= */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-end gap-2">
        <Dropdown
          label="Filter by Date"
          options={["Today", "Yesterday", "Last 7 days", "Last 30 days", "Last 90 days"]}
        />
        <Dropdown
          label="Filter by Branch"
          multi
          options={branchNames}
        />
        <Dropdown
          label="Options"
          multi
          options={["Income", "Expenses", "Profit"]}
        />

        <button className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4">
          Clear
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_180px] bg-[#F7C948] px-4 py-2 text-sm font-medium text-black">
          <div>Description</div>
          <div className="text-right">Hitech City</div>
        </div>

        {/* ================= INCOME ================= */}
        <Section title="Income" id="income" open={open} toggle={toggle}>
          <Sub title="Offline Sales" id="offline" open={open} toggle={toggle}>
            <Row label="Gross Offline Sales" value="₹ 30" indent />
            <Row label="Discount on Offline Sales" value="₹ 0" indent />
            <Row label="Charges on Offline Sales" value="₹ 0" indent />
            <Row label="Net Offline Sales" value="₹ 30" indent total />
          </Sub>

          <Sub title="Swiggy Sales" id="swiggy" open={open} toggle={toggle}>
            <Row label="Gross Swiggy Sales" value="₹ 0" indent />
            <Row label="Discount on Swiggy Sales" value="₹ 0" indent />
            <Row label="Charges on Swiggy Sales" value="₹ 0" indent />
            <Row label="Net Swiggy Sales" value="₹ 0" indent total />
          </Sub>

          <Sub title="Zomato Sales" id="zomato" open={open} toggle={toggle}>
            <Row label="Gross Zomato Sales" value="₹ 0" indent />
            <Row label="Discount on Zomato Sales" value="₹ 0" indent />
            <Row label="Charges on Zomato Sales" value="₹ 0" indent />
            <Row label="Net Zomato Sales" value="₹ 0" indent total />
          </Sub>

          <Sub title="Other Online Sales" id="otherOnline" open={open} toggle={toggle}>
            <Row label="Gross Other Online Sales" value="₹ 0" indent />
            <Row label="Discount on Other Online Sales" value="₹ 0" indent />
            <Row label="Charges on Other Online Sales" value="₹ 0" indent />
            <Row label="Net Other Online Sales" value="₹ 0" indent total />
          </Sub>

          <Row label="Total Net Sales" value="₹ 30" total />
        </Section>

        {/* ================= EXPENSES ================= */}
        <Section title="Expenses" id="expenses" open={open} toggle={toggle}>
          <Sub title="Cost of Goods Sold" id="cogs" open={open} toggle={toggle}>
            <Row label="Cost of Material" value="₹ 0" indent />
            <Row label="Cost of Supplies" value="₹ 0" indent />
            <Row label="Total Cost of Goods Sold" value="₹ 0" indent total />
          </Sub>

          <Sub title="Commission" id="commission" open={open} toggle={toggle}>
            <Row label="Swiggy" value="₹ 0" indent />
            <Row label="Zomato" value="₹ 0" indent />
            <Row label="Total Commission" value="₹ 0" indent total />
          </Sub>

          <Row label="Total Petty Cash Expense" value="₹ 0" total />
          <Row label="Total Variable Expense" value="₹ 0" total />
        </Section>

        {/* ================= PROFIT ================= */}
        <Section title="Gross Profit / Loss" id="profit" open={open} toggle={toggle}>
          <Row label="Expenses on Utilities" value="₹ 0" />
          <Row label="Expenses on Supplies" value="₹ 0" />
          <Row label="Expenses on Marketing" value="₹ 0" />
          <Row label="Expenses on Repairs & Maintenance" value="₹ 0" />
          <Row label="Expenses on Miscellaneous" value="₹ 0" />
          <Row label="Expenses on Employee Cost" value="₹ 0" />
          <Row label="Expenses on Administrative Expenses" value="₹ 0" />
          <Row label="Other Expenses" value="₹ 0" />
          <Row label="Net Profit Loss" value="₹ 0" total />
          <Row label="Net Profit Margin" value="0%" total />
        </Section>
      </div>

      <div className="flex justify-center sm:justify-end">
        <Pagination />
      </div>
    </div>
  );
}

/* ================= FIXED CHEVRON (CORRECT DIRECTION) ================= */

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${
        !open ? "rotate-180" : ""
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

/* ================= SECTION ================= */

function Section({ title, id, open, toggle, children }: any) {
  const isOpen = open.includes(id);
  return (
    <>
      <div
        onClick={() => toggle(id)}
        className="grid grid-cols-[1fr_180px] px-4 py-2 text-sm font-medium bg-[#FFFBEA] border-t cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Chevron open={isOpen} />
          {title}
        </div>
      </div>
      {isOpen && children}
    </>
  );
}

/* ================= SUB SECTION ================= */

function Sub({ title, id, open, toggle, children }: any) {
  const isOpen = open.includes(id);
  return (
    <>
      <div
        onClick={() => toggle(id)}
        className="grid grid-cols-[1fr_180px] px-4 py-2 text-sm bg-[#F3F4F6] border-t cursor-pointer"
      >
        <div className="flex items-center gap-2 pl-4">
          <Chevron open={isOpen} />
          {title}
        </div>
      </div>
      {isOpen && children}
    </>
  );
}

/* ================= ROW ================= */

function Row({ label, value, indent, total }: any) {
  return (
    <div
      className={`grid grid-cols-[1fr_180px] px-4 py-2 text-sm border-t ${
        total ? "bg-[#FFFBEA] font-medium" : "bg-white"
      }`}
    >
      <div className={indent ? "pl-8" : ""}>{label}</div>
      <div className="text-right">{value}</div>
    </div>
  );
}

/* ================= DROPDOWN ================= */

function Dropdown({ label, options, multi = false }: any) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOpt = (opt: string) => {
    if (!multi) {
      setSelected([opt]);
      setOpen(false);
    } else {
      setSelected((p) =>
        p.includes(opt) ? p.filter((x) => x !== opt) : [...p, opt]
      );
    }
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
        <Chevron open={open} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border rounded-md shadow max-h-64 overflow-auto">
          {options.map((opt: string) => {
            const active = selected.includes(opt);
            return (
              <div
                key={opt}
                onClick={() => toggleOpt(opt)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${
                  active ? "bg-[#FFF3CD]" : "hover:bg-[#FFFBEA]"
                }`}
              >
                {multi && (
                  <span
                    className={`w-4 h-4 border flex items-center justify-center text-xs ${
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
