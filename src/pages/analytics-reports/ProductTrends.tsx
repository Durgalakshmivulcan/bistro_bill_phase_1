import { useEffect, useState } from 'react';
import {
  getProductTrends,
  type ProductTrendsResponse,
  type ProductTrend,
} from '../../services/reportsService';

const DAYS_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

const Sparkline = ({ data }: { data: number[] }) => {
  const max = Math.max(...data, 1);
  const width = 120;
  const height = 32;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  });
  const polyline = points.join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={polyline}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const TrendBadge = ({ trend, growth }: { trend: string; growth: number }) => {
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        ↑ {growth}%
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        ↓ {Math.abs(growth)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
      → {growth}%
    </span>
  );
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const ProductTrendsPage = () => {
  const [data, setData] = useState<ProductTrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getProductTrends(undefined, days);
        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError('Failed to load product trends');
        }
      } catch (err) {
        setError('An error occurred while loading product trends');
        console.error('Product trends error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  const filterByCategory = (products: ProductTrend[]): ProductTrend[] => {
    if (!categoryFilter) return products;
    return products.filter(
      (p) =>
        p.categoryName &&
        p.categoryName.toLowerCase().includes(categoryFilter.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-bb-text mb-6">Product Performance Trends</h2>
        <div className="animate-pulse space-y-4">
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded w-32" />
            <div className="h-10 bg-gray-200 rounded w-48" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="h-20 bg-gray-200 rounded-lg" />
          </div>
          <div className="h-64 bg-gray-200 rounded-lg" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-bb-text mb-6">Product Performance Trends</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-bb-text mb-6">Product Performance Trends</h2>
        <p className="text-bb-textSoft">No product trend data available.</p>
      </div>
    );
  }

  const { summary } = data;
  const trendingUp = filterByCategory(data.trendingUp);
  const trendingDown = filterByCategory(data.trendingDown);

  const renderProductRow = (product: ProductTrend, isTrendingUp: boolean) => (
    <tr key={product.productId} className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-bb-text">{product.productName}</p>
          {product.categoryName && (
            <p className="text-xs text-bb-textSoft">{product.categoryName}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <TrendBadge trend={product.trend} growth={product.growthPercent} />
      </td>
      <td className="px-4 py-3 text-sm text-bb-text">
        <div className="space-y-0.5">
          <div className="text-xs text-bb-textSoft">7d: {product.velocity7d}/day</div>
          <div className="text-xs text-bb-textSoft">30d: {product.velocity30d}/day</div>
          <div className="text-xs text-bb-textSoft">90d: {product.velocity90d}/day</div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-bb-text">
        {formatCurrency(product.totalRevenue)}
      </td>
      <td className="px-4 py-3">
        <span className={isTrendingUp ? 'text-green-600' : 'text-red-500'}>
          <Sparkline data={product.sparkline} />
        </span>
      </td>
      <td className="px-4 py-3">
        {isTrendingUp ? (
          <button className="text-xs px-3 py-1 rounded-md bg-bb-primary text-bb-text font-medium hover:opacity-80">
            Add to Featured
          </button>
        ) : (
          <button className="text-xs px-3 py-1 rounded-md bg-red-100 text-red-700 font-medium hover:bg-red-200">
            Review for Removal
          </button>
        )}
      </td>
    </tr>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-bb-text">Product Performance Trends</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs text-bb-textSoft mb-1">Time Range</label>
          <div className="flex gap-1">
            {DAYS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-2 text-sm rounded-lg border ${
                  days === opt.value
                    ? 'bg-bb-primary border-bb-primary text-bb-text font-medium'
                    : 'border-gray-300 text-bb-textSoft hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-bb-textSoft mb-1">Filter by Category</label>
          <input
            type="text"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="All Categories"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Products Analyzed</p>
          <p className="text-2xl font-bold text-bb-text">{summary.totalProductsAnalyzed}</p>
        </div>
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Trending Up</p>
          <p className="text-2xl font-bold text-green-600">{summary.trendingUpCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Stable</p>
          <p className="text-2xl font-bold text-gray-600">{summary.stableCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Trending Down</p>
          <p className="text-2xl font-bold text-red-600">{summary.trendingDownCount}</p>
        </div>
      </div>

      {/* Trending Up Section */}
      <div className="bg-white rounded-lg shadow-bb-card mb-6">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-green-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Trending Up
          </h3>
          {summary.topGrower && (
            <p className="text-xs text-bb-textSoft mt-1">
              Top grower: {summary.topGrower}
            </p>
          )}
        </div>
        {trendingUp.length === 0 ? (
          <div className="p-6 text-center text-bb-textSoft text-sm">
            No products trending up in this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-bb-textSoft">Product</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-bb-textSoft">Growth</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-bb-textSoft">Daily Velocity</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-bb-textSoft">Revenue</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-bb-textSoft">30-Day Trend</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-bb-textSoft">Action</th>
                </tr>
              </thead>
              <tbody>
                {trendingUp.map((p) => renderProductRow(p, true))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trending Down Section */}
      <div className="bg-white rounded-lg shadow-bb-card mb-6">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-red-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Trending Down
          </h3>
          {summary.topDecliner && (
            <p className="text-xs text-bb-textSoft mt-1">
              Top decliner: {summary.topDecliner}
            </p>
          )}
        </div>
        {trendingDown.length === 0 ? (
          <div className="p-6 text-center text-bb-textSoft text-sm">
            No products trending down in this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-bb-textSoft">Product</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-bb-textSoft">Decline</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-bb-textSoft">Daily Velocity</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-bb-textSoft">Revenue</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-bb-textSoft">30-Day Trend</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-bb-textSoft">Action</th>
                </tr>
              </thead>
              <tbody>
                {trendingDown.map((p) => renderProductRow(p, false))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Model Info */}
      <div className="text-xs text-bb-textSoft">
        <p>
          Analysis based on {data.modelInfo.dataPointsUsed} data points using{' '}
          {data.modelInfo.method} over {data.modelInfo.periodDays} days.
        </p>
      </div>
    </div>
  );
};

export default ProductTrendsPage;
