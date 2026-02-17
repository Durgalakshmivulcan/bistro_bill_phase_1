import { useState, useEffect } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import { getBranches, Branch } from "../../../services/branchService";

export default function ProductUnavailabilityTime() {
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

  return (
    <div className="mx-3 md:mx-4 space-y-4">
      {/* ================= Header ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Product Unavailability Time
        </h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
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

{/* 
          <button className="bb-btn-secondary border border-black bg-bb-bg rounded-md">
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
          label="Options"
          multi
          options={[
            "SKU Code",
            "Product Name",
            "UOM",
            "Category",
            "Branch Name",
            "Branch Code",
            "Business Date",
            "Unavailable Minutes",
            "Unavailable %",
            "Unavailable Slots",
            "Account Name",
            "Product Unavailable Sessions",
          ]}
        />

        <button className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4">
          Clear
        </button>
      </div>

      {/* ================= Table ================= */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <div className="min-w-[1650px]">
          {/* Table Header */}
          <div
            className="grid bg-[#F7C948] text-black px-4 py-2 text-xs font-medium"
            style={{
              gridTemplateColumns:
                "120px 180px 80px 120px 140px 100px 120px 140px 120px 160px 140px 200px",
            }}
          >
            <div>SKU Code</div>
            <div>Product Name</div>
            <div>UOM</div>
            <div>Category</div>
            <div>Branch Name</div>
            <div>Branch Code</div>
            <div>Business Date</div>
            <div>Unavailable Minutes</div>
            <div>Unavailable %</div>
            <div>Unavailable Slots</div>
            <div>Account Name</div>
            <div>Product Unavailable Sessions</div>
          </div>

          {/* Table Rows */}
          {[
            {
              sku: "BUR-CHS-001",
              name: "Cheeseburger with Fries",
              uom: "KG",
              category: "Snacks",
              branch: "Hitech city",
              code: "001",
              date: "09/02/2025",
              minutes: "20:00",
              percent: "20%",
              slots: "02:00-02:20",
            },
            {
              sku: "PIZ-PEP-002",
              name: "Pepperoni Pizza",
              uom: "KG",
              category: "Pizza",
              branch: "-",
              code: "008",
              date: "19/02/2025",
              minutes: "20:00",
              percent: "50%",
              slots: "02:00-02:20",
            },
          ].map((row, i) => (
            <div
              key={i}
              className={`grid px-4 py-2 text-xs border-t ${
                i % 2 === 1 ? "bg-[#FFFBEA]" : ""
              }`}
              style={{
                gridTemplateColumns:
                  "120px 180px 80px 120px 140px 100px 120px 140px 120px 160px 140px 200px",
              }}
            >
              <div>{row.sku}</div>
              <div>{row.name}</div>
              <div>{row.uom}</div>
              <div>{row.category}</div>
              <div>{row.branch}</div>
              <div>{row.code}</div>
              <div>{row.date}</div>
              <div>{row.minutes}</div>
              <div>{row.percent}</div>
              <div>{row.slots}</div>
              <div>-</div>
              <div>-</div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= Pagination ================= */}
      <div className="flex justify-center sm:justify-end">
        <Pagination />
      </div>
    </div>
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

  const toggleOption = (opt: string) => {
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

        {/* Reference Arrow */}
        <svg
          className={`w-4 h-4 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          stroke="currentColor"
          fill="none"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border rounded-md shadow max-h-64 overflow-auto">
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
