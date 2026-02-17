import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCustomReports,
  deleteCustomReport,
  executeReport,
  scheduleReport,
  removeReportSchedule,
  type CustomReport,
  type ReportExecutionResult,
  type ScheduleConfig,
} from '../../services/customReportService';
import ScheduleReportModal from '../../components/AnalyticsReports/ScheduleReportModal';

const SavedReports = () => {
  const navigate = useNavigate();

  const [reports, setReports] = useState<CustomReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [runningReportId, setRunningReportId] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<ReportExecutionResult | null>(null);
  const [scheduleReportId, setScheduleReportId] = useState<string | null>(null);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const handleScheduleSave = async (schedule: ScheduleConfig) => {
    if (!scheduleReportId) return;
    setScheduleSaving(true);
    const res = await scheduleReport(scheduleReportId, schedule);
    if (res.success && res.data) {
      setReports(prev => prev.map(r =>
        r.id === scheduleReportId ? { ...r, schedule } : r
      ));
      setScheduleReportId(null);
    } else {
      setError(res.error?.message || 'Failed to save schedule');
    }
    setScheduleSaving(false);
  };

  const handleScheduleRemove = async () => {
    if (!scheduleReportId) return;
    setScheduleSaving(true);
    const res = await removeReportSchedule(scheduleReportId);
    if (res.success) {
      setReports(prev => prev.map(r =>
        r.id === scheduleReportId ? { ...r, schedule: null } : r
      ));
      setScheduleReportId(null);
    } else {
      setError(res.error?.message || 'Failed to remove schedule');
    }
    setScheduleSaving(false);
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getCustomReports();
    if (res.success && res.data) {
      setReports(res.data.reports);
    } else {
      setError(res.error?.message || 'Failed to load reports');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDelete = async (reportId: string) => {
    setDeleting(true);
    const res = await deleteCustomReport(reportId);
    if (res.success) {
      setReports(prev => prev.filter(r => r.id !== reportId));
    } else {
      setError(res.error?.message || 'Failed to delete report');
    }
    setDeleteConfirmId(null);
    setDeleting(false);
  };

  const handleRunReport = async (report: CustomReport) => {
    setRunningReportId(report.id);
    setRunResult(null);

    const dateRange = report.filters.dateRange || {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    };

    const res = await executeReport(report.id, dateRange);
    if (res.success && res.data) {
      setRunResult(res.data);
      // Update lastRunAt in local state
      setReports(prev => prev.map(r =>
        r.id === report.id ? { ...r, lastRunAt: new Date().toISOString() } : r
      ));
    } else {
      setError(res.error?.message || 'Failed to run report');
    }
    setRunningReportId(null);
  };

  const filteredReports = reports.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: unknown): string => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(num);
  };

  const formatCellValue = (value: unknown, col: { isCurrency?: boolean; isPercentage?: boolean; isDate?: boolean }): string => {
    if (value === undefined || value === null || value === '') return '-';
    if (col.isCurrency) return formatCurrency(value);
    if (col.isPercentage) return `${Number(value).toFixed(1)}%`;
    if (col.isDate) return String(value);
    return String(value);
  };

  const reportTypeLabel = (type: string): string => {
    switch (type) {
      case 'Sales': return 'Sales';
      case 'Products': return 'Products';
      case 'Customers': return 'Customers';
      case 'Inventory': return 'Inventory';
      case 'StaffPerformance': return 'Staff Performance';
      default: return type;
    }
  };

  const reportTypeBadge = (type: string): string => {
    switch (type) {
      case 'Sales': return 'bg-blue-50 text-blue-700';
      case 'Products': return 'bg-green-50 text-green-700';
      case 'Customers': return 'bg-purple-50 text-purple-700';
      case 'Inventory': return 'bg-orange-50 text-orange-700';
      case 'StaffPerformance': return 'bg-indigo-50 text-indigo-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-bb-text">Saved Reports</h2>
          <p className="text-sm text-bb-textSoft mt-1">
            Manage your custom reports. Run, edit, schedule, or delete reports.
          </p>
        </div>
        <button
          onClick={() => navigate('/analytics-reports/custom-report-builder')}
          className="px-4 py-2 bg-bb-primary text-bb-text font-medium rounded-lg hover:bg-yellow-500 transition-colors text-sm"
        >
          + New Report
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by report name..."
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-primary focus:border-transparent"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-xs text-red-600 hover:text-red-800 underline mt-1">
            Dismiss
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-lg shadow-bb-card">
          <div className="animate-pulse space-y-4 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredReports.length === 0 && (
        <div className="bg-white rounded-lg shadow-bb-card p-8 text-center">
          {reports.length === 0 ? (
            <>
              <p className="text-bb-textSoft text-lg mb-2">No saved reports yet</p>
              <p className="text-sm text-bb-textSoft mb-4">Create your first custom report to get started.</p>
              <button
                onClick={() => navigate('/analytics-reports/custom-report-builder')}
                className="px-4 py-2 bg-bb-primary text-bb-text font-medium rounded-lg hover:bg-yellow-500 text-sm"
              >
                Create Report
              </button>
            </>
          ) : (
            <p className="text-bb-textSoft">No reports match "{searchQuery}"</p>
          )}
        </div>
      )}

      {/* Reports Table */}
      {!loading && filteredReports.length > 0 && (
        <div className="bg-white rounded-lg shadow-bb-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-bb-textSoft">Report Name</th>
                  <th className="text-left px-4 py-3 font-medium text-bb-textSoft">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-bb-textSoft">Created Date</th>
                  <th className="text-left px-4 py-3 font-medium text-bb-textSoft">Last Run</th>
                  <th className="text-right px-4 py-3 font-medium text-bb-textSoft">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredReports.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-bb-text">{report.name}</p>
                        {report.description && (
                          <p className="text-xs text-bb-textSoft mt-0.5 truncate max-w-xs">{report.description}</p>
                        )}
                        {report.schedule && (
                          <span className="inline-block mt-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            Scheduled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${reportTypeBadge(report.reportType)}`}>
                        {reportTypeLabel(report.reportType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-bb-textSoft">{formatDate(report.createdAt)}</td>
                    <td className="px-4 py-3 text-bb-textSoft">{formatDate(report.lastRunAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRunReport(report)}
                          disabled={runningReportId === report.id}
                          className="px-3 py-1.5 bg-bb-primary text-bb-text font-medium rounded-lg hover:bg-yellow-500 text-xs disabled:opacity-50"
                        >
                          {runningReportId === report.id ? 'Running...' : 'Run'}
                        </button>
                        <button
                          onClick={() => navigate(`/analytics-reports/custom-report-builder?edit=${report.id}`)}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-bb-text hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setScheduleReportId(scheduleReportId === report.id ? null : report.id)}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-bb-text hover:bg-gray-50"
                          title="Schedule Email"
                        >
                          Schedule
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(report.id)}
                          className="px-3 py-1.5 border border-red-200 rounded-lg text-xs text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Run Result */}
      {runResult && (
        <div className="mt-6 bg-white rounded-lg shadow-bb-card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-bb-text">{runResult.reportName}</h3>
              <p className="text-xs text-bb-textSoft">
                {runResult.summary.totalRecords} records | Generated {new Date(runResult.summary.generatedAt).toLocaleString('en-IN')}
              </p>
            </div>
            <button
              onClick={() => setRunResult(null)}
              className="text-bb-textSoft hover:text-bb-text text-sm"
            >
              Close
            </button>
          </div>
          {runResult.data.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-bb-textSoft">No data found for the selected filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {runResult.columns.map(col => (
                      <th
                        key={col.id}
                        className={`px-4 py-3 font-medium text-bb-textSoft ${
                          col.isCurrency || col.isPercentage ? 'text-right' : 'text-left'
                        }`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {runResult.data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      {runResult.columns.map(col => (
                        <td
                          key={col.id}
                          className={`px-4 py-3 ${
                            col.isCurrency || col.isPercentage ? 'text-right' : 'text-left'
                          }`}
                        >
                          {formatCellValue(row[col.field], col)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-bb-text mb-2">Delete Report</h3>
            <p className="text-sm text-bb-textSoft mb-4">
              Are you sure you want to delete this report? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-bb-text hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 text-sm disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Report Modal */}
      {scheduleReportId && (() => {
        const report = reports.find(r => r.id === scheduleReportId);
        if (!report) return null;
        return (
          <ScheduleReportModal
            reportName={report.name}
            existingSchedule={report.schedule}
            onSave={handleScheduleSave}
            onRemove={handleScheduleRemove}
            onClose={() => setScheduleReportId(null)}
            saving={scheduleSaving}
          />
        );
      })()}
    </div>
  );
};

export default SavedReports;
