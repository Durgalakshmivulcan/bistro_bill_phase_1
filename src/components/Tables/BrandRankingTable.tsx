import { useState, useEffect } from "react";
import TableCard from "./TableCard";
import TableTabs from "../Common/TableTabs";
import { TableSkeleton } from "../Common/SkeletonLoader";
import ErrorDisplay from "../Common/ErrorDisplay";
import { getTopBrands, TopBrand } from "../../services/dashboardService";

interface BrandRankingTableProps {
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

const BrandRankingTable = ({ startDate, endDate, branchId }: BrandRankingTableProps) => {
  const [tab, setTab] = useState("Top Performing Brand");
  const [brands, setBrands] = useState<TopBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTopBrands(startDate, endDate, branchId);

      if (response.success && response.data) {
        setBrands(response.data);
      } else {
        setError(response.error?.message || "Failed to load brands");
      }
    } catch (err) {
      setError("An error occurred while loading brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [startDate, endDate, branchId]);

  // Calculate total revenue for percentage calculation
  const totalRevenue = brands.reduce((sum, brand) => sum + brand.revenue, 0);

  // Sort brands based on active tab
  const sortedBrands = [...brands].sort((a, b) => {
    if (tab === "Top Performing Brand") {
      return b.revenue - a.revenue; // DESC
    } else {
      return a.revenue - b.revenue; // ASC
    }
  });

  if (loading) {
    return (
      <TableCard title="Brand Ranking" subtitle="By Revenue">
        <TableSkeleton rows={5} />
      </TableCard>
    );
  }

  if (error) {
    return (
      <TableCard title="Brand Ranking" subtitle="By Revenue">
        <ErrorDisplay
          variant="card"
          size="small"
          message={error}
          onRetry={fetchBrands}
        />
      </TableCard>
    );
  }

  if (brands.length === 0) {
    return (
      <TableCard title="Brand Ranking" subtitle="By Revenue">
        <div className="text-center py-8 text-bb-textSoft">
          No brand data available for the selected period
        </div>
      </TableCard>
    );
  }

  return (
    <TableCard title="Brand Ranking" subtitle="By Revenue">
      <TableTabs
        active={tab}
        tabs={["Top Performing Brand", "Worst Performing Brand"]}
        onChange={setTab}
      />

      <table className="w-full text-sm border border-bb-border rounded-lg overflow-hidden">
        <thead className="bg-bb-primary text-black">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Brand Name</th>
            <th className="px-3 py-2 text-center font-medium">Sales Qty</th>
            <th className="px-3 py-2 text-center font-medium">% Revenue</th>
            <th className="px-3 py-2 text-right font-medium">Total Revenue</th>
          </tr>
        </thead>

        <tbody>
          {sortedBrands.map((brand) => {
            const percentage = totalRevenue > 0
              ? ((brand.revenue / totalRevenue) * 100).toFixed(1)
              : "0.0";

            return (
              <tr key={brand.brandId}>
                <td className="px-3 py-2">{brand.brandName}</td>
                <td className="px-3 py-2 text-center">{brand.productCount}</td>
                <td className="px-3 py-2 text-center">{percentage}%</td>
                <td className="px-3 py-2 text-right">
                  ₹ {brand.revenue.toLocaleString("en-IN")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableCard>
  );
};

export default BrandRankingTable;
