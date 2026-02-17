import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getSalesSummary,
  getTopProducts,
  getCustomerReport,
  getStaffPerformance,
  createReportShare,
  createReportComment,
  getReportComments,
  updateReportComment,
  deleteReportComment,
  getTeamMembers,
  type SalesSummary,
  type TopProducts,
  type CustomerReport,
  type StaffPerformance as StaffPerformanceType,
  type ReportComment,
  type TeamMember,
} from '../../services/reportsService';
import { useAuth } from '../../contexts/AuthContext';

type ReportType = 'sales' | 'products' | 'customers' | 'staff';

interface ComparisonMetric {
  label: string;
  period1: number;
  period2: number;
  change: number;
  percentChange: number;
  isCurrency?: boolean;
  isPercentage?: boolean;
}

const ReportBuilder = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [startDate1, setStartDate1] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate1, setEndDate1] = useState(() => new Date().toISOString().split('T')[0]);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [startDate2, setStartDate2] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    return d.toISOString().split('T')[0];
  });
  const [endDate2, setEndDate2] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ComparisonMetric[]>([]);

  // Share dialog state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sharePassword, setSharePassword] = useState('');
  const [shareExpiry, setShareExpiry] = useState<number>(30);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Comment state
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatValue = (value: number, metric: ComparisonMetric): string => {
    if (metric.isCurrency) return formatCurrency(value);
    if (metric.isPercentage) return `${value.toFixed(1)}%`;
    return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const calculateChange = (v1: number, v2: number): { change: number; percentChange: number } => {
    const change = v1 - v2;
    const percentChange = v2 !== 0 ? ((v1 - v2) / v2) * 100 : v1 > 0 ? 100 : 0;
    return { change, percentChange };
  };

  const buildSalesMetrics = (data1: SalesSummary, data2: SalesSummary): ComparisonMetric[] => {
    const p1 = data1.currentPeriod;
    const p2 = data2.currentPeriod;
    return [
      {
        label: 'Total Orders',
        period1: p1.totalOrders,
        period2: p2.totalOrders,
        ...calculateChange(p1.totalOrders, p2.totalOrders),
      },
      {
        label: 'Total Revenue',
        period1: p1.totalRevenue,
        period2: p2.totalRevenue,
        ...calculateChange(p1.totalRevenue, p2.totalRevenue),
        isCurrency: true,
      },
      {
        label: 'Avg Order Value',
        period1: p1.avgOrderValue,
        period2: p2.avgOrderValue,
        ...calculateChange(p1.avgOrderValue, p2.avgOrderValue),
        isCurrency: true,
      },
      {
        label: 'Total Discounts',
        period1: p1.totalDiscounts,
        period2: p2.totalDiscounts,
        ...calculateChange(p1.totalDiscounts, p2.totalDiscounts),
        isCurrency: true,
      },
      {
        label: 'Total Tax',
        period1: p1.totalTax,
        period2: p2.totalTax,
        ...calculateChange(p1.totalTax, p2.totalTax),
        isCurrency: true,
      },
    ];
  };

  const buildProductMetrics = (data1: TopProducts, data2: TopProducts): ComparisonMetric[] => {
    const totalQty1 = data1.topProducts.reduce((s, p) => s + p.quantitySold, 0);
    const totalQty2 = data2.topProducts.reduce((s, p) => s + p.quantitySold, 0);
    const totalRev1 = data1.topProducts.reduce((s, p) => s + p.revenue, 0);
    const totalRev2 = data2.topProducts.reduce((s, p) => s + p.revenue, 0);
    const avgRev1 = data1.topProducts.length > 0 ? totalRev1 / data1.topProducts.length : 0;
    const avgRev2 = data2.topProducts.length > 0 ? totalRev2 / data2.topProducts.length : 0;
    return [
      {
        label: 'Total Products Tracked',
        period1: data1.total,
        period2: data2.total,
        ...calculateChange(data1.total, data2.total),
      },
      {
        label: 'Total Quantity Sold (Top 10)',
        period1: totalQty1,
        period2: totalQty2,
        ...calculateChange(totalQty1, totalQty2),
      },
      {
        label: 'Total Revenue (Top 10)',
        period1: totalRev1,
        period2: totalRev2,
        ...calculateChange(totalRev1, totalRev2),
        isCurrency: true,
      },
      {
        label: 'Avg Revenue per Product',
        period1: avgRev1,
        period2: avgRev2,
        ...calculateChange(avgRev1, avgRev2),
        isCurrency: true,
      },
    ];
  };

  const buildCustomerMetrics = (data1: CustomerReport, data2: CustomerReport): ComparisonMetric[] => {
    return [
      {
        label: 'New Customers',
        period1: data1.newCustomers,
        period2: data2.newCustomers,
        ...calculateChange(data1.newCustomers, data2.newCustomers),
      },
      {
        label: 'Returning Customers',
        period1: data1.returningCustomers,
        period2: data2.returningCustomers,
        ...calculateChange(data1.returningCustomers, data2.returningCustomers),
      },
      {
        label: 'Total Customers',
        period1: data1.totalCustomersWithOrders,
        period2: data2.totalCustomersWithOrders,
        ...calculateChange(data1.totalCustomersWithOrders, data2.totalCustomersWithOrders),
      },
      {
        label: 'Avg Orders per Customer',
        period1: data1.avgOrdersPerCustomer,
        period2: data2.avgOrdersPerCustomer,
        ...calculateChange(data1.avgOrdersPerCustomer, data2.avgOrdersPerCustomer),
      },
      {
        label: 'Avg Spend per Customer',
        period1: data1.avgSpendPerCustomer,
        period2: data2.avgSpendPerCustomer,
        ...calculateChange(data1.avgSpendPerCustomer, data2.avgSpendPerCustomer),
        isCurrency: true,
      },
    ];
  };

  const buildStaffMetrics = (data1: StaffPerformanceType[], data2: StaffPerformanceType[]): ComparisonMetric[] => {
    const totalOrders1 = data1.reduce((s, m) => s + m.ordersProcessed, 0);
    const totalOrders2 = data2.reduce((s, m) => s + m.ordersProcessed, 0);
    const totalSales1 = data1.reduce((s, m) => s + m.totalSales, 0);
    const totalSales2 = data2.reduce((s, m) => s + m.totalSales, 0);
    const avgOrder1 = data1.length > 0 ? data1.reduce((s, m) => s + m.avgOrderValue, 0) / data1.length : 0;
    const avgOrder2 = data2.length > 0 ? data2.reduce((s, m) => s + m.avgOrderValue, 0) / data2.length : 0;
    return [
      {
        label: 'Active Staff',
        period1: data1.length,
        period2: data2.length,
        ...calculateChange(data1.length, data2.length),
      },
      {
        label: 'Total Orders Processed',
        period1: totalOrders1,
        period2: totalOrders2,
        ...calculateChange(totalOrders1, totalOrders2),
      },
      {
        label: 'Total Sales',
        period1: totalSales1,
        period2: totalSales2,
        ...calculateChange(totalSales1, totalSales2),
        isCurrency: true,
      },
      {
        label: 'Avg Order Value',
        period1: avgOrder1,
        period2: avgOrder2,
        ...calculateChange(avgOrder1, avgOrder2),
        isCurrency: true,
      },
    ];
  };

  const fetchComparisonData = useCallback(async () => {
    if (!compareEnabled) return;

    try {
      setLoading(true);
      setError(null);

      const sd1 = new Date(startDate1).toISOString();
      const ed1 = new Date(endDate1).toISOString();
      const sd2 = new Date(startDate2).toISOString();
      const ed2 = new Date(endDate2).toISOString();

      switch (reportType) {
        case 'sales': {
          const [res1, res2] = await Promise.all([
            getSalesSummary(sd1, ed1),
            getSalesSummary(sd2, ed2),
          ]);
          if (res1.success && res1.data && res2.success && res2.data) {
            setMetrics(buildSalesMetrics(res1.data, res2.data));
          } else {
            setError('Failed to load sales comparison data');
          }
          break;
        }
        case 'products': {
          const [res1, res2] = await Promise.all([
            getTopProducts(sd1, ed1, 10),
            getTopProducts(sd2, ed2, 10),
          ]);
          if (res1.success && res1.data && res2.success && res2.data) {
            setMetrics(buildProductMetrics(res1.data, res2.data));
          } else {
            setError('Failed to load product comparison data');
          }
          break;
        }
        case 'customers': {
          const [res1, res2] = await Promise.all([
            getCustomerReport(sd1, ed1),
            getCustomerReport(sd2, ed2),
          ]);
          if (res1.success && res1.data && res2.success && res2.data) {
            setMetrics(buildCustomerMetrics(res1.data, res2.data));
          } else {
            setError('Failed to load customer comparison data');
          }
          break;
        }
        case 'staff': {
          const [res1, res2] = await Promise.all([
            getStaffPerformance(sd1, ed1),
            getStaffPerformance(sd2, ed2),
          ]);
          if (res1.success && res1.data && res2.success && res2.data) {
            setMetrics(buildStaffMetrics(res1.data, res2.data));
          } else {
            setError('Failed to load staff comparison data');
          }
          break;
        }
      }
    } catch (err) {
      setError('An error occurred while loading comparison data');
      console.error('Report comparison error:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareEnabled, reportType, startDate1, endDate1, startDate2, endDate2]);

  useEffect(() => {
    if (compareEnabled) {
      fetchComparisonData();
    } else {
      setMetrics([]);
    }
  }, [compareEnabled, fetchComparisonData]);

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

  const getTopChanges = (): ComparisonMetric[] => {
    return [...metrics]
      .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
      .slice(0, 3);
  };

  const handleShare = async () => {
    try {
      setShareLoading(true);
      const reportConfig = {
        reportType,
        startDate1,
        endDate1,
        startDate2: compareEnabled ? startDate2 : undefined,
        endDate2: compareEnabled ? endDate2 : undefined,
        compareEnabled,
      };
      const reportData = {
        metrics: metrics.map(m => ({
          label: m.label,
          period1: m.period1,
          period2: m.period2,
          change: m.change,
          percentChange: m.percentChange,
          isCurrency: m.isCurrency,
          isPercentage: m.isPercentage,
        })),
      };

      const res = await createReportShare({
        reportType,
        reportConfig,
        reportData,
        password: sharePassword || undefined,
        expiresInDays: shareExpiry || undefined,
      });

      if (res.success && res.data) {
        const link = `${window.location.origin}/shared-reports/${res.data.shareToken}`;
        setShareLink(link);
      }
    } catch (err) {
      console.error('Error sharing report:', err);
    } finally {
      setShareLoading(false);
    }
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  // Fetch comments when report type changes
  const fetchComments = useCallback(async () => {
    try {
      const res = await getReportComments(reportType);
      if (res.success && res.data) {
        setComments(res.data.comments);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  }, [reportType]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Fetch team members for @mentions
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await getTeamMembers();
        if (res.success && res.data) {
          setTeamMembers(res.data.members);
        }
      } catch (err) {
        console.error('Error fetching team members:', err);
      }
    };
    fetchTeam();
  }, []);

  const extractMentions = (text: string): Array<{ userId: string; userName: string }> => {
    const mentionPattern = /@(\w[\w\s]*\w)/g;
    const foundMentions: Array<{ userId: string; userName: string }> = [];
    let match: RegExpExecArray | null;
    while ((match = mentionPattern.exec(text)) !== null) {
      const mentioned = teamMembers.find(m => m.name === match![1]);
      if (mentioned) {
        foundMentions.push({ userId: mentioned.id, userName: mentioned.name });
      }
    }
    return foundMentions;
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      setCommentLoading(true);
      const mentions = extractMentions(commentText);
      const res = await createReportComment({
        reportType,
        reportConfig: { startDate1, endDate1, startDate2, endDate2, compareEnabled },
        comment: commentText,
        mentions: mentions.length > 0 ? mentions : undefined,
      });
      if (res.success && res.data) {
        setComments(prev => [res.data!, ...prev]);
        setCommentText('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleEditComment = async (id: string) => {
    if (!editCommentText.trim()) return;
    try {
      const mentions = extractMentions(editCommentText);
      const res = await updateReportComment(id, editCommentText, mentions.length > 0 ? mentions : undefined);
      if (res.success && res.data) {
        setComments(prev => prev.map(c => (c.id === id ? res.data! : c)));
        setEditingCommentId(null);
        setEditCommentText('');
      }
    } catch (err) {
      console.error('Error editing comment:', err);
    }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      const res = await deleteReportComment(id);
      if (res.success) {
        setComments(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const value = (e.target as HTMLTextAreaElement).value;
    if (e.key === '@') {
      setShowMentions(true);
      setMentionSearch('');
    } else if (showMentions) {
      if (e.key === 'Escape') {
        setShowMentions(false);
      } else {
        const lastAt = value.lastIndexOf('@');
        if (lastAt >= 0) {
          setMentionSearch(value.slice(lastAt + 1));
        }
      }
    }
  };

  const insertMention = (member: TeamMember) => {
    const textarea = commentInputRef.current;
    if (!textarea) return;
    const value = editingCommentId ? editCommentText : commentText;
    const lastAt = value.lastIndexOf('@');
    const newValue = value.slice(0, lastAt) + `@${member.name} ` + value.slice(textarea.selectionEnd);
    if (editingCommentId) {
      setEditCommentText(newValue);
    } else {
      setCommentText(newValue);
    }
    setShowMentions(false);
  };

  const renderMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
      .replace(/@(\w[\w\s]*\w)/g, '<span class="text-blue-600 font-medium">@$1</span>')
      .replace(/\n/g, '<br/>');
  };

  const filteredMentions = teamMembers.filter(m =>
    m.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const reportTypeLabels: Record<ReportType, string> = {
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-bb-text">Report Comparison</h2>
        {metrics.length > 0 && (
          <button
            onClick={() => {
              setShowShareDialog(true);
              setShareLink(null);
              setSharePassword('');
              setShareExpiry(30);
              setShareCopied(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-bb-primary text-bb-text font-medium rounded-lg hover:bg-yellow-500 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share Report
          </button>
        )}
      </div>

      {/* Report Type Selector */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs text-bb-textSoft mb-1">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[180px]"
          >
            <option value="sales">Sales Summary</option>
            <option value="products">Product Performance</option>
            <option value="customers">Customer Analytics</option>
            <option value="staff">Staff Performance</option>
          </select>
        </div>
      </div>

      {/* Date Range Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Period 1 */}
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <h3 className="text-sm font-semibold text-bb-text mb-3">Period 1</h3>
          <div className="flex gap-3">
            <div>
              <label className="block text-xs text-bb-textSoft mb-1">Start Date</label>
              <input
                type="date"
                value={startDate1}
                onChange={(e) => setStartDate1(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-bb-textSoft mb-1">End Date</label>
              <input
                type="date"
                value={endDate1}
                onChange={(e) => setEndDate1(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Period 2 (Compare with) */}
        <div className={`bg-white rounded-lg shadow-bb-card p-4 ${!compareEnabled ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-bb-text">Compare with</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={compareEnabled}
                onChange={(e) => setCompareEnabled(e.target.checked)}
                className="w-4 h-4 text-bb-primary rounded"
              />
              <span className="text-xs text-bb-textSoft">Enable</span>
            </label>
          </div>
          <div className="flex gap-3">
            <div>
              <label className="block text-xs text-bb-textSoft mb-1">Start Date</label>
              <input
                type="date"
                value={startDate2}
                onChange={(e) => setStartDate2(e.target.value)}
                disabled={!compareEnabled}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs text-bb-textSoft mb-1">End Date</label>
              <input
                type="date"
                value={endDate2}
                onChange={(e) => setEndDate2(e.target.value)}
                disabled={!compareEnabled}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchComparisonData}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!compareEnabled && !loading && (
        <div className="bg-white rounded-lg shadow-bb-card p-8 text-center">
          <p className="text-bb-textSoft text-lg mb-2">Enable comparison to get started</p>
          <p className="text-sm text-bb-textSoft">
            Select two date ranges and enable the "Compare with" toggle to see a side-by-side
            comparison of your {reportTypeLabels[reportType].toLowerCase()} data.
          </p>
        </div>
      )}

      {/* Comparison Results */}
      {compareEnabled && !loading && !error && metrics.length > 0 && (
        <>
          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow-bb-card p-4 mb-6">
            <h3 className="text-sm font-semibold text-bb-text mb-3">Key Changes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {getTopChanges().map((metric) => (
                <div
                  key={metric.label}
                  className={`rounded-lg p-3 ${getChangeBg(metric.percentChange)}`}
                >
                  <p className="text-xs text-bb-textSoft">{metric.label}</p>
                  <p className={`text-lg font-bold ${getChangeColor(metric.percentChange)}`}>
                    {metric.percentChange > 0 ? '+' : ''}
                    {metric.percentChange.toFixed(1)}%
                  </p>
                  <p className="text-xs text-bb-textSoft">
                    {formatValue(metric.period2, metric)} {'\u2192'} {formatValue(metric.period1, metric)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-lg shadow-bb-card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-bb-text">
                {reportTypeLabels[reportType]} Comparison
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-bb-textSoft">Metric</th>
                    <th className="text-right px-4 py-3 font-medium text-bb-textSoft">
                      {formatDateLabel(startDate1, endDate1)}
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-bb-textSoft">
                      {formatDateLabel(startDate2, endDate2)}
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-bb-textSoft">Change</th>
                    <th className="text-right px-4 py-3 font-medium text-bb-textSoft">% Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {metrics.map((metric) => (
                    <tr key={metric.label} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-bb-text">{metric.label}</td>
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
        </>
      )}

      {/* Comments Section */}
      <div className="mt-6">
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <h3 className="text-base font-semibold text-bb-text mb-4">
            Comments ({comments.length})
          </h3>

          {/* Add Comment */}
          <div className="mb-4">
            <div className="relative">
              <textarea
                ref={commentInputRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleCommentKeyDown}
                placeholder="Add a comment... (supports **bold**, *italic*, `code`, @mentions)"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-bb-primary focus:border-transparent"
              />
              {showMentions && filteredMentions.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto w-64 z-10">
                  {filteredMentions.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => insertMention(member)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="w-6 h-6 bg-bb-primary rounded-full flex items-center justify-center text-xs font-bold text-bb-text">
                        {member.name.charAt(0)}
                      </span>
                      <span>{member.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end mt-2">
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim() || commentLoading}
                className="px-4 py-2 bg-bb-primary text-bb-text font-medium rounded-lg hover:bg-yellow-500 text-sm disabled:opacity-50"
              >
                {commentLoading ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>

          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-sm text-bb-textSoft text-center py-4">
              No comments yet. Be the first to add an insight!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 bg-bb-primary rounded-full flex items-center justify-center text-xs font-bold text-bb-text">
                        {c.userName.charAt(0)}
                      </span>
                      <span className="text-sm font-medium text-bb-text">{c.userName}</span>
                      <span className="text-xs text-bb-textSoft">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {c.editedAt && (
                        <span className="text-xs text-bb-textSoft italic">(edited)</span>
                      )}
                    </div>
                    {user && c.userId === user.id && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCommentId(c.id);
                            setEditCommentText(c.comment);
                          }}
                          className="text-xs text-bb-textSoft hover:text-bb-text px-2 py-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-xs text-bb-textSoft hover:text-red-600 px-2 py-1"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {editingCommentId === c.id ? (
                    <div>
                      <textarea
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-bb-primary focus:border-transparent"
                      />
                      <div className="flex gap-2 mt-2 justify-end">
                        <button
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditCommentText('');
                          }}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-xs text-bb-text hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEditComment(c.id)}
                          disabled={!editCommentText.trim()}
                          className="px-3 py-1 bg-bb-primary text-bb-text font-medium rounded-lg text-xs hover:bg-yellow-500 disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-sm text-bb-text"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(c.comment) }}
                    />
                  )}

                  {c.mentions && c.mentions.length > 0 && !editingCommentId && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.mentions.map((m) => (
                        <span
                          key={m.userId}
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"
                        >
                          @{m.userName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share Report Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-bb-text">Share Report</h3>
              <button
                onClick={() => setShowShareDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!shareLink ? (
              <>
                <p className="text-sm text-bb-textSoft mb-4">
                  Generate a shareable link for this {reportTypeLabels[reportType]} report.
                  Anyone with the link can view the report without logging in.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-bb-text mb-1">
                      Password Protection (optional)
                    </label>
                    <input
                      type="password"
                      value={sharePassword}
                      onChange={(e) => setSharePassword(e.target.value)}
                      placeholder="Leave empty for no password"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-bb-text mb-1">
                      Link Expiration
                    </label>
                    <select
                      value={shareExpiry}
                      onChange={(e) => setShareExpiry(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value={7}>7 days</option>
                      <option value={30}>30 days</option>
                      <option value={90}>90 days</option>
                      <option value={0}>Never expires</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowShareDialog(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-bb-text hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={shareLoading}
                    className="flex-1 px-4 py-2 bg-bb-primary text-bb-text font-medium rounded-lg hover:bg-yellow-500 text-sm disabled:opacity-50"
                  >
                    {shareLoading ? 'Generating...' : 'Generate Link'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-green-600 mb-4">
                  Link generated successfully! Share this link with anyone to give them view access.
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
                  />
                  <button
                    onClick={copyShareLink}
                    className="px-4 py-2 bg-bb-primary text-bb-text font-medium rounded-lg hover:bg-yellow-500 text-sm whitespace-nowrap"
                  >
                    {shareCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {sharePassword && (
                  <p className="text-xs text-bb-textSoft mb-2">
                    This link is password-protected. Share the password separately.
                  </p>
                )}

                <p className="text-xs text-bb-textSoft">
                  {shareExpiry > 0
                    ? `This link expires in ${shareExpiry} days.`
                    : 'This link never expires.'}
                </p>

                <button
                  onClick={() => setShowShareDialog(false)}
                  className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg text-sm text-bb-text hover:bg-gray-50"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportBuilder;
