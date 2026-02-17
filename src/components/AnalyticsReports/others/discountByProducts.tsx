import { useState, useEffect } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import { getBranches, Branch } from "../../../services/branchService";

/* ✅ SINGLE SOURCE OF TRUTH FOR TABLE LAYOUT */
const TABLE_GRID =
  "grid grid-cols-[100px_200px_150px_140px_220px_110px_90px_110px_110px_110px_110px_110px_110px_120px_130px_90px_110px]";

export default function DiscountByProducts() {
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Discount by Products
        </h2>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search (MATCHES REFERENCE) */}
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
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>

          <ReportActions />
          {/* Email Report (FIXED BG) */}
          {/* <button className="bb-btn-secondary bg-bb-bg border border-black rounded-md">
            Email Report
          </button>

          <button className="bb-btn bg-black text-white rounded-md">
            Download Full Report
          </button> */}
        </div>
      </div>

      {/* ================= Filters ================= */}
      <div className="flex flex-wrap justify-end gap-2">
        <Dropdown
          label="Filter by Date"
          options={["Today", "Yesterday", "Last 7 days"]}
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
            "Discount Code",
            "Product Name",
            "Product SKU",
            "Discount %",
            "Category",
            "Variants",
            "Loyalty Redeemed",
          ]}
        />

        <button className="bb-btn bg-[#F7C948] text-black border border-black px-4 rounded-md">
          Clear
        </button>
      </div>

      {/* ================= Table ================= */}
      <div className="bg-white border rounded-lg overflow-x-auto">
        <div className="min-w-[2150px]">
          {/* Header */}
          <div
            className={`${TABLE_GRID} bg-[#F7C948] px-4 py-2 text-sm font-medium`}
          >
            <div>Discount Code</div>
            <div>Product Name</div>
            <div>Product SKU</div>
            <div>Business Brand</div>
            <div>Product Quantity for Discount</div>
            <div>Discounts</div>
            <div>Discount %</div>
            <div>Source</div>
            <div>Discount on</div>
            <div>Channel</div>
            <div>Category</div>
            <div>Sub-Category</div>
            <div className="text-center">Product Brand</div>
            <div className="text-center">Account Name</div>
            <div className="text-center">Product Group Name</div>
            <div className="text-center">Variants</div>
            <div className="text-center">Loyalty Redeemed</div>
          </div>

          {/* Rows */}
          {[
            {
              code: "2106",
              name: "Cheeseburger with Fries",
              sku: "BUR-CHS-001",
              qty: 1,
              discount: "₹ 589",
              percent: "30%",
              channel: "Online",
              category: "Snacks",
              loyalty: 20,
            },
            {
              code: "4562",
              name: "Pepperoni Pizza",
              sku: "PIZ-PEP-002",
              qty: 2,
              discount: "₹ 7,885",
              percent: "30%",
              channel: "Dine In",
              category: "Pizzas",
              loyalty: 5,
            },
          ].map((row, i) => (
            <div
              key={i}
              className={`${TABLE_GRID} px-4 py-2 text-sm border-t ${
                i % 2 ? "bg-[#FFFBEA]" : ""
              }`}
            >
              <div>{row.code}</div>
              <div className="truncate">{row.name}</div>
              <div>{row.sku}</div>
              <div>Brand</div>
              <div>{row.qty}</div>
              <div>{row.discount}</div>
              <div>{row.percent}</div>
              <div>Online</div>
              <div>-</div>
              <div>{row.channel}</div>
              <div>{row.category}</div>
              <div>-</div>
              <div className="text-center">Brand</div>
              <div className="text-center">-</div>
              <div className="text-center">Combo</div>
              <div className="text-center">Small</div>
              <div className="text-center font-medium">{row.loyalty}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center sm:justify-end">
        <Pagination />
      </div>
    </div>
  );
}

/* ================= Dropdown (MATCHES REFERENCE) ================= */

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

        {/* ✅ SAME ARROW AS REFERENCE */}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
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
