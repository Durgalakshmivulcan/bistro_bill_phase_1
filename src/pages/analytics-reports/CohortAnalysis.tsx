import { useEffect, useState } from 'react';
import {
  getCohortAnalysis,
  type CohortAnalysisResponse,
  type CohortSegment,
} from '../../services/reportsService';

const CohortAnalysis = () => {
  const [data, setData] = useState<CohortAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 11);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [hoveredCell, setHoveredCell] = useState<{
    cohort: string;
    month: number;
    retention: number;
    absolute: number;
    cohortSize: number;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getCohortAnalysis(startDate, endDate);
        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError('Failed to load cohort analysis');
        }
      } catch (err) {
        setError('An error occurred while loading cohort analysis');
        console.error('Cohort analysis error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  const getRetentionColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-600 text-white';
    if (percentage >= 60) return 'bg-green-500 text-white';
    if (percentage >= 40) return 'bg-green-400 text-white';
    if (percentage >= 25) return 'bg-green-300 text-green-900';
    if (percentage >= 15) return 'bg-yellow-200 text-yellow-900';
    if (percentage >= 5) return 'bg-orange-200 text-orange-900';
    if (percentage > 0) return 'bg-red-200 text-red-900';
    return 'bg-gray-100 text-gray-400';
  };

  const formatMonth = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-bb-text mb-6">Customer Cohort Analysis</h2>
        <div className="animate-pulse space-y-4">
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded w-40" />
            <div className="h-10 bg-gray-200 rounded w-40" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="h-20 bg-gray-200 rounded-lg" />
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-bb-text mb-6">Customer Cohort Analysis</h2>
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

  if (!data || data.cohorts.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-bb-text mb-6">Customer Cohort Analysis</h2>
        <div className="flex gap-4 mb-6">
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
        </div>
        <p className="text-bb-textSoft">No customer data found for the selected date range.</p>
      </div>
    );
  }

  const { cohorts, summary } = data;

  // Determine max columns needed
  const maxCols = Math.max(...cohorts.map((c) => c.retention.length));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-bb-text">Customer Cohort Analysis</h2>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-4 mb-6">
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Total Customers</p>
          <p className="text-2xl font-bold text-bb-text">{summary.totalCustomers}</p>
        </div>
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Avg Retention (Month 1)</p>
          <p className="text-2xl font-bold text-bb-text">{summary.averageRetentionMonth1}%</p>
        </div>
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Avg Retention (Month 3)</p>
          <p className="text-2xl font-bold text-bb-text">{summary.averageRetentionMonth3}%</p>
        </div>
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Best Cohort</p>
          <p className="text-2xl font-bold text-green-600">
            {summary.bestCohort ? formatMonth(summary.bestCohort) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Cohort Heatmap */}
      <div className="bg-white rounded-lg shadow-bb-card overflow-hidden relative">
        {/* Tooltip */}
        {hoveredCell && (
          <div className="absolute top-2 right-4 z-10 bg-bb-text text-white text-xs rounded-lg px-3 py-2 shadow-lg">
            <div className="font-medium mb-1">
              Cohort: {formatMonth(hoveredCell.cohort)} | Month {hoveredCell.month}
            </div>
            <div>Retention: {hoveredCell.retention}%</div>
            <div>
              Active: {hoveredCell.absolute} / {hoveredCell.cohortSize} customers
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-bb-textSoft sticky left-0 bg-gray-50 min-w-[100px]">
                  Cohort
                </th>
                <th className="text-right px-2 py-2 font-medium text-bb-textSoft min-w-[60px]">
                  Size
                </th>
                {Array.from({ length: maxCols }, (_, i) => (
                  <th
                    key={i}
                    className="text-center px-1 py-2 font-medium text-bb-textSoft min-w-[52px]"
                  >
                    Month {i}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cohorts.map((cohort: CohortSegment) => (
                <tr key={cohort.cohortMonth}>
                  <td className="px-3 py-2 font-medium text-bb-text sticky left-0 bg-white">
                    {formatMonth(cohort.cohortMonth)}
                  </td>
                  <td className="text-right px-2 py-2 text-bb-textSoft">
                    {cohort.cohortSize}
                  </td>
                  {Array.from({ length: maxCols }, (_, i) => {
                    const retention = cohort.retention[i];
                    const absolute = cohort.absoluteCounts[i];
                    const hasData = i < cohort.retention.length;

                    return (
                      <td
                        key={i}
                        className={`text-center px-1 py-2 ${
                          hasData ? getRetentionColor(retention) : 'bg-gray-50'
                        } cursor-default`}
                        onMouseEnter={() =>
                          hasData &&
                          setHoveredCell({
                            cohort: cohort.cohortMonth,
                            month: i,
                            retention,
                            absolute,
                            cohortSize: cohort.cohortSize,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {hasData ? `${retention}%` : ''}
                      </td>
                    );
                  })}
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
          <div className="w-6 h-4 bg-red-200 rounded-sm" />
          <div className="w-6 h-4 bg-orange-200 rounded-sm" />
          <div className="w-6 h-4 bg-yellow-200 rounded-sm" />
          <div className="w-6 h-4 bg-green-300 rounded-sm" />
          <div className="w-6 h-4 bg-green-400 rounded-sm" />
          <div className="w-6 h-4 bg-green-500 rounded-sm" />
          <div className="w-6 h-4 bg-green-600 rounded-sm" />
        </div>
        <span>High</span>
      </div>

      {/* Model Info */}
      <div className="mt-4 text-xs text-bb-textSoft">
        <p>
          Analysis based on {data.modelInfo.dataPointsUsed} customers using{' '}
          {data.modelInfo.method}.
        </p>
      </div>
    </div>
  );
};

export default CohortAnalysis;
