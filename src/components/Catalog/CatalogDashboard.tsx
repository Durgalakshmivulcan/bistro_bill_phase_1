import { useState, useEffect } from "react";
import SummaryCard from "../Cards/SummaryCard";
import ProductCard from "../Cards/ProductCard";
import Select from "../form/Select";
import { LoadingSpinner, ErrorDisplay } from "../Common";
import { getTopProducts, getLeastProducts, TopProduct } from "../../services/reportsService";
import {
  getProducts,
  getCategories,
  getAllSubCategories,
  getBrands,
  getTags,
  getMenus,
} from "../../services/catalogService";
import { handleError } from "../../utils/errorHandler";
import totalProducts from "../../assets/catalogdashboard/totalproducts.png";
import totalRegular from "../../assets/catalogdashboard/totalregularproducts.png";
import totalCombo from "../../assets/catalogdashboard/totalcomboproducts.png";
import totalRetail from "../../assets/catalogdashboard/totalretailproducts.png";
import totalCategories from "../../assets/catalogdashboard/totalcategories.png";
import totalSubcategories from "../../assets/catalogdashboard/totalsubcategories.png";
import totalBrands from "../../assets/catalogdashboard/totalbrands.png";
import totalTags from "../../assets/catalogdashboard/totaltags.png";
import totalMenus from "../../assets/catalogdashboard/totalmenu.png";

