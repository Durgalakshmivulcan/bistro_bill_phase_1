import { useEffect, useState } from 'react';
import {
  getMenuEngineering,
  type MenuEngineeringResponse,
  type MenuEngineeringItem,
  type MenuQuadrant,
} from '../../services/reportsService';

const QUADRANT_COLORS: Record<MenuQuadrant, { bg: string; border: string; text: string; dot: string }> = {
  Star: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: '#22c55e' },
  Plow: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: '#3b82f6' },
  Puzzle: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dot: '#eab308' },
  Dog: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: '#ef4444' },
};

const QUADRANT_LABELS: Record<MenuQuadrant, string> = {
  Star: 'Stars',
  Plow: 'Plow Horses',
  Puzzle: 'Puzzles',
  Dog: 'Dogs',
};

const MenuEngineering = () => {
  const [data, setData] = useState<MenuEngineeringResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branchId, setBranchId] = useState('');
  const [hoveredItem, setHoveredItem] = useState<MenuEngineeringItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getMenuEngineering(branchId || undefined);
        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError('Failed to load menu engineering data');
        }
      } catch (err) {
        setError('An error occurred while loading menu engineering data');
        console.error('Menu engineering error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-bb-text mb-6">Menu Engineering Matrix</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-40" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-bb-text mb-6">Menu Engineering Matrix</h2>
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

  if (!data || data.items.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-bb-text mb-6">Menu Engineering Matrix</h2>
        <p className="text-bb-textSoft">No menu engineering data available.</p>
      </div>
    );
  }

  const { items, summary } = data;

  // Calculate scatter plot positions
  const maxPopularity = Math.max(...items.map(i => i.popularityScore));
  const maxProfitability = Math.max(...items.map(i => i.profitabilityScore));
  const maxRevenue = Math.max(...items.map(i => i.totalRevenue));
  const plotWidth = 100; // percentage
  const plotHeight = 100;

  const getX = (item: MenuEngineeringItem) =>
    maxPopularity > 0 ? (item.popularityScore / (maxPopularity * 1.1)) * plotWidth : 50;
  const getY = (item: MenuEngineeringItem) =>
    maxProfitability > 0 ? plotHeight - (item.profitabilityScore / (maxProfitability * 1.1)) * plotHeight : 50;
  const getBubbleSize = (item: MenuEngineeringItem) => {
    const minSize = 8;
    const maxSize = 28;
    return maxRevenue > 0
      ? minSize + (item.totalRevenue / maxRevenue) * (maxSize - minSize)
      : 14;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-bb-text">Menu Engineering Matrix</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs text-bb-textSoft mb-1">Branch</label>
          <input
            type="text"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            placeholder="All Branches"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {(['Star', 'Plow', 'Puzzle', 'Dog'] as MenuQuadrant[]).map((q) => {
          const colors = QUADRANT_COLORS[q];
          const count = q === 'Star' ? summary.stars : q === 'Plow' ? summary.plows : q === 'Puzzle' ? summary.puzzles : summary.dogs;
          return (
            <div key={q} className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
              <p className={`text-sm font-medium ${colors.text}`}>{QUADRANT_LABELS[q]}</p>
              <p className={`text-2xl font-bold ${colors.text}`}>{count}</p>
              <p className="text-xs text-bb-textSoft mt-1">
                {summary.totalProductsAnalyzed > 0
                  ? Math.round((count / summary.totalProductsAnalyzed) * 100)
                  : 0}% of menu
              </p>
            </div>
          );
        })}
      </div>

      {/* 2x2 Scatter Plot */}
      <div className="bg-white rounded-lg shadow-bb-card p-6 mb-6">
        <h3 className="text-base font-semibold text-bb-text mb-4">Menu Matrix (Bubble size = Revenue)</h3>
        <div className="relative" style={{ paddingBottom: '60%' }}>
          <div className="absolute inset-0">
            {/* Y-axis label */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', left: '12px', fontSize: '12px' }}
            >
              <span className="text-bb-textSoft">Profitability &rarr;</span>
            </div>

            {/* X-axis label */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-bb-textSoft" style={{ bottom: '-20px' }}>
              Popularity &rarr;
            </div>

            {/* Quadrant backgrounds */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="none">
              {/* Puzzle (top-left) */}
              <rect x="0" y="0" width="100" height="100" fill="#fefce8" opacity="0.4" />
              {/* Star (top-right) */}
              <rect x="100" y="0" width="100" height="100" fill="#f0fdf4" opacity="0.4" />
              {/* Dog (bottom-left) */}
              <rect x="0" y="100" width="100" height="100" fill="#fef2f2" opacity="0.4" />
              {/* Plow (bottom-right) */}
              <rect x="100" y="100" width="100" height="100" fill="#eff6ff" opacity="0.4" />

              {/* Grid lines */}
              <line x1="100" y1="0" x2="100" y2="200" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4" />
              <line x1="0" y1="100" x2="200" y2="100" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4" />

              {/* Border */}
              <rect x="0" y="0" width="200" height="200" fill="none" stroke="#d1d5db" strokeWidth="0.5" />

              {/* Quadrant labels */}
              <text x="50" y="15" textAnchor="middle" fontSize="7" fill="#a16207" fontWeight="600">Puzzle</text>
              <text x="150" y="15" textAnchor="middle" fontSize="7" fill="#15803d" fontWeight="600">Star</text>
              <text x="50" y="195" textAnchor="middle" fontSize="7" fill="#dc2626" fontWeight="600">Dog</text>
              <text x="150" y="195" textAnchor="middle" fontSize="7" fill="#2563eb" fontWeight="600">Plow Horse</text>

              {/* Data points */}
              {items.map((item) => {
                const cx = (getX(item) / 100) * 200;
                const cy = (getY(item) / 100) * 200;
                const r = getBubbleSize(item) / 4;
                const color = QUADRANT_COLORS[item.quadrant].dot;
                return (
                  <circle
                    key={item.productId}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={color}
                    fillOpacity="0.6"
                    stroke={color}
                    strokeWidth="0.5"
                    className="cursor-pointer transition-all hover:fill-opacity-90"
                    onMouseEnter={(e) => {
                      const rect = (e.target as SVGElement).closest('svg')!.getBoundingClientRect();
                      setHoveredItem(item);
                      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onMouseLeave={() => setHoveredItem(null)}
                  />
                );
              })}
            </svg>

            {/* Tooltip */}
            {hoveredItem && (
              <div
                className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 pointer-events-none"
                style={{
                  left: `${tooltipPos.x + 10}px`,
                  top: `${tooltipPos.y - 10}px`,
                  minWidth: '180px',
                }}
              >
                <p className="font-semibold text-sm text-bb-text">{hoveredItem.productName}</p>
                {hoveredItem.categoryName && (
                  <p className="text-xs text-bb-textSoft">{hoveredItem.categoryName}</p>
                )}
                <div className="mt-1 text-xs space-y-0.5">
                  <p>Sold: <span className="font-medium">{hoveredItem.quantitySold} units</span></p>
                  <p>Revenue: <span className="font-medium">{formatCurrency(hoveredItem.totalRevenue)}</span></p>
                  <p>Margin: <span className="font-medium">{hoveredItem.profitMargin}%</span></p>
                  <p className={`font-medium ${QUADRANT_COLORS[hoveredItem.quadrant].text}`}>
                    {hoveredItem.quadrant}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations by Quadrant */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {(['Star', 'Plow', 'Puzzle', 'Dog'] as MenuQuadrant[]).map((quadrant) => {
          const quadrantItems = items.filter(i => i.quadrant === quadrant);
          if (quadrantItems.length === 0) return null;
          const colors = QUADRANT_COLORS[quadrant];
          return (
            <div key={quadrant} className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
              <h4 className={`font-semibold text-sm ${colors.text} mb-2`}>
                {QUADRANT_LABELS[quadrant]} ({quadrantItems.length})
              </h4>
              <p className="text-xs text-bb-textSoft mb-3">{quadrantItems[0].recommendation}</p>
              <div className="space-y-2">
                {quadrantItems.slice(0, 5).map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-bb-text">{item.productName}</span>
                      {item.categoryName && (
                        <span className="text-xs text-bb-textSoft ml-1">({item.categoryName})</span>
                      )}
                    </div>
                    <div className="text-right text-xs text-bb-textSoft">
                      {item.quantitySold} sold | {item.profitMargin}% margin
                    </div>
                  </div>
                ))}
                {quadrantItems.length > 5 && (
                  <p className="text-xs text-bb-textSoft">+{quadrantItems.length - 5} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Model Info */}
      <div className="text-xs text-bb-textSoft">
        <p>
          Analysis based on {data.modelInfo.dataPointsUsed} order items over{' '}
          {data.modelInfo.periodDays} days using {data.modelInfo.method}.
          Avg popularity threshold: {summary.avgPopularity} orders | Avg profit margin: {summary.avgProfitMargin}%.
        </p>
      </div>
    </div>
  );
};

export default MenuEngineering;
