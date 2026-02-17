import { useState, useEffect, useMemo, useCallback } from "react";
import { Search } from "lucide-react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import Select from "../../form/Select";
import { getSalesTransactions, SalesTransactionRow } from "../../../services/reportsService";
import { getBranches, Branch } from "../../../services/branchService";
import LoadingSpinner from "../../Common/LoadingSpinner";

/* ===================== DATE HELPERS ===================== */
function getDateRange(filter: string) {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start = end;
  if (filter === "This Month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  } else if (filter === "Last 30 days") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    start = d.toISOString().split("T")[0];
  }
  return { startDate: start, endDate: end };
}

interface CompanyRow {
  company: string;
  sales: number;
  gross: string;
  discount: string;
  net: string;
  due: string;
}

const AmountDuecompany = () => {
  const [tableData, setTableData] = useState<CompanyRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("This Month");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  // Load branches on mount
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await getBranches({ status: "Active" });
        if (res.success && res.data) {
          setBranches(res.data.branches || []);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };
    loadBranches();
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(dateFilter);
      const res = await getSalesTransactions(startDate, endDate, selectedBranch || undefined);
      if (res.success && res.data) {
        // Aggregate transactions by company/source
        const byCompany: Record<string, { sales: number; gross: number; discount: number; net: number; due: number }> = {};
        (res.data.transactions || []).forEach((tx: SalesTransactionRow) => {
          const company = String(tx.orderSource || tx.channel || "Direct");
          if (!byCompany[company]) {
            byCompany[company] = { sales: 0, gross: 0, discount: 0, net: 0, due: 0 };
          }
          byCompany[company].sales += 1;
          byCompany[company].gross += Number(tx.subTotal || 0);
          byCompany[company].discount += Number(tx.discounts || 0);
          byCompany[company].net += Number(tx.netAmount || 0);
          byCompany[company].due += Number(tx.amountDue || 0);
        });
        const rows: CompanyRow[] = Object.entries(byCompany).map(([company, vals]) => ({
          company,
          sales: vals.sales,
          gross: `₹ ${vals.gross.toLocaleString()}`,
          discount: `₹ ${vals.discount.toLocaleString()}`,
          net: `₹ ${vals.net.toLocaleString()}`,
          due: `₹ ${vals.due.toLocaleString()}`,
        }));
        setTableData(rows);
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, selectedBranch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side search
  const filteredData = useMemo(() => {
    if (!searchQuery) return tableData;
    const q = searchQuery.toLowerCase();
    return tableData.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [tableData, searchQuery]);

  const handleClear = () => {
    setDateFilter("This Month");
    setSearchQuery("");
    setSelectedBranch("");
  };

  return (
    <div className="mx-2 sm:mx-4 mt-4 space-y-4">

      {/* ================= TITLE ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-xl font-semibold text-bb-text">
          Amount Due by Company Reports
        </h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            />
            <input
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border rounded-md px-3 pr-10 py-2 text-sm bg-bb-bg"
            />
          </div>
          <ReportActions />
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-end sm:items-center">
        <div className="w-full sm:w-56">
          <Select
            value={dateFilter}
            onChange={(value) => setDateFilter(value)}
            options={[
              { label: "Today", value: "Today" },
              { label: "This Month", value: "This Month" },
              { label: "Last 30 days", value: "Last 30 days" },
            ]}
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={selectedBranch}
            onChange={(value) => setSelectedBranch(value)}
            options={[
              { label: "All Branches", value: "" },
              ...branches.map((b) => ({ label: b.name, value: b.id })),
            ]}
          />
        </div>

        <button
          onClick={handleClear}
          className="bg-yellow-400 px-4 py-2 rounded border border-black w-full sm:w-auto"
        >
          Clear
        </button>
      </div>

      {/* ================= LOADING ================= */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading report data..." />
        </div>
      )}

      {/* ================= TABLE ================= */}
      {!loading && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-bb-primary">
                <tr>
                  <th className="px-4 py-3 text-left">Company Name</th>
                  <th className="px-4 py-3 text-right">No. of Sales</th>
                  <th className="px-4 py-3 text-right">Gross Amount</th>
                  <th className="px-4 py-3 text-right">Discounts</th>
                  <th className="px-4 py-3 text-right">Net Amount</th>
                  <th className="px-4 py-3 text-right">Amount Due</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.map((row, index) => (
                  <tr key={index} className={index % 2 ? "bg-bb-hover" : ""}>
                    <td className="px-4 py-3">{row.company}</td>
                    <td className="px-4 py-3 text-right">{row.sales}</td>
                    <td className="px-4 py-3 text-right">{row.gross}</td>
                    <td className="px-4 py-3 text-right">{row.discount}</td>
                    <td className="px-4 py-3 text-right">{row.net}</td>
                    <td className="px-4 py-3 text-right">{row.due}</td>
                  </tr>
                ))}

                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-bb-textSoft">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-center md:justify-end mt-4">
        <Pagination />
      </div>
    </div>
  );
};

export default AmountDuecompany;
