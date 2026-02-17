import { useState, useEffect, useCallback } from "react";
import ReportActions from "../../Common/ReportActions";
import { getSalesSummaryByChannel, SalesSummaryByChannelResponse } from "../../../services/reportsService";
import { getBranches } from "../../../services/branchService";

function getDateRange(label: string): { startDate: string; endDate: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start = end;
  switch (label) {
    case "Yesterday": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      start = d.toISOString().split("T")[0];
      break;
    }
    case "Last 7 days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split("T")[0];
      break;
    }
    case "Last 30 days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      start = d.toISOString().split("T")[0];
      break;
    }
    case "Last 90 days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      start = d.toISOString().split("T")[0];
      break;
    }
    default:
      break;
  }
  return { startDate: start, endDate: end };
}

export default function SalesSummaryByChannel() {
  const [open, setOpen] = useState({
    gross: true,
    payment: true,
    tax: true,
    transactions: true,
    category: true,
    source: true,
  });
  const [data, setData] = useState<SalesSummaryByChannelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("Last 30 days");
  const [branchFilter, setBranchFilter] = useState<string[]>([]);
  const [channelFilter, setChannelFilter] = useState<string[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  const toggle = (key: keyof typeof open) =>
    setOpen((p) => ({ ...p, [key]: !p[key] }));

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
      const response = await getSalesSummaryByChannel(startDate, endDate, branchId, channel);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to load data");
      }
    } catch {
      setError("Failed to load sales summary");
    } finally {
      setLoading(false);
    }
  }, [dateFilter, branchFilter, channelFilter, branches]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [dateFilter, branchFilter, channelFilter]);

  const fmt = (n: number) => `₹ ${n.toFixed(2)}`;
  const channels = data?.byChannel || [];
  const firstChannel = channels[0];

  const filters = {
    startDate: getDateRange(dateFilter).startDate,
    endDate: getDateRange(dateFilter).endDate,
    branchId: branchFilter.length === 1 ? branches.find(b => b.name === branchFilter[0])?.id : undefined,
  };

  return (
    <div className="mx-3 md:mx-4 space-y-3">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Sales Summary by Channel
        </h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <div className="relative w-full sm:w-56">
            <input type="text" placeholder="Search here..." className="bb-input w-full pr-10 bg-bb-bg" />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <ReportActions reportType="sales" filters={filters} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-end gap-2">
        <Dropdown label="Filter by Date" options={["Today", "Yesterday", "Last 7 days", "Last 30 days", "Last 90 days"]} onSelect={(v) => setDateFilter(v[0] || "Last 30 days")} />
        <Dropdown label="Filter by Branch" multi options={branches.map(b => b.name)} onSelect={setBranchFilter} />
        <Dropdown label="Filter by Channel" multi options={["DineIn", "TakeAway", "Delivery", "Online"]} onSelect={setChannelFilter} />
        <button onClick={() => { setDateFilter("Last 30 days"); setBranchFilter([]); setChannelFilter([]); }} className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4">
          Clear
        </button>
      </div>

      {/* Content */}
      {loading && <div className="text-center py-8 text-bb-textSoft">Loading sales summary...</div>}
      {error && <div className="text-center py-8 text-red-500">{error}</div>}
      {!loading && !error && !data && <div className="text-center py-8 text-bb-textSoft">No data available</div>}

      {!loading && !error && data && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Header */}
            <div className="grid grid-cols-3 bg-bb-primary text-bb-secondary px-4 py-2 text-sm font-medium">
              <div>Description</div>
              <div className="text-right">Total</div>
              <div className="text-right">{firstChannel?.channel || "Channel"}</div>
            </div>

            <div className="divide-y divide-gray-200 text-sm">
              <SectionRow title="Gross Sales (Net Sales - Direct Charges + Discounts + Returns)" total={fmt(data.total.grossSales)} delivery={firstChannel ? fmt(firstChannel.grossSales) : "-"} open={open.gross} onClick={() => toggle("gross")} />
              {open.gross && (
                <>
                  <SubRow label="Sales Return" total={fmt(data.total.salesReturn)} delivery={firstChannel ? fmt(firstChannel.salesReturn) : "-"} />
                  <SubRow label="Discounts" total={fmt(data.total.discounts)} delivery={firstChannel ? fmt(firstChannel.discounts) : "-"} />
                  <SubRow label="Net Sales" total={fmt(data.total.netSales)} delivery={firstChannel ? fmt(firstChannel.netSales) : "-"} />
                  <SubRow label="Taxes" total={fmt(data.total.taxes)} delivery={firstChannel ? fmt(firstChannel.taxes) : "-"} />
                  <SubRow label="Total Gross Revenue" total={fmt(data.total.totalGrossRevenue)} delivery={firstChannel ? fmt(firstChannel.totalGrossRevenue) : "-"} />
                </>
              )}

              <SectionRow title="Payment Summary" total={fmt(data.total.totalGrossRevenue)} delivery={firstChannel ? fmt(firstChannel.totalGrossRevenue) : "-"} open={open.payment} onClick={() => toggle("payment")} />
              {open.payment && data.paymentSummary.map((p) => (
                <SubRow key={p.method} label={p.method} total={fmt(p.amount)} delivery={fmt(p.amount)} />
              ))}
              {open.payment && data.paymentSummary.length === 0 && (
                <SubRow label="No payments" total="-" delivery="-" />
              )}

              <SectionRow title="Tax Summary" total={fmt(data.taxSummary.cgst + data.taxSummary.sgst + data.taxSummary.igst)} delivery={fmt(data.taxSummary.cgst + data.taxSummary.sgst)} open={open.tax} onClick={() => toggle("tax")} />
              {open.tax && (
                <>
                  <SubRow label="CGST 2.5%" total={fmt(data.taxSummary.cgst)} delivery={fmt(data.taxSummary.cgst)} />
                  <SubRow label="SGST 2.5%" total={fmt(data.taxSummary.sgst)} delivery={fmt(data.taxSummary.sgst)} />
                  {data.taxSummary.igst > 0 && <SubRow label="IGST" total={fmt(data.taxSummary.igst)} delivery={fmt(data.taxSummary.igst)} />}
                </>
              )}

              <SectionRow title="Transactions Summary" open={open.transactions} onClick={() => toggle("transactions")} />
              {open.transactions && (
                <>
                  <SubRow label="No. of Transactions" total={String(data.total.transactionCount)} delivery={firstChannel ? String(firstChannel.transactionCount) : "0"} />
                  <SubRow label="Average Sale per Transaction" total={fmt(data.total.avgSalePerTransaction)} delivery={firstChannel ? fmt(firstChannel.avgSalePerTransaction) : "-"} />
                </>
              )}

              <SectionRow title="Category Summary" total={fmt(data.total.netSales)} delivery={firstChannel ? fmt(firstChannel.netSales) : "-"} open={open.category} onClick={() => toggle("category")} />
              {open.category && data.categorySummary.map((c) => (
                <SubRow key={c.category} label={c.category} total={fmt(c.amount)} delivery={fmt(c.amount)} />
              ))}
              {open.category && data.categorySummary.length === 0 && (
                <SubRow label="No category data" total="-" delivery="-" />
              )}

              <SectionRow title="Source Summary" open={open.source} onClick={() => toggle("source")} />
              {open.source && channels.map((ch) => (
                <SubRow key={ch.channel} label={ch.channel} total={fmt(ch.netSales)} delivery={fmt(ch.netSales)} />
              ))}
              {open.source && channels.length === 0 && (
                <SubRow label="No source data" total="-" delivery="-" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= Reusable Components ================= */

function SectionRow({ title, total, delivery, open, onClick }: any) {
  return (
    <div onClick={onClick} className="grid grid-cols-3 px-4 py-2 cursor-pointer bg-[#FFF3CD] text-bb-textSoft font-medium border-t">
      <div className="flex items-start gap-2 break-words">
        <Chevron open={open} />
        <span className="break-words">{title}</span>
      </div>
      <div className="text-right">{total ?? ""}</div>
      <div className="text-right">{delivery ?? ""}</div>
    </div>
  );
}

function SubRow({ label, total, delivery }: any) {
  return (
    <div className="grid grid-cols-3 px-4 sm:px-8 py-1.5 text-bb-textSoft border-t">
      <div className="break-words">{label}</div>
      <div className="text-right">{total ?? ""}</div>
      <div className="text-right">{delivery ?? ""}</div>
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={`w-4 h-4 mt-1 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

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
