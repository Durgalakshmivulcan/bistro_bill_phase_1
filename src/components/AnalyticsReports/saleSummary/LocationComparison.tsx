import { useState, useEffect, useCallback } from "react";
import { getBranchPerformance, type BranchPerformance } from "../../../services/dashboardService";
import { getSalesSummary, type SalesSummary } from "../../../services/reportsService";
import { useBranch } from "../../../contexts/BranchContext";
import ReportActions from "../../Common/ReportActions";

export default function LocationComparison() {
  const { availableBranches } = useBranch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branchData, setBranchData] = useState<BranchPerformance[]>([]);
  const [branchSalesMap, setBranchSalesMap] = useState<Record<string, SalesSummary>>({});
  const [dateFilter, setDateFilter] = useState<string>("Last 30 days");

  const getDateRange = useCallback(() => {
    const end = new Date();
    const start = new Date();

    switch (dateFilter) {
      case "Today":
        start.setHours(0, 0, 0, 0);
        break;
      case "Last 7 days":
        start.setDate(start.getDate() - 7);
        break;
      case "Last 30 days":
        start.setDate(start.getDate() - 30);
        break;
      case "Last 90 days":
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }

    return { start: start.toISOString(), end: end.toISOString() };
  }, [dateFilter]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { start, end } = getDateRange();

      // Fetch branch performance (aggregated view)
      const perfResponse = await getBranchPerformance(start, end, 100);
      if (perfResponse.success && perfResponse.data) {
        setBranchData(perfResponse.data);
      }

      // Fetch per-branch sales summaries for detailed comparison
      const salesMap: Record<string, SalesSummary> = {};
      const branchIds = availableBranches.map(b => b.id);

      const salesPromises = branchIds.map(async (branchId) => {
        try {
          const res = await getSalesSummary(start, end, branchId);
          if (res.success && res.data) {
            salesMap[branchId] = res.data;
          }
        } catch {
          // Skip failed branch
        }
      });

      await Promise.all(salesPromises);
      setBranchSalesMap(salesMap);
    } catch (err) {
      setError("Failed to load location comparison data");
      console.error("Error fetching location comparison:", err);
    } finally {
      setLoading(false);
    }
  }, [getDateRange, availableBranches]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate totals for percentage calculation
  const totalRevenue = branchData.reduce((sum, b) => sum + b.revenue, 0);
  const totalOrders = branchData.reduce((sum, b) => sum + b.orderCount, 0);

  return (
    <div className="mx-3 md:mx-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Location Comparison
        </h2>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bb-input text-sm bg-bb-bg"
          >
            <option>Today</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>

          <ReportActions
            reportType="location-comparison"
            filters={{
              startDate: getDateRange().start,
              endDate: getDateRange().end,
            }}
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bb-primary" />
        </div>
      )}

      {/* Comparison Table */}
      {!loading && branchData.length > 0 && (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Table Header */}
            <div className="grid grid-cols-6 bg-bb-primary text-bb-secondary px-4 py-2 text-sm font-medium">
              <div className="col-span-2">Location</div>
              <div className="text-right">Revenue</div>
              <div className="text-right">Orders</div>
              <div className="text-right">Avg Order</div>
              <div className="text-right">Revenue %</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-gray-200 text-sm">
              {branchData.map((branch) => {
                const avgOrder = branch.orderCount > 0
                  ? branch.revenue / branch.orderCount
                  : 0;
                const revenuePct = totalRevenue > 0
                  ? (branch.revenue / totalRevenue) * 100
                  : 0;

                return (
                  <div
                    key={branch.branchId}
                    className="grid grid-cols-6 px-4 py-3 hover:bg-bb-hover transition-colors"
                  >
                    <div className="col-span-2 font-medium text-bb-text">
                      {branch.branchName}
                    </div>
                    <div className="text-right">
                      {'\u20B9'} {branch.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-right">{branch.orderCount}</div>
                    <div className="text-right">
                      {'\u20B9'} {avgOrder.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 rounded-full bg-bb-primary"
                            style={{ width: `${Math.min(revenuePct, 100)}%` }}
                          />
                        </div>
                        <span>{revenuePct.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals Row */}
            <div className="grid grid-cols-6 px-4 py-3 bg-[#FFF3CD] font-medium text-sm border-t-2 border-bb-primary">
              <div className="col-span-2">All Locations Total</div>
              <div className="text-right">
                {'\u20B9'} {totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-right">{totalOrders}</div>
              <div className="text-right">
                {'\u20B9'} {(totalOrders > 0 ? totalRevenue / totalOrders : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-right">100%</div>
            </div>
          </div>
        </div>
      )}

      {/* Per-Branch Detailed Comparison */}
      {!loading && Object.keys(branchSalesMap).length > 0 && (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h3 className="text-sm font-semibold text-bb-text">Detailed Metrics by Location</h3>
            </div>

            <div className="grid grid-cols-5 bg-bb-primary text-bb-secondary px-4 py-2 text-sm font-medium">
              <div>Location</div>
              <div className="text-right">Discounts</div>
              <div className="text-right">Tax</div>
              <div className="text-right">Cancelled</div>
              <div className="text-right">Growth %</div>
            </div>

            <div className="divide-y divide-gray-200 text-sm">
              {availableBranches.map((branch) => {
                const sales = branchSalesMap[branch.id];
                if (!sales) return null;

                const growthPct = sales.comparison?.revenueChange || 0;

                return (
                  <div
                    key={branch.id}
                    className="grid grid-cols-5 px-4 py-3 hover:bg-bb-hover transition-colors"
                  >
                    <div className="font-medium text-bb-text">{branch.name}</div>
                    <div className="text-right">
                      {'\u20B9'} {(sales.currentPeriod?.totalDiscounts || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-right">
                      {'\u20B9'} {(sales.currentPeriod?.totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-right">
                      {'\u20B9'} {((sales.currentPeriod as any)?.cancelledRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-right font-medium ${growthPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && branchData.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-bb-textSoft text-lg">No location data available</p>
          <p className="text-bb-textSoft text-sm mt-2">Add more branches to see location comparison</p>
        </div>
      )}
    </div>
  );
}
