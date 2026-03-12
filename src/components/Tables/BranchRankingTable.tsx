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
    } catch {
      setError("An error occurred while loading branch performance data");
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = branches.reduce((sum, branch) => sum + branch.revenue, 0);

  const sortedBranches = [...branches].sort((a, b) => {
    if (tab === "Top Performing Branch") return b.revenue - a.revenue;
    return a.revenue - b.revenue;
  });

  return (
    <TableCard title="Branch Ranking" subtitle="By Revenue">
      <TableTabs
        active={tab}
        tabs={["Top Performing Branch", "Worst Performing Branch"]}
        onChange={setTab}
      />

      {loading && <TableSkeleton rows={6} />}

      {!loading && error && (
        <div className="py-3">
          <ErrorDisplay
            message={error}
            onRetry={fetchBranchPerformance}
            variant="card"
            size="small"
          />
        </div>
      )}

      {!loading && !error && (
        <table className="w-full text-sm border border-[#E5E7EB] rounded-md overflow-hidden">
          <thead className="bg-[#F5C628] text-black">
            <tr>
              <th className="px-3 py-2 text-left text-[12px] font-medium">Branch Name</th>
              <th className="px-3 py-2 text-center text-[12px] font-medium">Sales Qty</th>
              <th className="px-3 py-2 text-center text-[12px] font-medium">% Revenue</th>
              <th className="px-3 py-2 text-right text-[12px] font-medium">Total Revenue</th>
            </tr>
          </thead>

          <tbody>
            {sortedBranches.length > 0 ? (
              sortedBranches.map((branch, index) => {
                const percentage = totalRevenue > 0
                  ? ((branch.revenue / totalRevenue) * 100).toFixed(1)
                  : "0";

                return (
                  <tr key={branch.branchId} className={`${index % 2 === 0 ? "bg-[#F7F7F7]" : "bg-[#F6F0E1]"} border-t border-[#E5E7EB]`}>
                    <td className="px-3 py-2 text-[12px] text-[#374151]">{branch.branchName}</td>
                    <td className="px-3 py-2 text-center text-[12px] text-[#374151]">{branch.orderCount}</td>
                    <td className="px-3 py-2 text-center text-[12px] text-[#374151]">{percentage}%</td>
                    <td className="px-3 py-2 text-right text-[12px] text-[#374151]">{"\u20B9"} {branch.revenue.toLocaleString("en-IN")}</td>
                  </tr>
                );
              })
            ) : (
              <tr className="bg-[#F7F7F7] border-t border-[#E5E7EB]">
                <td colSpan={4} className="px-3 py-6 text-center text-[12px] text-bb-textSoft">
                  No branch data available for the selected period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </TableCard>
  );
};

export default BranchRankingTable;
