import { useEffect, useState } from 'react';
import { getCustomerLTVReport, type CustomerLTVResponse, type CustomerLTV } from '../../services/reportsService';

const TopCustomersCLVWidget = () => {
  const [data, setData] = useState<CustomerLTVResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLTV = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getCustomerLTVReport();
        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError('Failed to load customer LTV data');
        }
      } catch (err) {
        setError('An error occurred while loading customer data');
        console.error('Customer LTV error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLTV();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-bb-card p-6">
        <h3 className="text-lg font-semibold text-bb-text mb-4">Top Customers by CLV</h3>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
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
        <h3 className="text-lg font-semibold text-bb-text mb-4">Top Customers by CLV</h3>
        <p className="text-bb-danger text-sm">{error}</p>
      </div>
    );
  }

  if (!data || data.customers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-bb-card p-6">
        <h3 className="text-lg font-semibold text-bb-text mb-4">Top Customers by CLV</h3>
        <p className="text-bb-textSoft text-sm">No customer data available</p>
      </div>
    );
  }

  const top10 = data.customers.slice(0, 10);

  const segmentColor = (segment: CustomerLTV['segment']) => {
    switch (segment) {
      case 'High': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-blue-100 text-blue-700';
      case 'Low': return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-bb-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-bb-text">Top Customers by CLV</h3>
        <div className="flex items-center gap-2 text-xs text-bb-textSoft">
          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600">
            {data.summary.atRiskCount} At Risk
          </span>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-700">{data.summary.highValueCount}</div>
          <div className="text-xs text-green-600">High Value</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-700">{data.summary.mediumValueCount}</div>
          <div className="text-xs text-blue-600">Medium</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-700">{data.summary.lowValueCount}</div>
          <div className="text-xs text-gray-600">Low</div>
        </div>
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {top10.map((customer, index) => (
          <div
            key={customer.customerId}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Rank */}
            <div className="w-6 h-6 rounded-full bg-bb-primary text-bb-text flex items-center justify-center text-xs font-bold flex-shrink-0">
              {index + 1}
            </div>

            {/* Customer Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-bb-text truncate">
                  {customer.name}
                </span>
                {customer.isAtRisk && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 flex-shrink-0">
                    At Risk
                  </span>
                )}
              </div>
              <div className="text-xs text-bb-textSoft">
                {customer.totalOrders} orders &middot; Avg ₹{customer.averageOrderValue.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Segment Badge */}
            <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${segmentColor(customer.segment)}`}>
              {customer.segment}
            </span>

            {/* Total Spent */}
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-semibold text-bb-text">
                ₹{customer.totalSpent.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-bb-textSoft">Total Spent</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm">
        <span className="text-bb-textSoft">
          Avg CLV: ₹{data.summary.averageLTV.toLocaleString('en-IN')}
        </span>
        <a
          href="/analytics-reports/cohort-analysis"
          className="text-bb-primary hover:underline font-medium text-sm"
        >
          View Full Profile
        </a>
      </div>
    </div>
  );
};

export default TopCustomersCLVWidget;
