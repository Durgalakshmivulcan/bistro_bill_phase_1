import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { viewSharedReport, type SharedReportData } from '../services/reportsService';

interface ReportMetric {
  label: string;
  period1: number;
  period2: number;
  change: number;
  percentChange: number;
  isCurrency?: boolean;
  isPercentage?: boolean;
}

const SharedReport = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<SharedReportData | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const fetchReport = async (password?: string) => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      setPasswordError(false);

      const res = await viewSharedReport(token, password);

      if (res.success && res.data) {
        setReportData(res.data);
      } else {
        setError('Failed to load shared report');
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError('This shared report link is invalid or has been removed.');
      } else if (err?.response?.status === 410) {
        setError('This shared report link has expired.');
      } else if (err?.response?.status === 401) {
        setPasswordError(true);
        setReportData((prev) =>
          prev ? { ...prev, requiresPassword: true } : { requiresPassword: true, reportType: '', restaurantName: '' }
        );
      } else {
        setError('Failed to load shared report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport(passwordInput);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatValue = (value: number, metric: ReportMetric): string => {
    if (metric.isCurrency) return formatCurrency(value);
    if (metric.isPercentage) return `${value.toFixed(1)}%`;
    return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const getChangeColor = (value: number): string => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getChangeBg = (value: number): string => {
    if (value > 0) return 'bg-green-50';
    if (value < 0) return 'bg-red-50';
    return 'bg-gray-50';
  };

  const reportTypeLabels: Record<string, string> = {
    sales: 'Sales Summary',
    products: 'Product Performance',
    customers: 'Customer Analytics',
    staff: 'Staff Performance',
  };

  const formatDateLabel = (start: string, end: string): string => {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${e.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-12 h-12 bg-yellow-300 rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading shared report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-4 text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-gray-700 text-lg font-medium mb-2">Report Unavailable</p>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // Password prompt
  if (reportData?.requiresPassword && !reportData?.reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-4">
          <div className="text-center mb-6">
            <svg className="w-12 h-12 text-yellow-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-800">Password Protected Report</h2>
            {reportData.restaurantName && (
              <p className="text-sm text-gray-500 mt-1">
                Shared by {reportData.restaurantName}
              </p>
            )}
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password"
              className={`w-full border rounded-lg px-3 py-2 text-sm mb-3 ${passwordError ? 'border-red-400' : 'border-gray-300'}`}
              autoFocus
            />
            {passwordError && (
              <p className="text-red-500 text-xs mb-3">Incorrect password. Please try again.</p>
            )}
            <button
              type="submit"
              className="w-full px-4 py-2 bg-yellow-400 text-gray-800 font-medium rounded-lg hover:bg-yellow-500 text-sm"
            >
              View Report
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Report view
  const config = reportData?.reportConfig as any;
  const data = reportData?.reportData as any;
  const metrics: ReportMetric[] = data?.metrics || [];

  const topChanges = [...metrics]
    .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                {reportTypeLabels[reportData?.reportType || ''] || 'Report'} - Shared Report
              </h1>
              {reportData?.restaurantName && (
                <p className="text-sm text-gray-500">{reportData.restaurantName}</p>
              )}
            </div>
            <div className="text-right text-xs text-gray-400">
              {reportData?.viewCount !== undefined && (
                <p>Views: {reportData.viewCount}</p>
              )}
              {reportData?.expiresAt && (
                <p>Expires: {new Date(reportData.expiresAt).toLocaleDateString('en-IN')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Date Ranges */}
        {config && (
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm px-4 py-2 text-sm">
              <span className="text-gray-500">Period 1: </span>
              <span className="font-medium">{formatDateLabel(config.startDate1, config.endDate1)}</span>
            </div>
            {config.compareEnabled && config.startDate2 && (
              <div className="bg-white rounded-lg shadow-sm px-4 py-2 text-sm">
                <span className="text-gray-500">Period 2: </span>
                <span className="font-medium">{formatDateLabel(config.startDate2, config.endDate2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Key Changes Summary */}
        {topChanges.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Key Changes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topChanges.map((metric) => (
                <div
                  key={metric.label}
                  className={`rounded-lg p-3 ${getChangeBg(metric.percentChange)}`}
                >
                  <p className="text-xs text-gray-500">{metric.label}</p>
                  <p className={`text-lg font-bold ${getChangeColor(metric.percentChange)}`}>
                    {metric.percentChange > 0 ? '+' : ''}
                    {metric.percentChange.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatValue(metric.period2, metric)} {'\u2192'} {formatValue(metric.period1, metric)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Table */}
        {metrics.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="text-base font-semibold text-gray-800">
                {reportTypeLabels[reportData?.reportType || ''] || 'Report'} Comparison
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Metric</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">
                      {config ? formatDateLabel(config.startDate1, config.endDate1) : 'Period 1'}
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">
                      {config?.startDate2 ? formatDateLabel(config.startDate2, config.endDate2) : 'Period 2'}
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Change</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">% Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {metrics.map((metric) => (
                    <tr key={metric.label} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{metric.label}</td>
                      <td className="text-right px-4 py-3">{formatValue(metric.period1, metric)}</td>
                      <td className="text-right px-4 py-3">{formatValue(metric.period2, metric)}</td>
                      <td className={`text-right px-4 py-3 font-medium ${getChangeColor(metric.change)}`}>
                        {metric.change > 0 ? '+' : ''}
                        {metric.isCurrency
                          ? formatCurrency(metric.change)
                          : metric.change.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className={`text-right px-4 py-3 font-bold ${getChangeColor(metric.percentChange)}`}>
                        {metric.percentChange > 0 ? '+' : ''}
                        {metric.percentChange.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {metrics.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">No comparison data available for this shared report.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-gray-400">
        Powered by Bistro Bill
      </div>
    </div>
  );
};

export default SharedReport;
