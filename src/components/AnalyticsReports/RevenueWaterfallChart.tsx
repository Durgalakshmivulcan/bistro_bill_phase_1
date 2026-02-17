import { useState, useEffect } from 'react';
import { getSalesSummary } from '../../services/reportsService';
import type { SalesSummary } from '../../services/reportsService';

interface WaterfallBar {
  label: string;
  value: number;
  runningTotal: number;
  type: 'positive' | 'negative' | 'total';
}

function buildBars(period: SalesSummary['currentPeriod']): WaterfallBar[] {
  const grossSales = period.totalRevenue;
  const discounts = period.totalDiscounts;
  const taxes = period.totalTax;
  const tips = 0; // Tips not yet tracked in SalesSummary
  const netRevenue = grossSales - discounts - taxes - tips;

  return [
    { label: 'Gross Sales', value: grossSales, runningTotal: grossSales, type: 'total' },
    { label: 'Discounts', value: -discounts, runningTotal: grossSales - discounts, type: 'negative' },
    { label: 'Taxes', value: -taxes, runningTotal: grossSales - discounts - taxes, type: 'negative' },
    { label: 'Tips', value: tips, runningTotal: grossSales - discounts - taxes + tips, type: 'positive' },
    { label: 'Net Revenue', value: netRevenue, runningTotal: netRevenue, type: 'total' },
  ];
}

const DATE_OPTIONS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

