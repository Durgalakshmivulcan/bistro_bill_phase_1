import { useState, useEffect } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import { getBranches, Branch } from "../../../services/branchService";

export default function TableReservations() {
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
          Table Reservations
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
            "Branch Name",
            "Branch Code",
            "Branch Label",
            "Reservation Start",
            "Reservation End",
            "Customer Name",
            "Phone Number",
            "PAX",
            "Table No.",
            "Resource Group",
            "Status",
            "Status Updated at",
            "Status Updated by",
            "Source",
            "Notes",
            "Reference",
            "Created Date",
            "Created by",
          ]}
        />


        <button className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4">
          Clear
        </button>
      </div>

      {/* ================= Table ================= */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <div className="min-w-[2270px]">
          {/* Header */}
          <div
            className="grid bg-[#F7C948] text-black px-4 py-2 text-xs font-medium"
            style={{
              gridTemplateColumns:
                "140px 100px 120px 140px 140px 160px 160px 80px 100px 140px 120px 140px 140px 100px 100px 120px 120px 120px",
            }}
          >
            <div>Branch Name</div>
            <div>Branch Code</div>
            <div>Branch Label</div>
            <div>Reservation Start</div>
            <div>Reservation End</div>
            <div>Customer Name</div>
            <div>Phone Number</div>
            <div>PAX</div>
            <div>Table No.</div>
            <div>Resource Group</div>
            <div>Status</div>
            <div>Status Updated at</div>
            <div>Status Updated by</div>
            <div>Source</div>
            <div>Notes</div>
            <div>Reference</div>
            <div>Created Date</div>
            <div>Created by</div>
          </div>

          {/* Rows */}
          {[
            {
              branch: "Hitech city",
              code: "001",
              label: "-",
              start: "09/02/2025",
              end: "09/02/2025",
              customer: "Arun Varma",
              phone: "+91 9658741230",
              pax: "PAX",
              table: "T-01",
              group: "Resource Group",
              status: "Order Running",
              updatedAt: "04:56",
              updatedBy: "Varun",
              source: "-",
              notes: "-",
              reference: "-",
              createdDate: "09/02/2025",
              createdBy: "Varun",
            },
            {
              branch: "-",
              code: "008",
              label: "-",
              start: "19/02/2025",
              end: "19/02/2025",
              customer: "Yuvaraj Sen",
              phone: "+91 9658741230",
              pax: "PAX",
              table: "T-05",
              group: "Resource Group",
              status: "Reserved",
              updatedAt: "04:56",
              updatedBy: "Samar",
              source: "-",
              notes: "-",
              reference: "-",
              createdDate: "09/02/2025",
              createdBy: "Samar",
            },
          ].map((row, i) => (
            <div
              key={i}
              className={`grid px-4 py-2 text-xs border-t ${
                i % 2 === 1 ? "bg-[#FFFBEA]" : ""
              }`}
              style={{
                gridTemplateColumns:
                  "140px 100px 120px 140px 140px 160px 160px 80px 100px 140px 120px 140px 140px 100px 100px 120px 120px 120px",
              }}
            >
              <div>{row.branch}</div>
              <div>{row.code}</div>
              <div>{row.label}</div>
              <div>{row.start}</div>
              <div>{row.end}</div>
              <div>{row.customer}</div>
              <div>{row.phone}</div>
              <div>{row.pax}</div>
              <div>{row.table}</div>
              <div>{row.group}</div>
              <div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    row.status === "Reserved"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {row.status}
                </span>
              </div>
              <div>{row.updatedAt}</div>
              <div>{row.updatedBy}</div>
              <div>{row.source}</div>
              <div>{row.notes}</div>
              <div>{row.reference}</div>
              <div>{row.createdDate}</div>
              <div>{row.createdBy}</div>
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

/* ================= Dropdown (CHECKBOX UI FIXED – EXACT REFERENCE) ================= */

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

  const toggle = (opt: string) => {
    if (!multi) {
      setSelected([opt]);
      setOpen(false);
    } else {
      setSelected((prev) =>
        prev.includes(opt)
          ? prev.filter((x) => x !== opt)
          : [...prev, opt]
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
                onClick={() => toggle(opt)}
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
                    {active ? "✓" : ""}
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
