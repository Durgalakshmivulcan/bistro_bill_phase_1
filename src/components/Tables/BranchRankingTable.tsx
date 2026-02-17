import { useState, useEffect } from "react";
import TableCard from "./TableCard";
import TableTabs from "../Common/TableTabs";
import { TableSkeleton } from "../Common/SkeletonLoader";
import { ErrorDisplay } from "../Common/ErrorDisplay";
import { getBranchPerformance, type BranchPerformance } from "../../services/dashboardService";

interface BranchRankingTableProps {
  startDate?: string;
  endDate?: string;
}

const BranchRankingTable: React.FC<BranchRankingTableProps> = ({ startDate, endDate }) => {
  const [tab, setTab] = useState("Top Performing Branch");
  const [branches, setBranches] = useState<BranchPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch branch performance when filters change
  useEffect(() => {
    fetchBranchPerformance();
  }, [startDate, endDate]);

  const fetchBranchPerformance = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getBranchPerformance(startDate, endDate);

      if (response.success && response.data) {
        setBranches(response.data);
      } else {
        setError(response.error?.message || "Failed to load branch performance data");
      }
    } catch (err) {
      setError("An error occurred while loading branch performance data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total revenue for percentage calculation
  const totalRevenue = branches.reduce((sum, branch) => sum + branch.revenue, 0);

  // Sort branches based on active tab
  const sortedBranches = [...branches].sort((a, b) => {
    if (tab === "Top Performing Branch") {
      return b.revenue - a.revenue; // DESC
    } else {
      return a.revenue - b.revenue; // ASC
    }
  });

  return (
    <TableCard title="Branch Ranking" subtitle="By Revenue">
      <TableTabs
        active={tab}
        tabs={["Top Performing Branch", "Worst Performing Branch"]}
        onChange={setTab}
      />

      {/* Loading State - Skeleton */}
      {loading && <TableSkeleton rows={5} />}

      {/* Error State */}
      {!loading && error && (
        <div className="py-4">
          <ErrorDisplay
            message={error}
            onRetry={fetchBranchPerformance}
            variant="card"
            size="small"
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && branches.length === 0 && (
        <div className="text-center py-8">
          <p className="text-bb-textSoft text-sm">
            No branch data available for the selected period
          </p>
        </div>
      )}

      {/* Data Display */}
      {!loading && !error && branches.length > 0 && (
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-bb-primary text-black">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Branch Name</th>
              <th className="px-3 py-2 text-center font-medium">Sales Qty</th>
              <th className="px-3 py-2 text-center font-medium">% Revenue</th>
              <th className="px-3 py-2 text-right font-medium">Total Revenue</th>
            </tr>
          </thead>

          <tbody>
            {sortedBranches.map((branch) => {
              const percentage = totalRevenue > 0
                ? ((branch.revenue / totalRevenue) * 100).toFixed(1)
                : "0";

              return (
                <tr key={branch.branchId}>
                  <td className="px-3 py-2">{branch.branchName}</td>
                  <td className="px-3 py-2 text-center">{branch.orderCount}</td>
                  <td className="px-3 py-2 text-center">{percentage}%</td>
                  <td className="px-3 py-2 text-right">
                    ₹ {branch.revenue.toLocaleString("en-IN")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </TableCard>
  );
};

export default BranchRankingTable;
