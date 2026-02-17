import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  createCustomReport,
  getCustomReportById,
  updateCustomReport,
  getReportTemplates,
  getAvailableColumns,
  executeReport,
  type ReportType,
  type ReportFilter,
  type ReportColumn,
  type CustomReportInput,
  type ReportExecutionResult,
  type ReportTemplate,
} from '../../services/customReportService';

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'Sales', label: 'Sales' },
  { value: 'Products', label: 'Products' },
  { value: 'Customers', label: 'Customers' },
  { value: 'Inventory', label: 'Inventory' },
  { value: 'StaffPerformance', label: 'Staff Performance' },
];

const FILTER_OPTIONS = [
  { id: 'dateRange', label: 'Date Range' },
  { id: 'branchId', label: 'Branch' },
  { id: 'categoryId', label: 'Category' },
  { id: 'paymentMode', label: 'Payment Mode' },
  { id: 'customerGroup', label: 'Customer Group' },
];

const CustomReportBuilder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [reportType, setReportType] = useState<ReportType>('Sales');
  const [filters, setFilters] = useState<ReportFilter>({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [availableColumns, setAvailableColumns] = useState<ReportColumn[]>([]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewResult, setPreviewResult] = useState<ReportExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // Fetch available columns when report type changes
  const fetchColumns = useCallback(async (type: ReportType) => {
    setLoadingColumns(true);
    const res = await getAvailableColumns(type);
    if (res.success && res.data) {
      setAvailableColumns(res.data.columns);
      setColumns(res.data.columns.filter(c => c.visible));
    } else {
      // Fallback: use hardcoded defaults matching backend
      const defaults = getDefaultColumns(type);
      setAvailableColumns(defaults);
      setColumns(defaults.filter(c => c.visible));
    }
    setLoadingColumns(false);
  }, []);

  // Load report for editing
  useEffect(() => {
    if (editId) {
      setLoadingEdit(true);
      getCustomReportById(editId).then(res => {
        if (res.success && res.data) {
          const report = res.data;
          setName(report.name);
          setDescription(report.description || '');
          setReportType(report.reportType as ReportType);
          setFilters(report.filters);
          setColumns(report.columns);
          // Determine active filters
          const active: string[] = [];
          if (report.filters.dateRange) active.push('dateRange');
          if (report.filters.branchId) active.push('branchId');
          if (report.filters.categoryId) active.push('categoryId');
          if (report.filters.paymentMode) active.push('paymentMode');
          if (report.filters.customerGroup) active.push('customerGroup');
          setActiveFilters(active);
        }
        setLoadingEdit(false);
      });
    }
  }, [editId]);

  // Fetch columns when report type changes (but not when editing)
  useEffect(() => {
    if (!editId) {
      fetchColumns(reportType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, editId]);

  // Fetch templates on mount
  useEffect(() => {
    getReportTemplates().then(res => {
      if (res.success && res.data) {
        setTemplates(res.data.templates);
      }
    });
  }, []);

  const handleReportTypeChange = (type: ReportType) => {
    setReportType(type);
    setFilters({});
    setActiveFilters([]);
    setPreviewResult(null);
    fetchColumns(type);
  };

  const toggleFilter = (filterId: string) => {
    if (activeFilters.includes(filterId)) {
      setActiveFilters(prev => prev.filter(f => f !== filterId));
      // Remove filter value
      setFilters(prev => {
        const updated = { ...prev };
        delete updated[filterId as keyof ReportFilter];
        return updated;
      });
    } else {
      setActiveFilters(prev => [...prev, filterId]);
      // Set default value for date range
      if (filterId === 'dateRange') {
        const end = new Date().toISOString().split('T')[0];
        const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setFilters(prev => ({ ...prev, dateRange: { startDate: start, endDate: end } }));
      }
    }
  };

  const toggleColumn = (columnId: string) => {
    const col = availableColumns.find(c => c.id === columnId);
    if (!col) return;

    if (columns.some(c => c.id === columnId)) {
      setColumns(prev => prev.filter(c => c.id !== columnId));
    } else {
      setColumns(prev => [...prev, { ...col, visible: true }]);
    }
  };

  const handlePreview = async () => {
    setError(null);
    setPreviewing(true);
    setPreviewResult(null);

    // Need a saved report to preview; save temporarily
    const dateRange = filters.dateRange || {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    };

    if (editId) {
      const res = await executeReport(editId, dateRange);
      if (res.success && res.data) {
        setPreviewResult(res.data);
      } else {
        setError(res.error?.message || 'Failed to preview report');
      }
    } else {
      // Create temp report, preview, then optionally delete
      const input: CustomReportInput = {
        name: name || 'Untitled Preview',
        description,
        reportType,
        filters,
        columns,
      };
      const createRes = await createCustomReport(input);
      if (createRes.success && createRes.data) {
        const res = await executeReport(createRes.data.id, dateRange);
        if (res.success && res.data) {
          setPreviewResult(res.data);
        } else {
          setError(res.error?.message || 'Failed to preview report');
        }
      } else {
        setError(createRes.error?.message || 'Failed to create report for preview');
      }
    }

    setPreviewing(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Report name is required');
      return;
    }
    if (columns.length === 0) {
      setError('Select at least one column');
      return;
    }

    setError(null);
    setSaving(true);

    const input: CustomReportInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      reportType,
      filters,
      columns,
    };

    if (editId) {
      const res = await updateCustomReport(editId, input);
      if (res.success) {
        navigate('/analytics-reports/saved-reports');
      } else {
        setError(res.error?.message || 'Failed to update report');
      }
    } else {
      const res = await createCustomReport(input);
      if (res.success) {
        navigate('/analytics-reports/saved-reports');
      } else {
        setError(res.error?.message || 'Failed to save report');
      }
    }

    setSaving(false);
  };

  const loadTemplate = (template: ReportTemplate) => {
    setName(template.name);
    setDescription(template.description || '');
    setReportType(template.reportType as ReportType);
    setFilters(template.filters);
    setColumns(template.columns);
    setShowTemplates(false);

    // Set active filters
    const active: string[] = [];
    if (template.filters.dateRange) active.push('dateRange');
    if (template.filters.branchId) active.push('branchId');
    if (template.filters.categoryId) active.push('categoryId');
    if (template.filters.paymentMode) active.push('paymentMode');
    if (template.filters.customerGroup) active.push('customerGroup');
    setActiveFilters(active);

    // Also fetch available columns for the template type
    fetchColumns(template.reportType as ReportType);
  };

  const formatCurrency = (value: unknown): string => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(num);
  };

  const formatCellValue = (value: unknown, col: ReportColumn): string => {
    if (value === undefined || value === null || value === '') return '-';
    if (col.isCurrency) return formatCurrency(value);
    if (col.isPercentage) return `${Number(value).toFixed(1)}%`;
    if (col.isDate) return String(value);
    return String(value);
  };

  if (loadingEdit) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-40 bg-gray-200 rounded" />
          <div className="h-40 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-bb-text">
            {editId ? 'Edit Report' : 'Custom Report Builder'}
          </h2>
          <p className="text-sm text-bb-textSoft mt-1">
            Create custom reports by selecting data type, filters, and columns.
          </p>
        </div>
        <div className="flex gap-2">
          {!editId && templates.length > 0 && (
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-bb-text hover:bg-gray-50 transition-colors"
            >
              Use Template
            </button>
          )}
          <button
            onClick={() => navigate('/analytics-reports/saved-reports')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-bb-text hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Template Selector */}
      {showTemplates && (
        <div className="bg-white rounded-lg shadow-bb-card p-4 mb-6">
          <h3 className="text-sm font-semibold text-bb-text mb-3">Report Templates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => loadTemplate(template)}
                className="text-left border border-gray-200 rounded-lg p-3 hover:border-bb-primary hover:bg-bb-hover transition-colors"
              >
                <p className="text-sm font-medium text-bb-text">{template.name}</p>
                <p className="text-xs text-bb-textSoft mt-1">{template.description}</p>
                <span className="inline-block mt-2 text-xs bg-gray-100 text-bb-textSoft px-2 py-0.5 rounded">
                  {template.reportType}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Name & Description */}
          <div className="bg-white rounded-lg shadow-bb-card p-4">
            <h3 className="text-sm font-semibold text-bb-text mb-3">Report Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-bb-textSoft mb-1">Report Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Monthly Sales Summary"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-bb-textSoft mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this report..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-bb-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Report Type */}
          <div className="bg-white rounded-lg shadow-bb-card p-4">
            <h3 className="text-sm font-semibold text-bb-text mb-3">Report Type</h3>
            <div className="flex flex-wrap gap-2">
              {REPORT_TYPES.map(rt => (
                <button
                  key={rt.value}
                  onClick={() => handleReportTypeChange(rt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reportType === rt.value
                      ? 'bg-bb-primary text-bb-text'
                      : 'bg-gray-100 text-bb-textSoft hover:bg-gray-200'
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-bb-card p-4">
            <h3 className="text-sm font-semibold text-bb-text mb-3">Filters</h3>
            <p className="text-xs text-bb-textSoft mb-3">Select filters to narrow down your report data.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {FILTER_OPTIONS.map(fo => (
                <button
                  key={fo.id}
                  onClick={() => toggleFilter(fo.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeFilters.includes(fo.id)
                      ? 'bg-bb-primary text-bb-text'
                      : 'bg-gray-100 text-bb-textSoft hover:bg-gray-200'
                  }`}
                >
                  {activeFilters.includes(fo.id) ? '- ' : '+ '}{fo.label}
                </button>
              ))}
            </div>

            {/* Active filter inputs */}
            {activeFilters.length > 0 && (
              <div className="space-y-3 border-t border-gray-100 pt-3">
                {activeFilters.includes('dateRange') && (
                  <div className="flex gap-3">
                    <div>
                      <label className="block text-xs text-bb-textSoft mb-1">Start Date</label>
                      <input
                        type="date"
                        value={filters.dateRange?.startDate || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          dateRange: { startDate: e.target.value, endDate: prev.dateRange?.endDate || '' },
                        }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-bb-textSoft mb-1">End Date</label>
                      <input
                        type="date"
                        value={filters.dateRange?.endDate || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          dateRange: { startDate: prev.dateRange?.startDate || '', endDate: e.target.value },
                        }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}
                {activeFilters.includes('branchId') && (
                  <div>
                    <label className="block text-xs text-bb-textSoft mb-1">Branch ID</label>
                    <input
                      type="text"
                      value={filters.branchId || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, branchId: e.target.value }))}
                      placeholder="Enter branch ID"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-xs"
                    />
                  </div>
                )}
                {activeFilters.includes('categoryId') && (
                  <div>
                    <label className="block text-xs text-bb-textSoft mb-1">Category ID</label>
                    <input
                      type="text"
                      value={filters.categoryId || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
                      placeholder="Enter category ID"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-xs"
                    />
                  </div>
                )}
                {activeFilters.includes('paymentMode') && (
                  <div>
                    <label className="block text-xs text-bb-textSoft mb-1">Payment Mode</label>
                    <select
                      value={filters.paymentMode || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, paymentMode: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">All</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                )}
                {activeFilters.includes('customerGroup') && (
                  <div>
                    <label className="block text-xs text-bb-textSoft mb-1">Customer Group</label>
                    <input
                      type="text"
                      value={filters.customerGroup || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, customerGroup: e.target.value }))}
                      placeholder="Enter customer group name"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-xs"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column Selector */}
          <div className="bg-white rounded-lg shadow-bb-card p-4">
            <h3 className="text-sm font-semibold text-bb-text mb-3">
              Columns ({columns.length} selected)
            </h3>
            {loadingColumns ? (
              <div className="animate-pulse space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-6 bg-gray-200 rounded w-1/2" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableColumns.map(col => {
                  const isSelected = columns.some(c => c.id === col.id);
                  return (
                    <label
                      key={col.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-yellow-50 border border-bb-primary' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleColumn(col.id)}
                        className="w-4 h-4 text-bb-primary rounded"
                      />
                      <span className="text-sm text-bb-text">{col.label}</span>
                      {col.isCurrency && <span className="text-xs text-bb-textSoft">(INR)</span>}
                      {col.isDate && <span className="text-xs text-bb-textSoft">(Date)</span>}
                      {col.isPercentage && <span className="text-xs text-bb-textSoft">(%)</span>}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Actions & Preview */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-lg shadow-bb-card p-4">
            <h3 className="text-sm font-semibold text-bb-text mb-3">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handlePreview}
                disabled={previewing || columns.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-bb-text hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {previewing ? 'Generating Preview...' : 'Preview Report'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim() || columns.length === 0}
                className="w-full px-4 py-2 bg-bb-primary text-bb-text font-medium rounded-lg hover:bg-yellow-500 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : editId ? 'Update Report' : 'Save Report'}
              </button>
            </div>
          </div>

          {/* Report Summary */}
          <div className="bg-white rounded-lg shadow-bb-card p-4">
            <h3 className="text-sm font-semibold text-bb-text mb-3">Report Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-bb-textSoft">Type:</span>
                <span className="text-bb-text font-medium">{reportType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-bb-textSoft">Filters:</span>
                <span className="text-bb-text font-medium">{activeFilters.length || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-bb-textSoft">Columns:</span>
                <span className="text-bb-text font-medium">{columns.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Results */}
      {previewResult && (
        <div className="mt-6 bg-white rounded-lg shadow-bb-card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-bb-text">Preview: {previewResult.reportName}</h3>
              <p className="text-xs text-bb-textSoft">
                {previewResult.summary.totalRecords} records | Generated {new Date(previewResult.summary.generatedAt).toLocaleString('en-IN')}
              </p>
            </div>
            <button
              onClick={() => setPreviewResult(null)}
              className="text-bb-textSoft hover:text-bb-text text-sm"
            >
              Close Preview
            </button>
          </div>
          {previewResult.data.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-bb-textSoft">No data found for the selected filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {previewResult.columns.map(col => (
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
                  {previewResult.data.slice(0, 20).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      {previewResult.columns.map(col => (
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
              {previewResult.data.length > 20 && (
                <div className="px-4 py-3 border-t border-gray-100 text-center">
                  <p className="text-xs text-bb-textSoft">
                    Showing 20 of {previewResult.data.length} records. Save and run the full report to see all data.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Fallback column definitions matching the backend AVAILABLE_COLUMNS
function getDefaultColumns(type: ReportType): ReportColumn[] {
  switch (type) {
    case 'Sales':
      return [
        { id: 'orderNumber', label: 'Order Number', field: 'orderNumber', visible: true },
        { id: 'date', label: 'Date', field: 'createdAt', visible: true, isDate: true },
        { id: 'customerName', label: 'Customer', field: 'customerName', visible: true },
        { id: 'orderType', label: 'Order Type', field: 'orderType', visible: true },
        { id: 'subtotal', label: 'Subtotal', field: 'subtotal', visible: true, isCurrency: true },
        { id: 'taxAmount', label: 'Tax', field: 'taxAmount', visible: true, isCurrency: true },
        { id: 'discountAmount', label: 'Discount', field: 'discountAmount', visible: false, isCurrency: true },
        { id: 'total', label: 'Total', field: 'total', visible: true, isCurrency: true },
        { id: 'paymentMode', label: 'Payment Mode', field: 'paymentMode', visible: true },
        { id: 'status', label: 'Status', field: 'status', visible: true },
        { id: 'branchName', label: 'Branch', field: 'branchName', visible: false },
      ];
    case 'Products':
      return [
        { id: 'productName', label: 'Product Name', field: 'productName', visible: true },
        { id: 'sku', label: 'SKU', field: 'sku', visible: true },
        { id: 'categoryName', label: 'Category', field: 'categoryName', visible: true },
        { id: 'quantitySold', label: 'Qty Sold', field: 'quantitySold', visible: true },
        { id: 'revenue', label: 'Revenue', field: 'revenue', visible: true, isCurrency: true },
        { id: 'avgPrice', label: 'Avg Price', field: 'avgPrice', visible: true, isCurrency: true },
        { id: 'orderCount', label: 'Order Count', field: 'orderCount', visible: true },
        { id: 'returnCount', label: 'Returns', field: 'returnCount', visible: false },
      ];
    case 'Customers':
      return [
        { id: 'customerName', label: 'Name', field: 'customerName', visible: true },
        { id: 'email', label: 'Email', field: 'email', visible: true },
        { id: 'phone', label: 'Phone', field: 'phone', visible: true },
        { id: 'totalOrders', label: 'Total Orders', field: 'totalOrders', visible: true },
        { id: 'totalSpent', label: 'Total Spent', field: 'totalSpent', visible: true, isCurrency: true },
        { id: 'avgOrderValue', label: 'Avg Order Value', field: 'avgOrderValue', visible: true, isCurrency: true },
        { id: 'lastOrderDate', label: 'Last Order', field: 'lastOrderDate', visible: true, isDate: true },
        { id: 'customerGroup', label: 'Group', field: 'customerGroup', visible: false },
      ];
    case 'Inventory':
      return [
        { id: 'productName', label: 'Product Name', field: 'productName', visible: true },
        { id: 'sku', label: 'SKU', field: 'sku', visible: true },
        { id: 'currentStock', label: 'Current Stock', field: 'currentStock', visible: true },
        { id: 'reorderLevel', label: 'Reorder Level', field: 'reorderLevel', visible: true },
        { id: 'unitCost', label: 'Unit Cost', field: 'unitCost', visible: true, isCurrency: true },
        { id: 'totalValue', label: 'Total Value', field: 'totalValue', visible: true, isCurrency: true },
        { id: 'supplier', label: 'Supplier', field: 'supplier', visible: false },
        { id: 'lastRestockedAt', label: 'Last Restocked', field: 'lastRestockedAt', visible: false, isDate: true },
      ];
    case 'StaffPerformance':
      return [
        { id: 'staffName', label: 'Staff Name', field: 'staffName', visible: true },
        { id: 'role', label: 'Role', field: 'role', visible: true },
        { id: 'ordersHandled', label: 'Orders Handled', field: 'ordersHandled', visible: true },
        { id: 'totalRevenue', label: 'Revenue Generated', field: 'totalRevenue', visible: true, isCurrency: true },
        { id: 'avgOrderValue', label: 'Avg Order Value', field: 'avgOrderValue', visible: true, isCurrency: true },
        { id: 'hoursWorked', label: 'Hours Worked', field: 'hoursWorked', visible: false },
        { id: 'revenuePerHour', label: 'Revenue/Hour', field: 'revenuePerHour', visible: false, isCurrency: true },
      ];
  }
}

export default CustomReportBuilder;