export default function RevenueWaterfallChart() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<SalesSummary | null>(null);
  const [previousData, setPreviousData] = useState<SalesSummary | null>(null);
  const [days, setDays] = useState(30);
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await getSalesSummary(
        startDate.toISOString(),
        endDate.toISOString()
      );

      if (response.success && response.data) {
        setCurrentData(response.data);

        // Fetch previous period for comparison
        const prevEnd = new Date(startDate);
        const prevStart = new Date(startDate);
        prevStart.setDate(prevStart.getDate() - days);

        const prevResponse = await getSalesSummary(
          prevStart.toISOString(),
          prevEnd.toISOString()
        );

        if (prevResponse.success && prevResponse.data) {
          setPreviousData(prevResponse.data);
        }
      } else {
        setError(response.message || 'Failed to load revenue data');
      }
    } catch {
      setError('An error occurred while loading revenue data');
    } finally {
      setLoading(false);
    }
  };

  const currentBars = currentData ? buildBars(currentData.currentPeriod) : [];
  const previousBars = previousData ? buildBars(previousData.currentPeriod) : [];

  const allValues = [
    ...currentBars.map((b) => b.runningTotal),
    ...(compareMode ? previousBars.map((b) => b.runningTotal) : []),
  ];
  const maxValue = Math.max(...allValues, 1);
  const chartHeight = 280;

  return (
    <div className="mx-3 md:mx-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Revenue Waterfall
        </h2>
        <div className="flex gap-2 flex-wrap">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setDays(opt.days)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                days === opt.days
                  ? 'bg-bb-primary text-bb-text border-bb-primary font-medium'
                  : 'bg-white text-bb-textSoft border-gray-200 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              compareMode
                ? 'bg-blue-50 text-blue-700 border-blue-300 font-medium'
                : 'bg-white text-bb-textSoft border-gray-200 hover:border-gray-300'
            }`}
          >
            {compareMode ? 'Hide Comparison' : 'Compare Previous'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchData}
            className="text-sm font-medium underline ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bb-primary" />
        </div>
      )}

      {/* Chart */}
      {!loading && currentData && (
        <div className="bg-white border rounded-lg shadow-bb-card p-4 md:p-6">
          {/* Legend */}
          <div className="flex gap-4 mb-4 text-xs text-bb-textSoft">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-500 inline-block" />
              Positive
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-400 inline-block" />
              Negative
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-bb-primary inline-block" />
              Total
            </span>
            {compareMode && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gray-300 inline-block" />
                Previous Period
              </span>
            )}
          </div>

          {/* Bars */}
          <div className="overflow-x-auto">
            <div
              className="flex items-end justify-around gap-2 md:gap-6"
              style={{ minWidth: compareMode ? 600 : 400, height: chartHeight }}
            >
              {currentBars.map((bar, i) => {
                const prevBar = previousBars[i];
                const barHeight =
                  bar.type === 'total'
                    ? (bar.value / maxValue) * chartHeight * 0.85
                    : (Math.abs(bar.value) / maxValue) * chartHeight * 0.85;

                const bottomOffset =
                  bar.type === 'total'
                    ? 0
                    : (bar.runningTotal / maxValue) * chartHeight * 0.85;

                const prevBarHeight = prevBar
                  ? prevBar.type === 'total'
                    ? (prevBar.value / maxValue) * chartHeight * 0.85
                    : (Math.abs(prevBar.value) / maxValue) * chartHeight * 0.85
                  : 0;

                const prevBottomOffset = prevBar
                  ? prevBar.type === 'total'
                    ? 0
                    : (prevBar.runningTotal / maxValue) * chartHeight * 0.85
                  : 0;

                const barColor =
                  bar.type === 'total'
                    ? 'bg-bb-primary'
                    : bar.type === 'negative'
                    ? 'bg-red-400'
                    : 'bg-green-500';

                return (
                  <div
                    key={bar.label}
                    className="flex-1 flex flex-col items-center"
                    style={{ height: chartHeight }}
                  >
                    {/* Value label */}
                    <div
                      className="text-xs font-medium text-bb-text text-center mb-1 whitespace-nowrap"
                      style={{
                        marginTop: Math.max(
                          0,
                          chartHeight -
                            barHeight -
                            bottomOffset -
                            24
                        ),
                      }}
                    >
                      {bar.value < 0 ? '-' : ''}₹
                      {Math.abs(bar.value).toLocaleString('en-IN', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </div>

                    {/* Bar container */}
                    <div
                      className="relative w-full flex justify-center gap-1"
                      style={{ flex: 1 }}
                    >
                      {/* Current period bar */}
                      <div
                        className={`${barColor} rounded-t transition-all duration-300 ${
                          compareMode ? 'w-5/12' : 'w-8/12'
                        }`}
                        style={{
                          height: Math.max(barHeight, 4),
                          position: 'absolute',
                          bottom: bottomOffset,
                          left: compareMode ? '10%' : '20%',
                        }}
                        title={`${bar.label}: ₹${Math.abs(bar.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                      />

                      {/* Previous period bar */}
                      {compareMode && prevBar && (
                        <div
                          className="bg-gray-300 rounded-t transition-all duration-300 w-5/12"
                          style={{
                            height: Math.max(prevBarHeight, 4),
                            position: 'absolute',
                            bottom: prevBottomOffset,
                            right: '10%',
                          }}
                          title={`Previous ${prevBar.label}: ₹${Math.abs(prevBar.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                        />
                      )}
                    </div>

                    {/* Label */}
                    <div className="text-xs text-bb-textSoft text-center mt-2 leading-tight">
                      {bar.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary table */}
          <div className="mt-6 border-t pt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-bb-textSoft text-left">
                  <th className="pb-2 font-medium">Component</th>
                  <th className="pb-2 font-medium text-right">Current Period</th>
                  {compareMode && (
                    <th className="pb-2 font-medium text-right">Previous Period</th>
                  )}
                  {compareMode && (
                    <th className="pb-2 font-medium text-right">Change</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentBars.map((bar, i) => {
                  const prevBar = previousBars[i];
                  const change =
                    prevBar && prevBar.value !== 0
                      ? ((bar.value - prevBar.value) / Math.abs(prevBar.value)) * 100
                      : 0;

                  return (
                    <tr key={bar.label} className="border-t border-gray-100">
                      <td className="py-2 font-medium text-bb-text">
                        {bar.label}
                      </td>
                      <td className="py-2 text-right">
                        <span
                          className={
                            bar.type === 'negative'
                              ? 'text-red-600'
                              : bar.type === 'total'
                              ? 'font-semibold text-bb-text'
                              : 'text-green-600'
                          }
                        >
                          {bar.value < 0 ? '-' : ''}₹
                          {Math.abs(bar.value).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      {compareMode && prevBar && (
                        <td className="py-2 text-right text-bb-textSoft">
                          {prevBar.value < 0 ? '-' : ''}₹
                          {Math.abs(prevBar.value).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      )}
                      {compareMode && prevBar && (
                        <td className="py-2 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              change > 0
                                ? 'bg-green-100 text-green-700'
                                : change < 0
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {change > 0 ? '↑' : change < 0 ? '↓' : '–'}
                            {Math.abs(change).toFixed(1)}%
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
