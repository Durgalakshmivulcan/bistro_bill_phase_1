import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSalesForecast, type SalesForecastResponse, type DailyForecast } from '../../services/reportsService';

const SalesForecastWidget = () => {
  const { user } = useAuth();
  const [forecast, setForecast] = useState<SalesForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const branchId =
    user?.userType === 'Staff'
      ? user.branch?.id
      : user?.userType === 'BusinessOwner'
        ? user.branches?.[0]?.id
        : undefined;

  useEffect(() => {
    if (!branchId) return;

    const fetchForecast = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getSalesForecast(branchId, 7);
        if (response.success && response.data) {
          setForecast(response.data);
        } else {
          setError('Failed to load forecast data');
        }
      } catch (err) {
        setError('An error occurred while loading forecast');
        console.error('Forecast error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-bb-card p-6">
        <h3 className="text-lg font-semibold text-bb-text mb-4">7-Day Sales Forecast</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-bb-card p-6">
        <h3 className="text-lg font-semibold text-bb-text mb-4">7-Day Sales Forecast</h3>
        <p className="text-bb-danger text-sm">{error}</p>
      </div>
    );
  }

  if (!forecast || forecast.forecasts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-bb-card p-6">
        <h3 className="text-lg font-semibold text-bb-text mb-4">7-Day Sales Forecast</h3>
        <p className="text-bb-textSoft text-sm">Not enough data to generate forecast</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...forecast.forecasts.map(f => f.highEstimate));

  const { lastMonthComparison, accuracy } = forecast;

  return (
    <div className="bg-white rounded-lg shadow-bb-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-bb-text">7-Day Sales Forecast</h3>
        <div className="flex items-center gap-3">
          {accuracy > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
              {accuracy}% Accuracy
            </span>
          )}
          <a
            href="/analytics-reports/sales-forecast"
            className="text-sm text-bb-primary hover:underline font-medium"
          >
            View Details
          </a>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end gap-2 h-40 mb-4">
        {forecast.forecasts.map((day: DailyForecast) => {
          const barHeight = maxRevenue > 0 ? (day.predictedRevenue / maxRevenue) * 100 : 0;
          const lowHeight = maxRevenue > 0 ? (day.lowEstimate / maxRevenue) * 100 : 0;
          const highHeight = maxRevenue > 0 ? (day.highEstimate / maxRevenue) * 100 : 0;

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-bb-text text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                <div className="font-medium">{day.dayOfWeek}</div>
                <div>Revenue: ₹{day.predictedRevenue.toLocaleString()}</div>
                <div>Orders: {day.predictedOrders}</div>
                <div className="text-gray-300">
                  Range: ₹{day.lowEstimate.toLocaleString()} - ₹{day.highEstimate.toLocaleString()}
                </div>
              </div>

              {/* Confidence range (shaded area) */}
              <div className="w-full relative" style={{ height: `${highHeight}%` }}>
                <div
                  className="absolute bottom-0 left-1 right-1 bg-amber-100 rounded-t"
                  style={{ height: `${highHeight > 0 ? ((highHeight - lowHeight) / highHeight) * 100 : 0}%`, bottom: `${highHeight > 0 ? (lowHeight / highHeight) * 100 : 0}%` }}
                />
                {/* Main bar */}
                <div
                  className="absolute bottom-0 left-2 right-2 bg-bb-primary rounded-t"
                  style={{ height: `${highHeight > 0 ? (barHeight / highHeight) * 100 : 0}%` }}
                />
              </div>

              {/* Day label */}
              <span className="text-[10px] text-bb-textSoft mt-1">
                {day.dayOfWeek.slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-bb-textSoft">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-bb-primary rounded" />
          <span>Predicted</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-100 rounded" />
          <span>Confidence Range</span>
        </div>
      </div>

      {/* Last Month Comparison */}
      <div className="border-t pt-3 flex items-center justify-between text-sm">
        <span className="text-bb-textSoft">vs Same Period Last Month</span>
        <span
          className={`font-medium ${
            lastMonthComparison.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {lastMonthComparison.changePercent >= 0 ? '+' : ''}
          {lastMonthComparison.changePercent}%
          <span className="text-bb-textSoft font-normal ml-1">
            (₹{lastMonthComparison.lastMonthRevenue.toLocaleString()})
          </span>
        </span>
      </div>
    </div>
  );
};

export default SalesForecastWidget;
