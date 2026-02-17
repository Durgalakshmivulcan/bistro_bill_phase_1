import { useEffect, useState } from 'react';
import { getSubscription, SubscriptionInfo } from '../../services/settingsService';

const SubscriptionPage = () => {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    setLoading(true);
    setError(null);

    const response = await getSubscription();

    if (response.success && response.data) {
      setSubscription(response.data);
    } else {
      setError(response.error?.message || 'Failed to load subscription');
    }

    setLoading(false);
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getBranchUsagePercentage = (): number => {
    if (!subscription) return 0;
    return (subscription.currentBranches / subscription.maxBranches) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bb-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadSubscription}
          className="mt-4 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">No active subscription found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
        {/* Plan Card */}
        <div className="border rounded-lg p-6 bg-white overflow-y-auto">
          <div className="flex justify-between items-center mb-4 ">
            <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-sm">
              {subscription.planName}
            </span>
            <span className="text-lg font-medium">
              ₹{subscription.planPrice.toFixed(2)}/Month
            </span>
          </div>

          <p className="text-sm mb-4">
            {subscription.currentBranches} of {subscription.maxBranches} Branches
          </p>

          <div className="w-full bg-gray-200 h-2 rounded mb-4">
            <div
              className="bg-yellow-500 h-2 rounded"
              style={{ width: `${getBranchUsagePercentage()}%` }}
            ></div>
          </div>

          <button className="bg-black text-white px-4 py-2 rounded-md">
            Upgrade Plan
          </button>
        </div>

        {/* Next Payment Card */}
        <div className="border rounded-lg p-6 bg-white flex flex-col justify-between">
          <p className="text-lg">
            Next Payment On <br />
            <span className="font-medium">
              {formatDate(subscription.subscriptionEndDate)}
            </span>
          </p>

          <button className="bg-black text-white px-4 py-2 rounded-md mt-6">
            Make Payment
          </button>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="border rounded-lg bg-[#FFF9E8] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-yellow-400">
            <tr>
              <th className="text-left px-4 py-3">S. No</th>
              <th className="text-left px-4 py-3">Invoice</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-center px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr className="bg-white">
              <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                Invoice history coming soon
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscriptionPage;
