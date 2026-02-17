import { useState, useEffect, useCallback } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import { Search } from "lucide-react";
import { getSalesAuditTransactions, SalesTransactionRow } from "../../../services/reportsService";
import { getBranches } from "../../../services/branchService";

function getDateRange(label: string): { startDate: string; endDate: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start = end;
  switch (label) {
    case "Yesterday": { const d = new Date(now); d.setDate(d.getDate() - 1); start = d.toISOString().split("T")[0]; break; }
    case "Last 7 days": { const d = new Date(now); d.setDate(d.getDate() - 7); start = d.toISOString().split("T")[0]; break; }
    case "Last 30 days": { const d = new Date(now); d.setDate(d.getDate() - 30); start = d.toISOString().split("T")[0]; break; }
    case "Last 90 days": { const d = new Date(now); d.setDate(d.getDate() - 90); start = d.toISOString().split("T")[0]; break; }
    default: break;
  }
  return { startDate: start, endDate: end };
}

/* ===================== TABLE COLUMNS ===================== */
const TABLE_COLUMNS = [
   { key: "branchName", label: "Branch Name" },
  { key: "branchCode", label: "Branch Code" },
  { key: "branchLabel", label: "Branch Labels" },
  { key: "brand", label: "Brand" },
  { key: "businessDate", label: "Business Date" },
  { key: "invoiceNumber", label: "Invoice Number" },
  { key: "invoiceDate", label: "Invoice Date" },
  { key: "customerTIN", label: "Customer TIN Number / PAN Number" },
  { key: "statementNumber", label: "Statement Number" },
  { key: "saleStatus", label: "Sale Status" },
  { key: "advanceOrder", label: "Advance Order" },
  { key: "einvoiceStatus", label: "E-Invoice IRN Status" },
  { key: "einvoiceNumber", label: "E-Invoice IRN Number" },
  { key: "einvoiceRemarks", label: "E-Invoice Remarks" },
  { key: "einvoiceCustomerTIN", label: "E-Invoice Customer TIN" },
  { key: "amountRefunded", label: "Amount Returned" },
  { key: "returnPaymentMode", label: "Return Payment Mode" },
  { key: "fulfillmentStatus", label: "Fulfillment Status" },
  { key: "invoiceType", label: "Invoice Type" },
   { key: "invoiceType", label: "Invoice Type" },
  { key: "orderNumber", label: "Order Number" },
  { key: "offlineOrderNumber", label: "Offline Order Number" },
  { key: "orderSource", label: "Order Source" },
  { key: "sourceOrderNumber", label: "Source Order Number" },
  { key: "sourceOutletId", label: "Source Outlet ID" },
  { key: "openOrderAmount", label: "Open Order Amount" },
  { key: "discounts", label: "Discounts" },
  { key: "charges", label: "Charges" },
  { key: "netAmount", label: "Net Amount" },
  { key: "otherCharge", label: "Other Charge Amount" },
  { key: "taxes", label: "Taxes" },
  { key: "rounding", label: "Rounding" },
  { key: "tips", label: "Tips" },
  { key: "total", label: "Total" },
  { key: "amountPaid", label: "Amount Paid" },
  { key: "amountDue", label: "Amount Due" },
  { key: "discountPercent", label: "% Discount" },
  { key: "taxPaidByAggregator", label: "Tax paid by Aggregator" },
  { key: "paymentMode", label: "Payment Modes" },
  { key: "materialCost", label: "Materials Cost" },
  { key: "suppliesCost", label: "Supplies Cost" },
  { key: "channel", label: "Channel" },
  { key: "channelLabel", label: "Channel Label" },
  { key: "session", label: "Session" },
   { key: "label", label: "Label" },
  { key: "tags", label: "Tags" },
  { key: "orderNotes", label: "Order Notes" },
  { key: "resourceGroup", label: "Resource Group Name" },
  { key: "noOfProducts", label: "No. of Products" },
  { key: "totalQuantity", label: "Total Quantity" },
  { key: "byReservation", label: "By Reservation" },
  { key: "reservationSource", label: "Reservation Source" },
  { key: "reservationReference", label: "Reservation Reference" },
  { key: "noOfPeople", label: "No. of People" },
  { key: "duration", label: "Duration (Minutes)" },
  { key: "noOfTickets", label: "No. of Tickets" },
  { key: "noOfModifiedTickets", label: "No. of Modified Tickets" },
  { key: "noOfCancelledTickets", label: "No. of Cancelled Tickets" },
  { key: "billPrints", label: "No. of Bill Prints" },
  { key: "modifiedAfterPrint", label: "Modified after Print" },
  { key: "modifiedAfterClose", label: "Modified after Close" },
  { key: "changeLogs", label: "Change Logs after Print" },
  { key: "billPrintLog", label: "Bill Print Log" },
  { key: "createdOn", label: "Created On" },
  { key: "createdBy", label: "Created By" },
  { key: "closedBy", label: "Closed By" },
  { key: "saleBy", label: "Sale By" },
  { key: "deliveryMode", label: "Delivery Mode" },
  { key: "deliveryBy", label: "Delivery By" },
  { key: "deliveryUserId", label: "Delivery User ID" },
  { key: "cancelDate", label: "Cancel/Void Date" },
  { key: "cancelReason", label: "Reason for Cancel/Void" },
];

