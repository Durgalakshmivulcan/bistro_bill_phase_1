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
  const [selectedItem, setSelectedItem] = useState("all");
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTopProducts(startDate, endDate, branchId, 12);
      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        setError(response.error?.message || "Failed to fetch product data");
      }
    } catch {
      setError("An error occurred while fetching product data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [startDate, endDate, branchId]);

  const filteredProducts = products.filter((item) =>
    selectedItem === "all" ? true : item.productId === selectedItem
  );

  const displayedProducts = [...filteredProducts].sort((a, b) => {
    if (tab === "Top Selling Items") return b.revenue - a.revenue;
    return a.revenue - b.revenue;
  });

  const totalRevenue = filteredProducts.reduce((sum, product) => sum + product.revenue, 0);

  const itemOptions = [
    { label: "Filter by Item", value: "all" },
    ...products.map((product) => ({ label: product.productName, value: product.productId })),
  ];

  return (
    <TableCard
      title="Product Ranking"
      filterLabel="Filter by Item"
      filterValue={selectedItem}
      filterOptions={itemOptions}
      onFilterChange={setSelectedItem}
    >
      <TableTabs
        active={tab}
        tabs={["Top Selling Items", "Least Selling Items"]}
        onChange={setTab}
      />

      {loading && <TableSkeleton rows={6} />}

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

      {!loading && !error && displayedProducts.length === 0 && (
        <div className="text-center py-12 text-bb-textSoft">
          <p>No product data available for the selected period</p>
        </div>
      )}

      {!loading && !error && displayedProducts.length > 0 && (
        <table className="w-full text-sm rounded-md overflow-hidden border border-[#E5E7EB]">
          <thead className="bg-[#F5C628] text-black">
            <tr>
              <th className="px-3 py-2 text-left text-[12px] font-medium">Item Name</th>
              <th className="px-3 py-2 text-center text-[12px] font-medium">Sales Qty</th>
              <th className="px-3 py-2 text-center text-[12px] font-medium">% Revenue</th>
              <th className="px-3 py-2 text-right text-[12px] font-medium">Total Revenue</th>
            </tr>
          </thead>

          <tbody>
            {displayedProducts.map((product, index) => {
              const percentRevenue = totalRevenue > 0
                ? ((product.revenue / totalRevenue) * 100).toFixed(1)
                : "0";

              return (
                <tr
                  key={product.productId}
                  className={`${index % 2 === 0 ? "bg-[#F7F7F7]" : "bg-[#F6F0E1]"} border-t border-[#E5E7EB]`}
                >
                  <td className="px-3 py-2 text-[12px] text-[#374151]">{product.productName}</td>
                  <td className="px-3 py-2 text-center text-[12px] text-[#374151]">{product.salesCount}</td>
                  <td className="px-3 py-2 text-center text-[12px] text-[#374151]">{percentRevenue}%</td>
                  <td className="px-3 py-2 text-right text-[12px] text-[#374151]">{"\u20B9"} {product.revenue.toLocaleString("en-IN")}</td>
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
