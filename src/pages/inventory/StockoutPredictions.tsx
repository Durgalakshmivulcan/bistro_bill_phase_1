import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBranch } from '../../contexts/BranchContext';
import {
  getStockoutPredictions,
  type StockoutPredictionResponse,
  type StockoutPrediction,
} from '../../services/reportsService';

const StockoutPredictions = () => {
  const { user } = useAuth();
  const { currentBranchId, currentBranch, availableBranches, isAllLocationsSelected } = useBranch();
  const [data, setData] = useState<StockoutPredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const businessOwnerFallbackBranchId =
    user && 'branches' in user ? user.branches?.[0]?.id : undefined;

  const branchId =
    user?.userType === 'Staff'
      ? user.branch?.id
      : !isAllLocationsSelected && currentBranchId
        ? currentBranchId
        : currentBranch?.id || availableBranches[0]?.id || businessOwnerFallbackBranchId;

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!branchId) {
        setData(null);
        setError(
          isAllLocationsSelected
            ? 'Select a branch to view stockout predictions.'
            : 'No branch selected for stockout predictions.'
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getStockoutPredictions(branchId);
        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError('Failed to load stockout predictions');
        }
      } catch (err) {
        setError('An error occurred while loading predictions');
        console.error('Stockout predictions error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, isAllLocationsSelected]);

  const getStatusBadge = (status: StockoutPrediction['status']) => {
    switch (status) {
      case 'Critical':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Critical
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Low
          </span>
        );
      case 'Safe':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Safe
          </span>
        );
    }
  };

  const getRowClass = (status: StockoutPrediction['status']) => {
    switch (status) {
      case 'Critical':
        return 'bg-red-50';
      case 'Low':
        return 'bg-yellow-50';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-bb-text mb-6">Inventory Stockout Predictions</h2>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="h-20 bg-gray-200 rounded-lg" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-full" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-bb-text mb-6">Inventory Stockout Predictions</h2>
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

  if (!data || data.predictions.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-bb-text mb-6">Inventory Stockout Predictions</h2>
        <p className="text-bb-textSoft">No inventory products found for predictions.</p>
      </div>
    );
  }

  const { predictions, summary } = data;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-bb-text">Inventory Stockout Predictions</h2>
        <button
          onClick={() => {
            // Navigate to create PO for all critical items
            const criticalIds = predictions
              .filter((p) => p.status === 'Critical')
              .map((p) => p.productId)
              .join(',');
            if (criticalIds) {
              window.location.href = `/purchaseorder/create?products=${criticalIds}`;
            }
          }}
          disabled={summary.criticalCount === 0}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create PO for All Critical Items ({summary.criticalCount})
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-bb-card p-4">
          <p className="text-sm text-bb-textSoft">Total Products</p>
          <p className="text-2xl font-bold text-bb-text">{summary.totalProducts}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow-bb-card p-4 border border-red-200">
          <p className="text-sm text-red-600">Critical (&lt; 7 days)</p>
          <p className="text-2xl font-bold text-red-700">{summary.criticalCount}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-bb-card p-4 border border-yellow-200">
          <p className="text-sm text-yellow-600">Low (&lt; 14 days)</p>
          <p className="text-2xl font-bold text-yellow-700">{summary.lowCount}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow-bb-card p-4 border border-green-200">
          <p className="text-sm text-green-600">Safe (&gt; 14 days)</p>
          <p className="text-2xl font-bold text-green-700">{summary.safeCount}</p>
        </div>
      </div>

      {/* Predictions Table */}
      <div className="bg-white rounded-lg shadow-bb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-bb-textSoft">Product</th>
                <th className="text-right px-4 py-3 font-medium text-bb-textSoft">Current Stock</th>
                <th className="text-right px-4 py-3 font-medium text-bb-textSoft">Daily Usage</th>
                <th className="text-right px-4 py-3 font-medium text-bb-textSoft">Days Remaining</th>
                <th className="text-right px-4 py-3 font-medium text-bb-textSoft">Suggested Order Qty</th>
                <th className="text-center px-4 py-3 font-medium text-bb-textSoft">Status</th>
                <th className="text-center px-4 py-3 font-medium text-bb-textSoft">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {predictions.map((prediction) => (
                <tr key={prediction.productId} className={getRowClass(prediction.status)}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-bb-text">{prediction.productName}</p>
                      {prediction.supplierName && (
                        <p className="text-xs text-bb-textSoft">{prediction.supplierName}</p>
                      )}
                    </div>
                  </td>
                  <td className="text-right px-4 py-3 text-bb-text">
                    {prediction.currentStock} {prediction.unit || ''}
                  </td>
                  <td className="text-right px-4 py-3 text-bb-text">
                    {prediction.dailyUsageRate} {prediction.unit ? `${prediction.unit}/day` : '/day'}
                  </td>
                  <td className="text-right px-4 py-3">
                    <span
                      className={`font-medium ${
                        prediction.daysUntilStockout < 7
                          ? 'text-red-700'
                          : prediction.daysUntilStockout < 14
                            ? 'text-yellow-700'
                            : 'text-green-700'
                      }`}
                    >
                      {prediction.daysUntilStockout >= 999 ? 'N/A' : prediction.daysUntilStockout}
                    </span>
                  </td>
                  <td className="text-right px-4 py-3 text-bb-text">
                    {prediction.suggestedReorderQty > 0
                      ? `${prediction.suggestedReorderQty} ${prediction.unit || ''}`
                      : '-'}
                  </td>
                  <td className="text-center px-4 py-3">{getStatusBadge(prediction.status)}</td>
                  <td className="text-center px-4 py-3">
                    <button
                      onClick={() => {
                        window.location.href = `/purchaseorder/create?products=${prediction.productId}`;
                      }}
                      className="text-xs px-3 py-1.5 bg-bb-primary text-bb-text font-medium rounded hover:bg-amber-400"
                    >
                      Create PO
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Info */}
      <div className="mt-4 text-xs text-bb-textSoft">
        <p>
          Analysis based on {data.modelInfo.dataPointsUsed} products using {data.modelInfo.method} over
          the last {data.modelInfo.lookbackDays} days.
        </p>
      </div>
    </div>
  );
};

export default StockoutPredictions;
