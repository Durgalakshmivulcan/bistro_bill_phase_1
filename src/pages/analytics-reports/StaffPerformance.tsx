import { useEffect, useState } from 'react';
import {
  getStaffPerformanceAnalytics,
  type StaffPerformanceAnalyticsResponse,
  type StaffMetrics,
} from '../../services/reportsService';

const StaffPerformance = () => {
  const [data, setData] = useState<StaffPerformanceAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [branchId, setBranchId] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffMetrics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getStaffPerformanceAnalytics(
          startDate,
          endDate,
          branchId || undefined
        );
        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError('Failed to load staff performance data');
        }
      } catch (err) {
        setError('An error occurred while loading staff performance');
        console.error('Staff performance error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, branchId]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTrendIcon = (change: number): string => {
    if (change > 0) return '\u2191';
    if (change < 0) return '\u2193';
    return '\u2192';
  };

  const getTrendColor = (change: number): string => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getRankBadge = (index: number): string => {
    if (index === 0) return 'bg-yellow-400 text-yellow-900';
    if (index === 1) return 'bg-gray-300 text-gray-800';
    if (index === 2) return 'bg-amber-600 text-white';
    return 'bg-gray-100 text-gray-600';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-bb-text mb-6">Staff Performance Analytics</h2>
        <div className="animate-pulse space-y-4">
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded w-40" />
            <div className="h-10 bg-gray-200 rounded w-40" />
            <div className="h-10 bg-gray-200 rounded w-40" />
          </div>
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
        <h2 className="text-xl font-semibold text-bb-text mb-6">Staff Performance Analytics</h2>
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
        <h2 className="text-xl font-semibold text-bb-text mb-6">Staff Performance Analytics</h2>
        <p className="text-bb-textSoft">No staff performance data available.</p>
      </div>
    );
  }

  const { leaderboard, summary } = data;
  const top10 = leaderboard.slice(0, 10);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-bb-text">Staff Performance Analytics</h2>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Total Staff</p>
          <p className="text-2xl font-bold text-bb-text">{summary.totalStaff}</p>
        </div>
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Total Orders</p>
          <p className="text-2xl font-bold text-bb-text">{summary.totalOrders.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Total Revenue</p>
          <p className="text-2xl font-bold text-bb-text">{formatCurrency(summary.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Avg Orders/Staff</p>
          <p className="text-2xl font-bold text-bb-text">{summary.avgOrdersPerStaff}</p>
        </div>
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Top Performer</p>
          <p className="text-lg font-bold text-green-600 truncate">{summary.topPerformer || 'N/A'}</p>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg shadow-bb-card overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-bb-text">Top 10 Leaderboard</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-bb-textSoft">Rank</th>
                <th className="text-left px-4 py-3 font-medium text-bb-textSoft">Staff</th>
                <th className="text-right px-4 py-3 font-medium text-bb-textSoft">Orders</th>
                <th className="text-right px-4 py-3 font-medium text-bb-textSoft">Revenue</th>
                <th className="text-right px-4 py-3 font-medium text-bb-textSoft">Avg Order</th>
                <th className="text-right px-4 py-3 font-medium text-bb-textSoft">Rating</th>
                <th className="text-right px-4 py-3 font-medium text-bb-textSoft">Efficiency</th>
                <th className="text-right px-4 py-3 font-medium text-bb-textSoft">Score</th>
                <th className="text-center px-4 py-3 font-medium text-bb-textSoft">Trends</th>
                <th className="text-center px-4 py-3 font-medium text-bb-textSoft">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {top10.map((staff, index) => (
                <tr
                  key={staff.staffId}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getRankBadge(index)}`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-bb-text">{staff.name}</p>
                      <p className="text-xs text-bb-textSoft">
                        {staff.role} - {staff.branch}
                      </p>
                    </div>
                  </td>
                  <td className="text-right px-4 py-3 font-medium">
                    {staff.ordersProcessed}
                    <span className={`ml-1 text-xs ${getTrendColor(staff.trend.ordersChange)}`}>
                      {getTrendIcon(staff.trend.ordersChange)}
                    </span>
                  </td>
                  <td className="text-right px-4 py-3 font-medium">
                    {formatCurrency(staff.totalRevenue)}
                    <span className={`ml-1 text-xs ${getTrendColor(staff.trend.revenueChange)}`}>
                      {getTrendIcon(staff.trend.revenueChange)}
                    </span>
                  </td>
                  <td className="text-right px-4 py-3">
                    {formatCurrency(staff.avgOrderValue)}
                    <span className={`ml-1 text-xs ${getTrendColor(staff.trend.avgOrderValueChange)}`}>
                      {getTrendIcon(staff.trend.avgOrderValueChange)}
                    </span>
                  </td>
                  <td className="text-right px-4 py-3">
                    <span className="text-yellow-500">{'*'.repeat(Math.round(staff.customerRating))}</span>
                    <span className="ml-1 text-xs text-bb-textSoft">{staff.customerRating.toFixed(1)}</span>
                  </td>
                  <td className="text-right px-4 py-3">
                    <span className={getScoreColor(staff.efficiencyScore)}>
                      {staff.efficiencyScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="text-right px-4 py-3">
                    <span className={`font-bold ${getScoreColor(staff.compositeScore)}`}>
                      {staff.compositeScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="text-center px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <span className={`text-xs ${getTrendColor(staff.trend.ordersChange)}`}>
                        {staff.trend.ordersChange > 0 ? '+' : ''}{staff.trend.ordersChange.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="text-center px-4 py-3">
                    <button
                      onClick={() => setSelectedStaff(staff)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {top10.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-bb-textSoft">
                    No staff performance data for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Detail Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-bb-text">{selectedStaff.name}</h3>
              <button
                onClick={() => setSelectedStaff(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                x
              </button>
            </div>

            <div className="text-sm text-bb-textSoft mb-4">
              {selectedStaff.role} - {selectedStaff.branch}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-bb-textSoft">Orders Processed</p>
                <p className="text-lg font-bold text-bb-text">{selectedStaff.ordersProcessed}</p>
                <p className={`text-xs ${getTrendColor(selectedStaff.trend.ordersChange)}`}>
                  {getTrendIcon(selectedStaff.trend.ordersChange)} {selectedStaff.trend.ordersChange.toFixed(1)}% vs prev period
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-bb-textSoft">Total Revenue</p>
                <p className="text-lg font-bold text-bb-text">{formatCurrency(selectedStaff.totalRevenue)}</p>
                <p className={`text-xs ${getTrendColor(selectedStaff.trend.revenueChange)}`}>
                  {getTrendIcon(selectedStaff.trend.revenueChange)} {selectedStaff.trend.revenueChange.toFixed(1)}% vs prev period
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-bb-textSoft">Avg Order Value</p>
                <p className="text-lg font-bold text-bb-text">{formatCurrency(selectedStaff.avgOrderValue)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-bb-textSoft">Customer Rating</p>
                <p className="text-lg font-bold text-yellow-600">{selectedStaff.customerRating.toFixed(1)} / 5.0</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-bb-textSoft">Avg Completion Time</p>
                <p className="text-lg font-bold text-bb-text">{selectedStaff.avgCompletionTimeMinutes} min</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-bb-textSoft">Orders/Hour</p>
                <p className="text-lg font-bold text-bb-text">{selectedStaff.ordersPerHour}</p>
              </div>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-blue-600">Efficiency Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(selectedStaff.efficiencyScore)}`}>
                  {selectedStaff.efficiencyScore.toFixed(1)}
                </p>
              </div>
              <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-green-600">Composite Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(selectedStaff.compositeScore)}`}>
                  {selectedStaff.compositeScore.toFixed(1)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedStaff(null)}
              className="w-full bg-bb-primary text-bb-text font-medium py-2 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Model Info */}
      <div className="text-xs text-bb-textSoft">
        <p>
          Analysis based on {data.modelInfo.dataPointsUsed} orders over{' '}
          {data.modelInfo.periodDays} days using {data.modelInfo.method}.
        </p>
      </div>
    </div>
  );
};

export default StaffPerformance;