const SalesAduitTransaction = () => {
  const [rows, setRows] = useState<SalesTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("Last 30 days");
  const [branchFilter, setBranchFilter] = useState<string[]>([]);
  const [channelFilter, setChannelFilter] = useState<string[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getBranches({ status: "Active" }).then((res) => {
      if (res.success && res.data) {
        setBranches((res.data as any).branches || []);
      }
    }).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getDateRange(dateFilter);
      const branchId = branchFilter.length === 1 ? branches.find(b => b.name === branchFilter[0])?.id : undefined;
      const channel = channelFilter.length === 1 ? channelFilter[0] : undefined;
      const response = await getSalesAuditTransactions(startDate, endDate, branchId, channel);
      if (response.success && response.data) {
        setRows(response.data.transactions);
      } else {
        setError(response.message || "Failed to load data");
      }
    } catch {
      setError("Failed to load sales audit transactions");
    } finally {
      setLoading(false);
    }
  }, [dateFilter, branchFilter, channelFilter, branches]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [dateFilter, branchFilter, channelFilter]);

  const filters = {
    startDate: getDateRange(dateFilter).startDate,
    endDate: getDateRange(dateFilter).endDate,
    branchId: branchFilter.length === 1 ? branches.find(b => b.name === branchFilter[0])?.id : undefined,
  };

  return (
    <div className="mx-3 md:mx-4 mt-4 space-y-4">

      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="text-xl font-semibold text-bb-text">
                Sales Transactions Audit
              </h2>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  />
                  <input
                    placeholder="Search here..."
                    className="w-full border border-grey rounded-md px-3 pr-10 py-2 text-sm bg-bb-bg placeholder:text-black"
                  />
                </div>
                <ReportActions reportType="sales" filters={filters} />
              </div>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap justify-end gap-2">
              <Dropdown label="Filter by Date" options={["Today", "Yesterday", "Last 7 days", "Last 30 days", "Last 90 days"]} onSelect={(v) => setDateFilter(v[0] || "Last 30 days")} />
              <Dropdown label="Filter by Branch" multi options={branches.map(b => b.name)} onSelect={setBranchFilter} />
              <Dropdown label="Filter by Channel" multi options={["DineIn", "TakeAway", "Delivery", "Online"]} onSelect={setChannelFilter} />
              <button onClick={() => { setDateFilter("Last 30 days"); setBranchFilter([]); setChannelFilter([]); }} className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4">
                Clear
              </button>
            </div>

      {/* Content */}
      {loading && <div className="text-center py-8 text-bb-textSoft">Loading sales audit transactions...</div>}
      {error && <div className="text-center py-8 text-red-500">{error}</div>}
      {!loading && !error && rows.length === 0 && <div className="text-center py-8 text-bb-textSoft">No data available</div>}

      {!loading && !error && rows.length > 0 && (
        <>
          {/* ================= TABLE ================= */}
          <div className="bg-white rounded-xl border border-bb-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[1600px] text-sm whitespace-nowrap">
                <thead className="bg-bb-primary sticky top-0 z-10">
                  <tr>
                    {TABLE_COLUMNS.map(col => (
                      <th
                        key={col.key}
                        className="px-4 py-3 text-left font-semibold"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 1 ? "bg-bb-hover" : "border-b"}
                    >
                      {TABLE_COLUMNS.map(col => (
                        <td key={col.key} className="px-4 py-3">
                          {row[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= PAGINATION ================= */}
          <div className="pt-2">
            <Pagination />
          </div>
        </>
      )}

    </div>
  );
};

export default SalesAduitTransaction;

/* ================= Dropdown ================= */

function Dropdown({ label, options, multi = false, onSelect }: { label: string; options: string[]; multi?: boolean; onSelect?: (selected: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggleOption = (opt: string) => {
    let newSelected: string[];
    if (!multi) {
      newSelected = [opt];
      setOpen(false);
    } else {
      newSelected = selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt];
    }
    setSelected(newSelected);
    onSelect?.(newSelected);
  };

  return (
    <div className="relative w-full sm:w-44">
      <button onClick={() => setOpen(!open)} className="bb-input w-full bg-bb-bg flex justify-between items-center">
        <span className="text-sm truncate">{selected.length ? selected.join(", ") : label}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 w-full bg-white border rounded-md shadow max-h-64 overflow-auto">
          {options.map((opt) => {
            const active = selected.includes(opt);
            return (
              <div key={opt} onClick={() => toggleOption(opt)} className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${active ? "bg-[#FFF3CD]" : "hover:bg-[#FFF3CD]"}`}>
                {multi && (
                  <span className={`w-4 h-4 border flex items-center justify-center ${active ? "bg-black text-white border-black" : "border-gray-300"}`}>
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
