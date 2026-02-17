import { useState } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";

export default function SalesByBrand() {
  return (
    <div className="mx-3 md:mx-4 space-y-4">
      {/* ================= Header ================= */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Sales by Brand
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
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
      <div className="flex flex-col sm:flex-row sm:flex-wrap justify-end gap-2">
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
          label="Options"
          multi
          options={[
            "Brand",
            "Net Sales",
            "Number of Orders",
            "Average Per Customer",
          ]}
        />

        <button className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4 w-full sm:w-auto">
          Clear
        </button>
      </div>

      {/* ================= Table ================= */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Table Header */}
          <div className="grid grid-cols-4 bg-[#F7C948] text-black px-4 py-2 text-sm font-medium">
            <div>Brand</div>
            <div>Net Sales</div>
            <div>Number of Orders</div>
            <div>Average Per Customer</div>
          </div>

          {/* Table Rows */}
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className={`grid grid-cols-4 px-4 py-2 text-sm border-t ${
                i % 2 === 1 ? "bg-[#FFFBEA]" : ""
              }`}
            >
              <div>Solitary</div>
              <div>30</div>
              <div>1</div>
              <div>30</div>
            </div>
          ))}
        </div>

        {/* ================= Pagination ================= */}
        <div className="border-t px-4 py-3 flex justify-center sm:justify-end bg-white">
          <Pagination />
        </div>
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
        onClick={() => setOpen(!open)}
        className="bb-input w-full bg-bb-bg flex justify-between items-center"
      >
        <span className="text-sm truncate">
          {selected.length ? selected.join(", ") : label}
        </span>
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow max-h-60 overflow-auto">
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
