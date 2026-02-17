import { useEffect, useState } from 'react';
import {
  getSalesAnomalies,
  resolveAnomaly,
  type AnomalyDetectionResponse,
  type SalesAnomaly,
} from '../../services/reportsService';

const AnomalyAlertsWidget = () => {
  const [data, setData] = useState<AnomalyDetectionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSalesAnomalies(undefined, 7);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError('Failed to load anomaly data');
      }
    } catch (err) {
      setError('An error occurred while loading anomaly data');
      console.error('Anomaly detection error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const handleResolve = async (anomalyId: string) => {
    try {
      setResolvingId(anomalyId);
      const response = await resolveAnomaly(anomalyId);
      if (response.success) {
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            anomalies: prev.anomalies.map(a =>
              a.id === anomalyId ? { ...a, resolved: true, resolvedAt: new Date().toISOString() } : a
            ),
            summary: {
              ...prev.summary,
              resolvedCount: prev.summary.resolvedCount + 1,
              unresolvedCount: prev.summary.unresolvedCount - 1,
            },
          };
        });
      }
    } catch (err) {
      console.error('Failed to resolve anomaly:', err);
    } finally {
      setResolvingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-bb-card p-6">
        <h3 className="text-lg font-semibold text-bb-text mb-4">Sales Anomaly Alerts</h3>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="h-8 w-8 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-bb-card p-6">
        <h3 className="text-lg font-semibold text-bb-text mb-4">Sales Anomaly Alerts</h3>
        <p className="text-bb-danger text-sm">{error}</p>
      </div>
    );
  }

  if (!data || data.anomalies.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-bb-card p-6">
        <h3 className="text-lg font-semibold text-bb-text mb-4">Sales Anomaly Alerts</h3>
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
          <span className="text-green-600 text-xl">&#10003;</span>
          <p className="text-green-700 text-sm">No sales anomalies detected in the last 7 days</p>
        </div>
      </div>
    );
  }

  const unresolvedAnomalies = data.anomalies.filter(a => !a.resolved);
  const alertCount = unresolvedAnomalies.length;

  return (
    <div className="bg-white rounded-lg shadow-bb-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-bb-text">Sales Anomaly Alerts</h3>
          {alertCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              {alertCount} unresolved
            </span>
          )}
        </div>
        <span className="text-xs text-bb-textSoft">Last 7 days</span>
      </div>

      {/* Anomaly Cards */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {data.anomalies.map((anomaly: SalesAnomaly) => {
          const isHigh = anomaly.type === 'high';
          const bgColor = anomaly.resolved
            ? 'bg-gray-50'
            : isHigh
            ? 'bg-green-50'
            : 'bg-red-50';
          const borderColor = anomaly.resolved
            ? 'border-gray-200'
            : isHigh
            ? 'border-green-200'
            : 'border-red-200';
          const typeColor = isHigh ? 'text-green-700' : 'text-red-700';
          const typeBg = isHigh ? 'bg-green-100' : 'bg-red-100';
          const icon = isHigh ? '↑' : '↓';

          return (
            <div
              key={anomaly.id}
              className={`p-3 rounded-lg border ${bgColor} ${borderColor} ${anomaly.resolved ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${typeBg} ${typeColor}`}>
                      {icon} {isHigh ? 'Unusually High' : 'Unusually Low'}
                    </span>
                    <span className="text-xs text-bb-textSoft">{formatDate(anomaly.date)}</span>
                    {anomaly.resolved && (
                      <span className="px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                        Resolved
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-3 text-sm">
                    <span className="text-bb-text">
                      <span className="font-medium">Actual:</span> {formatCurrency(anomaly.actualValue)}
                    </span>
                    <span className="text-bb-textSoft">
                      <span className="font-medium">Expected:</span> {formatCurrency(anomaly.expectedValue)}
                    </span>
                    <span className={`font-medium ${typeColor}`}>
                      {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation}%
                    </span>
                  </div>
                </div>
                {!anomaly.resolved && (
                  <button
                    onClick={() => handleResolve(anomaly.id)}
                    disabled={resolvingId === anomaly.id}
                    className="px-3 py-1 text-xs font-medium text-bb-textSoft bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {resolvingId === anomaly.id ? 'Resolving...' : 'Mark Resolved'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-bb-textSoft">
        <span>
          Avg daily sales: {formatCurrency(data.stats.dailyAverage)}
        </span>
        <a href="/analytics-reports" className="text-bb-primary hover:underline font-medium">
          View Report
        </a>
      </div>
    </div>
  );
};

export default AnomalyAlertsWidget;