const CatalogDashboard = () => {
  const periodOptions = [
    { label: "Yesterday", value: "Yesterday" },
    { label: "Last Week", value: "Last Week" },
    { label: "Last Month", value: "Last Month" },
    { label: "Last 3 Months", value: "Last 3 Months" },
    { label: "Last 6 Months", value: "Last 6 Months" },
  ];

  const topLimitOptions = [
    { label: "Top 10 Products", value: "Top 10 Products" },
    { label: "Top 5 Products", value: "Top 5 Products" },
  ];

  const leastLimitOptions = [
    { label: "Last 10 Products", value: "Last 10 Products" },
    { label: "Last 5 Products", value: "Last 5 Products" },
  ];
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Summary data state
  const [summaryData, setSummaryData] = useState({
    totalProducts: 0,
    totalRegular: 0,
    totalCombo: 0,
    totalRetail: 0,
    totalCategories: 0,
    totalSubcategories: 0,
    totalBrands: 0,
    totalTags: 0,
    totalMenus: 0,
  });

  // Top/Least selling products state
  const [topSellingProducts, setTopSellingProducts] = useState<TopProduct[]>(
    []
  );
  const [leastSellingProducts, setLeastSellingProducts] = useState<
    TopProduct[]
  >([]);

  // Filter states
  const [topPeriod, setTopPeriod] = useState("Yesterday");
  const [topLimit, setTopLimit] = useState(10);
  const [leastPeriod, setLeastPeriod] = useState("Yesterday");
  const [leastLimit, setLeastLimit] = useState(10);

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getTopSubtitle = () => `${topPeriod}'s Top ${topLimit} Selling Products`;
  const getLeastSubtitle = () =>
    `${leastPeriod}'s Least ${leastLimit} Selling Products`;

  // Helper to get date range based on period
  const getDateRange = (period: string) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 7);

    const lastMonthStart = new Date(today);
    lastMonthStart.setDate(today.getDate() - 30);

    const lastThreeMonthsStart = new Date(today);
    lastThreeMonthsStart.setDate(today.getDate() - 90);

    const lastSixMonthsStart = new Date(today);
    lastSixMonthsStart.setDate(today.getDate() - 180);

    switch (period) {
      case "Yesterday":
        return {
          startDate: formatLocalDate(yesterday),
          endDate: formatLocalDate(yesterday),
        };
      case "Last Week":
        return {
          startDate: formatLocalDate(lastWeekStart),
          endDate: formatLocalDate(today),
        };
      case "Last Month":
        return {
          startDate: formatLocalDate(lastMonthStart),
          endDate: formatLocalDate(today),
        };
      case "Last 3 Months":
        return {
          startDate: formatLocalDate(lastThreeMonthsStart),
          endDate: formatLocalDate(today),
        };
      case "Last 6 Months":
        return {
          startDate: formatLocalDate(lastSixMonthsStart),
          endDate: formatLocalDate(today),
        };
      default:
        return {
          startDate: formatLocalDate(yesterday),
          endDate: formatLocalDate(yesterday),
        };
    }
  };

  // Load catalog summary data
  const loadSummaryData = async () => {
    try {
      const [productsRes, categoriesRes, subcategoriesRes, brandsRes, tagsRes, menusRes] =
        await Promise.all([
          getProducts({ status: "active" }),
          getCategories({ status: "active" }),
          getAllSubCategories({ status: "active" }),
          getBrands({ status: "active" }),
          getTags({ status: "active" }),
          getMenus({ status: "active" }),
        ]);

      if (
        productsRes.success &&
        productsRes.data &&
        categoriesRes.success &&
        categoriesRes.data &&
        subcategoriesRes.success &&
        subcategoriesRes.data &&
        brandsRes.success &&
        brandsRes.data &&
        tagsRes.success &&
        tagsRes.data &&
        menusRes.success &&
        menusRes.data
      ) {
        const products = productsRes.data.products;
        const regularCount = products.filter((p) => p.type === "Regular").length;
        const comboCount = products.filter((p) => p.type === "Combo").length;
        const retailCount = products.filter((p) => p.type === "Retail").length;

        setSummaryData({
          totalProducts: products.length,
          totalRegular: regularCount,
          totalCombo: comboCount,
          totalRetail: retailCount,
          totalCategories: categoriesRes.data.total,
          totalSubcategories: subcategoriesRes.data.total,
          totalBrands: brandsRes.data.total,
          totalTags: tagsRes.data.total,
          totalMenus: menusRes.data.total,
        });
      }
    } catch (err) {
      handleError(err, setError, {
        message: "Failed to load catalog summary data",
        logError: true,
      });
      throw err;
    }
  };

  // Load top selling products
  const loadTopSellingProducts = async () => {
    try {
      const { startDate, endDate } = getDateRange(topPeriod);
      const response = await getTopProducts(startDate, endDate, topLimit);

      if (response.success && response.data) {
        setTopSellingProducts(response.data.topProducts);
      }
    } catch (err) {
      handleError(err, setError, {
        message: "Failed to load top selling products",
        logError: true,
      });
      throw err;
    }
  };

  // Load least selling products
  const loadLeastSellingProducts = async () => {
    try {
      const { startDate, endDate } = getDateRange(leastPeriod);
      const response = await getLeastProducts(
        startDate,
        endDate,
        leastLimit
      );

      if (response.success && response.data) {
        setLeastSellingProducts(response.data.leastProducts);
      } else {
        throw new Error(response.error?.message || "Failed to fetch least selling products");
      }
    } catch (err) {
      handleError(err, setError, {
        message: "Failed to load least selling products",
        logError: true,
      });
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          loadSummaryData(),
          loadTopSellingProducts(),
          loadLeastSellingProducts(),
        ]);
      } catch (err) {
        handleError(err, setError, {
          message: "Failed to load catalog data",
          logError: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Reload top selling when filters change
  useEffect(() => {
    if (!loading) {
      loadTopSellingProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topPeriod, topLimit]);

  // Reload least selling when filters change
  useEffect(() => {
    if (!loading) {
      loadLeastSellingProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leastPeriod, leastLimit]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bb-bg">
        <LoadingSpinner size="lg" message="Loading catalog dashboard..." />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bb-bg p-6">
        <ErrorDisplay
          message={error}
          title="Error Loading Dashboard"
          onRetry={() => window.location.reload()}
          size="large"
          variant="card"
          className="max-w-md"
        />
      </div>
    );
  }

  // Build summary cards from API data
  const summaryCards = [
    {
      title: "Total Products",
      value: summaryData.totalProducts,
      icon: totalProducts,
    },
    {
      title: "Total Regular Products",
      value: summaryData.totalRegular,
      icon: totalRegular,
    },
    {
      title: "Total Combo Products",
      value: summaryData.totalCombo,
      icon: totalCombo,
    },
    {
      title: "Total Retail Products",
      value: summaryData.totalRetail,
      icon: totalRetail,
    },
    {
      title: "Total Categories",
      value: summaryData.totalCategories,
      icon: totalCategories,
    },
    {
      title: "Total Sub-Categories",
      value: summaryData.totalSubcategories,
      icon: totalSubcategories,
    },
    {
      title: "Total Menu",
      value: summaryData.totalMenus,
      icon: totalMenus,
    },
    {
      title: "Total Brands",
      value: summaryData.totalBrands,
      icon: totalBrands,
    },
    {
      title: "Total Tags",
      value: summaryData.totalTags,
      icon: totalTags,
    },
  ];

  return (
    <div className="p-6 bg-bb-bg min-h-screen space-y-6">
      {/* ================= SUMMARY ================= */}
      <section className="border border-bb-border rounded-xl p-4 bg-[#FFF9ED]">
        <h2 className="text-sm font-semibold mb-4 text-bb-warning">
          Summary
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
            />
          ))}
        </div>
      </section>

      {/* ================= TOP SELLING ================= */}
      <section className="border border-bb-border rounded-xl p-4 bg-[#FFF9ED]">
        <div className="flex justify-between items-center mb-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-bb-warning">
              Top Selling Products
            </h2>

            <h5 className="text-xs text-gray-600 mt-1">
              {getTopSubtitle()}
            </h5>
          </div>

          <div className="flex gap-2 flex-wrap">
            <div className="w-[140px]">
              <Select
                value={topPeriod}
                onChange={setTopPeriod}
                options={periodOptions}
              />
            </div>

            <div className="w-[160px]">
              <Select
                value={topLimit === 10 ? "Top 10 Products" : "Top 5 Products"}
                onChange={(value: string) =>
                  setTopLimit(value === "Top 10 Products" ? 10 : 5)
                }
                options={topLimitOptions}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topSellingProducts.length > 0 ? (
            topSellingProducts.map((item, index) => (
              <ProductCard
                key={`top-${item.product.id}`}
                id={index}
                name={item.product.name}
                price={item.quantitySold > 0 ? item.revenue / item.quantitySold : 0}
                image={item.product.imageUrl || "/images/placeholder-product.jpg"}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-bb-textSoft">
              No top selling products found for the selected period.
            </div>
          )}
        </div>
      </section>

      {/* ================= LEAST SELLING ================= */}
      <section className="border border-bb-border rounded-xl p-4 bg-[#FFF9ED]">
        <div className="flex justify-between items-center mb-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-bb-warning">
              Least Selling Products
            </h2>

            <h5 className="text-xs text-gray-600 mt-1">
              {getLeastSubtitle()}
            </h5>
          </div>

          <div className="flex gap-2 flex-wrap">
            <div className="w-[140px]">
              <Select
                value={leastPeriod}
                onChange={setLeastPeriod}
                options={periodOptions}
              />
            </div>

            <div className="w-[160px]">
              <Select
                value={
                  leastLimit === 10 ? "Last 10 Products" : "Last 5 Products"
                }
                onChange={(value: string) =>
                  setLeastLimit(value === "Last 10 Products" ? 10 : 5)
                }
                options={leastLimitOptions}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {leastSellingProducts.length > 0 ? (
            leastSellingProducts.map((item, index) => (
              <ProductCard
                key={`least-${item.product.id}`}
                id={index}
                name={item.product.name}
                price={item.quantitySold > 0 ? item.revenue / item.quantitySold : 0}
                image={item.product.imageUrl || "/images/placeholder-product.jpg"}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-bb-textSoft">
              <p className="mb-2">No products sold in this period.</p>
              <p className="text-sm">
                Try selecting a different date range to see least selling products.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CatalogDashboard;

