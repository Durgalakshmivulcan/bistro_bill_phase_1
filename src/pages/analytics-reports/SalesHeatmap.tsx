import { useEffect, useState } from 'react';
import {
  getSalesHeatmap,
  type SalesHeatmapResponse,
  type HeatmapCell,
} from '../../services/reportsService';

const SalesHeatmap = () => {
  const [data, setData] = useState<SalesHeatmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [branchId, setBranchId] = useState('');
  const [hoveredCell, setHoveredCell] = useState<{
    day: string;
    hour: string;
    orderCount: number;
    revenue: number;
    avgOrderValue: number;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getSalesHeatmap(
          branchId || undefined,
          startDate,
          endDate
        );
        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError('Failed to load sales heatmap');
        }
      } catch (err) {
        setError('An error occurred while loading sales heatmap');
        console.error('Sales heatmap error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, branchId]);

  const getCellColor = (cell: HeatmapCell): string => {
    if (cell.orderCount === 0) return 'bg-gray-50';
    const p = cell.percentile;
    if (p >= 90) return 'bg-red-600 text-white';
    if (p >= 75) return 'bg-red-500 text-white';
    if (p >= 60) return 'bg-orange-400 text-white';
    if (p >= 45) return 'bg-orange-300 text-orange-900';
    if (p >= 30) return 'bg-yellow-200 text-yellow-900';
    if (p >= 15) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

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
        <h2 className="text-xl font-semibold text-bb-text mb-6">Sales Heatmap</h2>
        <div className="animate-pulse space-y-4">
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded w-40" />
            <div className="h-10 bg-gray-200 rounded w-40" />
            <div className="h-10 bg-gray-200 rounded w-40" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="h-20 bg-gray-200 rounded-lg" />
          </div>
          <div className="h-80 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-bb-text mb-6">Sales Heatmap</h2>
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
        <h2 className="text-xl font-semibold text-bb-text mb-6">Sales Heatmap</h2>
        <p className="text-bb-textSoft">No sales data available.</p>
      </div>
    );
  }

  const { heatmap, dayLabels, hourLabels, summary } = data;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-bb-text">Sales Heatmap</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs text-bb-textSoft mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-bb-textSoft mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Total Orders</p>
          <p className="text-2xl font-bold text-bb-text">
            {summary.totalOrders.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Total Revenue</p>
          <p className="text-2xl font-bold text-bb-text">
            {formatCurrency(summary.totalRevenue)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Peak Day</p>
          <p className="text-2xl font-bold text-red-600">{summary.peakDay}</p>
        </div>
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Peak Hour</p>
          <p className="text-2xl font-bold text-red-600">
            {hourLabels[summary.peakHour]}
          </p>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="bg-white rounded-lg shadow-bb-card overflow-hidden relative">
        {/* Tooltip */}
        {hoveredCell && (
          <div className="absolute top-2 right-4 z-10 bg-bb-text text-white text-xs rounded-lg px-3 py-2 shadow-lg">
            <div className="font-medium mb-1">
              {hoveredCell.day} at {hoveredCell.hour}
            </div>
            <div>Orders: {hoveredCell.orderCount}</div>
            <div>Revenue: {formatCurrency(hoveredCell.revenue)}</div>
            <div>Avg Order: {formatCurrency(hoveredCell.avgOrderValue)}</div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-bb-textSoft sticky left-0 bg-gray-50 min-w-[90px]">
                  Day
                </th>
                {hourLabels.map((label, i) => (
                  <th
                    key={i}
                    className="text-center px-1 py-2 font-medium text-bb-textSoft min-w-[42px]"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {heatmap.map((dayRow, dayIdx) => (
                <tr key={dayIdx}>
                  <td className="px-3 py-2 font-medium text-bb-text sticky left-0 bg-white whitespace-nowrap">
                    {dayLabels[dayIdx]}
                  </td>
                  {dayRow.map((cell, hourIdx) => (
                    <td
                      key={hourIdx}
                      className={`text-center px-1 py-2 cursor-default ${getCellColor(cell)}`}
                      onMouseEnter={() =>
                        cell.orderCount > 0 &&
                        setHoveredCell({
                          day: dayLabels[dayIdx],
                          hour: hourLabels[hourIdx],
                          orderCount: cell.orderCount,
                          revenue: cell.revenue,
                          avgOrderValue: cell.avgOrderValue,
                        })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {cell.orderCount > 0 ? cell.orderCount : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-2 text-xs text-bb-textSoft">
        <span>Low</span>
        <div className="flex gap-0.5">
          <div className="w-6 h-4 bg-gray-50 border border-gray-200 rounded-sm" />
          <div className="w-6 h-4 bg-red-100 rounded-sm" />
          <div className="w-6 h-4 bg-yellow-100 rounded-sm" />
          <div className="w-6 h-4 bg-yellow-200 rounded-sm" />
          <div className="w-6 h-4 bg-orange-300 rounded-sm" />
          <div className="w-6 h-4 bg-orange-400 rounded-sm" />
          <div className="w-6 h-4 bg-red-500 rounded-sm" />
          <div className="w-6 h-4 bg-red-600 rounded-sm" />
        </div>
        <span>High</span>
      </div>

      {/* Model Info */}
      <div className="mt-4 text-xs text-bb-textSoft">
        <p>
          Analysis based on {data.modelInfo.dataPointsUsed} orders using{' '}
          {data.modelInfo.method}.
        </p>
      </div>
    </div>
  );
};

export default SalesHeatmap;
