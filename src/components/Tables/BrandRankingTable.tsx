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
    } catch {
      setError("An error occurred while loading brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [startDate, endDate, branchId]);

  const totalRevenue = brands.reduce((sum, brand) => sum + brand.revenue, 0);

  const sortedBrands = [...brands].sort((a, b) => {
    if (tab === "Top Performing Brand") return b.revenue - a.revenue;
    return a.revenue - b.revenue;
  });

  return (
    <TableCard title="Brand Ranking" subtitle="By Revenue">
      <TableTabs
        active={tab}
        tabs={["Top Performing Brand", "Worst Performing Brand"]}
        onChange={setTab}
      />

      {loading && <TableSkeleton rows={6} />}

      {!loading && error && (
        <div className="py-3">
          <ErrorDisplay
            variant="card"
            size="small"
            message={error}
            onRetry={fetchBrands}
          />
        </div>
      )}

      {!loading && !error && (
        <table className="w-full text-sm border border-[#E5E7EB] rounded-md overflow-hidden">
          <thead className="bg-[#F5C628] text-black">
            <tr>
              <th className="px-3 py-2 text-left text-[12px] font-medium">Brand Name</th>
              <th className="px-3 py-2 text-center text-[12px] font-medium">Sales Qty</th>
              <th className="px-3 py-2 text-center text-[12px] font-medium">% Revenue</th>
              <th className="px-3 py-2 text-right text-[12px] font-medium">Total Revenue</th>
            </tr>
          </thead>

          <tbody>
            {sortedBrands.length > 0 ? (
              sortedBrands.map((brand, index) => {
                const percentage = totalRevenue > 0
                  ? ((brand.revenue / totalRevenue) * 100).toFixed(1)
                  : "0.0";

                return (
                  <tr key={brand.brandId} className={`${index % 2 === 0 ? "bg-[#F7F7F7]" : "bg-[#F6F0E1]"} border-t border-[#E5E7EB]`}>
                    <td className="px-3 py-2 text-[12px] text-[#374151]">{brand.brandName}</td>
                    <td className="px-3 py-2 text-center text-[12px] text-[#374151]">{brand.productCount}</td>
                    <td className="px-3 py-2 text-center text-[12px] text-[#374151]">{percentage}%</td>
                    <td className="px-3 py-2 text-right text-[12px] text-[#374151]">{"\u20B9"} {brand.revenue.toLocaleString("en-IN")}</td>
                  </tr>
                );
              })
            ) : (
              <tr className="bg-[#F7F7F7] border-t border-[#E5E7EB]">
                <td colSpan={4} className="px-3 py-6 text-center text-[12px] text-bb-textSoft">
                  No brand data available for the selected period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </TableCard>
  );
};

export default BrandRankingTable;
