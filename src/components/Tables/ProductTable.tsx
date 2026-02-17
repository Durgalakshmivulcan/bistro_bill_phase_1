import { useState, useEffect } from "react";
import TableCard from "./TableCard";
import TableTabs from "../Common/TableTabs";
import { TableSkeleton } from "../Common/SkeletonLoader";
import { ErrorDisplay } from "../Common/ErrorDisplay";
import { getTopProducts, TopProduct } from "../../services/dashboardService";

interface ProductRankingTableProps {
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

const ProductRankingTable = ({ startDate, endDate, branchId }: ProductRankingTableProps) => {
  const [tab, setTab] = useState("Top Selling Items");
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTopProducts(
        startDate,
        endDate,
        branchId,
        5 // limit to top 5
      );
      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        setError(response.error?.message || "Failed to fetch product data");
      }
    } catch (err) {
      setError("An error occurred while fetching product data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [startDate, endDate, branchId]);

  // Sort products based on selected tab
  const displayedProducts = [...products].sort((a, b) => {
    if (tab === "Top Selling Items") {
      return b.revenue - a.revenue; // DESC
    } else {
      return a.revenue - b.revenue; // ASC
    }
  });

  // Calculate total revenue for percentage calculation
  const totalRevenue = products.reduce((sum, product) => sum + product.revenue, 0);

  return (
    <TableCard title="Product Ranking" filterLabel="Filter by Item">
      <TableTabs
        active={tab}
        tabs={["Top Selling Items", "Least Selling Items"]}
        onChange={setTab}
      />

      {/* Loading State - Skeleton */}
      {loading && <TableSkeleton rows={5} />}

      {/* Error State */}
      {!loading && error && (
        <div className="p-4">
          <ErrorDisplay
            message={error}
            onRetry={fetchProducts}
            variant="card"
            size="small"
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && displayedProducts.length === 0 && (
        <div className="text-center py-12 text-bb-textSoft">
          <p>No product data available for the selected period</p>
        </div>
      )}

      {/* Data Table */}
      {!loading && !error && displayedProducts.length > 0 && (
        <table className="w-full text-sm rounded-lg overflow-hidden">
          <thead className="bg-bb-primary text-black">
            <tr>
              <th className="px-3 py-2 text-left">Item Name</th>
              <th className="px-3 py-2 text-center">Sales Qty</th>
              <th className="px-3 py-2 text-center">% Revenue</th>
              <th className="px-3 py-2 text-right">Total Revenue</th>
            </tr>
          </thead>

          <tbody>
            {displayedProducts.map((product) => {
              const percentRevenue = totalRevenue > 0
                ? ((product.revenue / totalRevenue) * 100).toFixed(1)
                : "0";

              return (
                <tr key={product.productId}>
                  <td className="px-3 py-2">{product.productName}</td>
                  <td className="px-3 py-2 text-center">{product.salesCount}</td>
                  <td className="px-3 py-2 text-center">{percentRevenue}%</td>
                  <td className="px-3 py-2 text-right">
                    ₹ {product.revenue.toLocaleString("en-IN")}
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

export default ProductRankingTable;
