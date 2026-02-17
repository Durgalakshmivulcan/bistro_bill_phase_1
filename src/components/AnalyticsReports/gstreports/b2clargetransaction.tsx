import { useState, useEffect } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import Select from "../../form/Select";
import { Search } from "lucide-react";
import { getGSTB2C } from "../../../services/reportsService";
import type { GstB2cReport } from "../../../services/reportsService";

const BLargesaleTranscation = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<GstB2cReport | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchGSTData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const fetchGSTData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getGSTB2C(month, year);

      if (response.success && response.data) {
        setReportData(response.data);
      } else {
        setError(response.message || "Failed to load GST B2C data");
      }
    } catch (err) {
      setError("An error occurred while loading GST B2C data");
      console.error("Error fetching GST B2C:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-3 md:mx-4 mt-4 space-y-4">

      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-xl font-semibold text-bb-text">
         B2C Large Sale Transaction
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
          <ReportActions
            reportType="gst"
            filters={{
              gstType: 'b2c',
              month: month.toString(),
              year: year.toString()
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-end sm:items-center">
        {/* Month Filter */}
        <div className="w-full sm:w-56">
          <Select
            value={month.toString()}
            options={[
              { label: "January", value: "1" },
              { label: "February", value: "2" },
              { label: "March", value: "3" },
              { label: "April", value: "4" },
              { label: "May", value: "5" },
              { label: "June", value: "6" },
              { label: "July", value: "7" },
              { label: "August", value: "8" },
              { label: "September", value: "9" },
              { label: "October", value: "10" },
              { label: "November", value: "11" },
              { label: "December", value: "12" },
            ]}
            onChange={(value) => setMonth(parseInt(value))}
          />
        </div>

        {/* Year Filter */}
        <div className="w-full sm:w-56">
          <Select
            value={year.toString()}
            options={[
              { label: "2024", value: "2024" },
              { label: "2025", value: "2025" },
              { label: "2026", value: "2026" },
            ]}
            onChange={(value) => setYear(parseInt(value))}
          />
        </div>

        {/* Clear Button */}
        <button
          onClick={() => {
            setMonth(new Date().getMonth() + 1);
            setYear(new Date().getFullYear());
          }}
          className="bg-yellow-400 px-4 py-2 rounded border border-black w-full sm:w-auto"
        >
          Clear
        </button>
      </div>

      {/* ================= Summary ================= */}
      {reportData && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-bb-text mb-3">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-bb-textSoft">Total Orders</p>
              <p className="font-semibold">{reportData.summary.totalOrders}</p>
            </div>
            <div>
              <p className="text-bb-textSoft">Total Taxable Amount</p>
              <p className="font-semibold">₹{reportData.summary.totalTaxableAmount?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-bb-textSoft">Total Tax Amount</p>
              <p className="font-semibold">₹{reportData.summary.totalTaxAmount?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-bb-textSoft">Total Amount</p>
              <p className="font-semibold">₹{reportData.summary.totalAmount?.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= Error State ================= */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* ================= Loading State ================= */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bb-primary"></div>
        </div>
      )}

      {/* ================= TABLE (State-wise Summary) ================= */}
      {!loading && reportData && (
        <div className="bg-white rounded-xl border border-bb-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] text-sm whitespace-nowrap">
              <thead className="bg-bb-primary sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">State</th>
                  <th className="px-4 py-3">Order Count</th>
                  <th className="px-4 py-3">Taxable Amount</th>
                  <th className="px-4 py-3">Tax Amount</th>
                  <th className="px-4 py-3">Total Amount</th>
                </tr>
              </thead>

              <tbody>
                {reportData.stateWiseSummary.map((stateData, index) => (
                  <tr key={index} className={index % 2 === 0 ? "border-b hover:bg-bb-hover" : "hover:bg-bb-hover"}>
                    <td className="px-4 py-3">{stateData.state}</td>
                    <td className="px-4 py-3">{stateData.orderCount}</td>
                    <td className="px-4 py-3">₹{stateData.taxableAmount?.toFixed(2)}</td>
                    <td className="px-4 py-3">₹{stateData.taxAmount?.toFixed(2)}</td>
                    <td className="px-4 py-3">₹{stateData.totalAmount?.toFixed(2)}</td>
                  </tr>
                ))}

                {reportData.stateWiseSummary.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-bb-textSoft">
                      No B2C transactions found for this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= PAGINATION ================= */}
      <div className="pt-2">
        <Pagination />
      </div>

    </div>
  );
};

export default BLargesaleTranscation;
