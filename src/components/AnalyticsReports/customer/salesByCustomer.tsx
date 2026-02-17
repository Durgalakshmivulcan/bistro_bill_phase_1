import { useState, useEffect } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import { getBranches, Branch } from "../../../services/branchService";

/* ✅ SINGLE SOURCE OF TRUTH FOR TABLE GRID */
const TABLE_GRID =
  "grid grid-cols-[40px_110px_120px_120px_160px_240px_160px_110px_140px_140px_120px_110px_120px_110px_110px_100px_120px]";

/* ================= ICON ================= */
function ChevronDownIcon({ open }: { open?: boolean }) {
  return (
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
  );
}

export default function SalesByCustomer() {
  const [showCalendar, setShowCalendar] = useState(false);
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

  return (
    <div className="mx-3 md:mx-4 space-y-4">

      {/* ================= Header ================= */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Sales by Customer
        </h2>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <input
              placeholder="Search here..."
              className="bb-input w-full pr-10 bg-bb-bg"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              viewBox="0 0 24 24"
            >
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
            <ReportActions reportType="customers" />

          {/* <button className="bb-btn-secondary bg-bb-bg border border-black rounded-md">
            Email Report
          </button>

          <button className="bb-btn bg-black text-white rounded-md">
            Download Full Report
          </button> */}
        </div>
      </div>

      {/* ================= Filters ================= */}
      <div className="flex flex-wrap justify-end gap-2 relative">
        <DateDropdown onCustom={() => setShowCalendar(!showCalendar)} />

        <CheckboxDropdown
          label="Filter by Branch"
          options={branchNames}
        />

        <CheckboxDropdown
          label="Options"
          options={[
            "Customer Id",
            "First Name",
            "Last Name",
            "Customer Group",
            "Email Address",
            "Phone Number",
            "No. of Sales",
            "Last Sale Date",
            "Last Branch",
            "Gross Amount",
            "Discounts",
            "Net Amount",
            "Charges",
            "Taxes",
            "Tips",
            "Loyalty Earned",
            "Loyalty Redeemed",
          ]}
        />

        <button className="bb-btn bg-[#F7C948] text-black border border-black px-4 rounded-md">
          Clear
        </button>

        {showCalendar && <CalendarPopup />}
      </div>

      {/* ================= Table ================= */}
      <div className="bg-white border rounded-lg overflow-x-auto">
        <div className="min-w-[2100px]">

          {/* ===== Header ===== */}
          <div
            className={`${TABLE_GRID} bg-[#F7C948] px-4 py-2 text-sm font-medium`}
          >
            <input type="checkbox" className="w-3.5 h-3.5" />
            <div>Customer Id</div>
            <div>First Name</div>
            <div>Last Name</div>
            <div>Customer Group</div>
            <div>Email Address</div>
            <div>Phone Number</div>
            <div>No. of Sales</div>
            <div>Last Sale Date</div>
            <div>Last Branch</div>
            <div>Gross Amount</div>
            <div>Discounts</div>
            <div>Net Amount</div>
            <div>Charges</div>
            <div>Taxes</div>
            <div className="text-center">Loyalty Earned</div>
            <div className="text-center">Loyalty Redeemed</div>
          </div>

          {/* ===== Rows ===== */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`${TABLE_GRID} px-4 py-2 text-sm border-t ${
                i % 2 ? "bg-[#FFFBEA]" : ""
              }`}
            >
              <input type="checkbox" className="w-3.5 h-3.5" />
              <div>43215</div>
              <div>Lauren</div>
              <div>Thompson</div>

              <span
                className={`px-2 py-0.5 rounded text-xs w-fit ${
                  i % 2 === 0
                    ? "bg-purple-100 text-purple-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {i % 2 === 0 ? "VIP" : "Corporate Clients"}
              </span>

              <div className="truncate">thompson12@gmail.com</div>
              <div>+91 9784561230</div>
              <div>28</div>
              <div>09/02/2025</div>
              <div>Hitech City</div>
              <div>₹ 707</div>
              <div>₹ 12</div>
              <div>₹ 160</div>
              <div>₹ 36</div>
              <div>₹ 36</div>
              <div className="text-center">47</div>
              <div className="text-center">1</div>
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

/* ================= Dropdowns ================= */

function CheckboxDropdown({ label, options }: any) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full sm:w-44">
      <button
        onClick={() => setOpen(!open)}
        className="bb-input w-full bg-bb-bg flex justify-between items-center"
      >
        <span className="text-sm truncate">{label}</span>
        <ChevronDownIcon open={open} />
      </button>

      {open && (
        <div className="absolute z-30 w-full bg-white border rounded-md shadow mt-1 max-h-60 overflow-auto">
          {options.map((o: string) => (
            <div
              key={o}
              className="flex gap-2 px-3 py-2 text-sm hover:bg-[#FFFBEA]"
            >
              <input type="checkbox" className="w-3.5 h-3.5" />
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DateDropdown({ onCustom }: any) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full sm:w-44">
      <button
        onClick={() => setOpen(!open)}
        className="bb-input w-full bg-bb-bg flex justify-between items-center"
      >
        <span className="text-sm">Filter by Date</span>
        <ChevronDownIcon open={open} />
      </button>

      {open && (
        <div className="absolute z-30 w-full bg-white border rounded-md shadow mt-1">
          {["Today", "Yesterday", "Last 7 days", "Last 30 days", "Last 90 days"].map(
            (d) => (
              <div key={d} className="px-3 py-2 text-sm hover:bg-[#FFFBEA]">
                {d}
              </div>
            )
          )}
          <div
            onClick={onCustom}
            className="px-3 py-2 text-sm bg-[#FFF3CD] cursor-pointer font-medium"
          >
            + Custom Date
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarPopup() {
  return (
    <div className="absolute right-0 top-14 bg-white border shadow-lg rounded-lg p-4 z-40">
      <div className="text-sm font-medium mb-2">April 2025 – May 2025</div>
      <div className="grid grid-cols-7 gap-2 text-xs">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className={`w-7 h-7 flex items-center justify-center rounded ${
              i % 6 === 0 ? "bg-[#F7C948]" : "hover:bg-[#FFFBEA]"
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}