import React, { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import Modal from "../../components/ui/Modal";
import { TableSkeleton } from "../../components/Common";
import {
  UPIAutoPaySubscription,
  AutoPayStatus,
  AutoPayFilters,
  listSubscriptions,
  cancelSubscription,
  retrySubscriptionCharge,
} from "../../services/paymentService";
import {
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Play,
  Calendar,
  Ban,
} from "lucide-react";

const ITEMS_PER_PAGE = 20;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: AutoPayStatus) {
  const styles: Record<string, string> = {
    Active: "bg-green-100 text-green-700",
    Created: "bg-gray-100 text-gray-700",
    Cancelled: "bg-red-100 text-red-700",
    Failed: "bg-orange-100 text-orange-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status === "Active" && <CheckCircle2 size={12} />}
      {status === "Created" && <Clock size={12} />}
      {status === "Cancelled" && <XCircle size={12} />}
      {status === "Failed" && <AlertTriangle size={12} />}
      {status}
    </span>
  );
}

// ============================================
// Cancel Subscription Modal
// ============================================

interface CancelModalProps {
  open: boolean;
  onClose: () => void;
  subscription: UPIAutoPaySubscription;
  onCancelComplete: () => void;
}

const CancelSubscriptionModal: React.FC<CancelModalProps> = ({
  open,
  onClose,
  subscription,
  onCancelComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCancel = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cancelSubscription(subscription.id);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          onCancelComplete();
        }, 1500);
      } else {
        setError(response.error?.message || "Failed to cancel subscription");
      }
    } catch {
      setError("An error occurred while cancelling the subscription");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Modal open={open} onClose={onClose} className="w-full max-w-md p-6">
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle2 size={48} className="text-green-500" />
          <h3 className="text-lg font-semibold text-bb-text">
            Subscription Cancelled
          </h3>
          <p className="text-sm text-bb-textSoft">
            The subscription has been cancelled successfully.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-md p-6">
      <h3 className="text-lg font-semibold text-bb-text mb-4">
        Cancel Subscription
      </h3>

      <div className="space-y-4">
        <div className="bg-bb-surfaceSoft rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-bb-textSoft">Plan</span>
            <span className="font-medium">
              {subscription.plan?.name || subscription.planId}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-bb-textSoft">Amount</span>
            <span className="font-medium">
              {formatCurrency(subscription.amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-bb-textSoft">Interval</span>
            <span className="font-medium capitalize">
              {subscription.interval}
            </span>
          </div>
          {subscription.upiId && (
            <div className="flex justify-between">
              <span className="text-bb-textSoft">UPI ID</span>
              <span className="font-medium">{subscription.upiId}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
          <AlertTriangle size={16} />
          This action cannot be undone. The customer will no longer be charged
          automatically.
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium text-bb-textSoft hover:bg-gray-50 transition-colors"
          >
            Keep Active
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Cancelling..." : "Cancel Subscription"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================
// Subscription Details Modal
// ============================================

interface DetailsModalProps {
  open: boolean;
  onClose: () => void;
  subscription: UPIAutoPaySubscription;
}

const SubscriptionDetailsModal: React.FC<DetailsModalProps> = ({
  open,
  onClose,
  subscription,
}) => {
  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-lg p-6">
      <h3 className="text-lg font-semibold text-bb-text mb-4">
        Subscription Details
      </h3>

      <div className="space-y-4">
        {/* Status & Plan */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-bb-text">
            {subscription.plan?.name || subscription.planId}
          </span>
          {getStatusBadge(subscription.status)}
        </div>

        {/* Details Grid */}
        <div className="bg-bb-surfaceSoft rounded-lg p-3 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-bb-textSoft">Subscription ID</span>
            <span className="font-mono text-xs">
              {subscription.gatewaySubscriptionId}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-bb-textSoft">Amount</span>
            <span className="font-medium">
              {formatCurrency(subscription.amount)} / {subscription.interval}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-bb-textSoft">Gateway</span>
            <span className="font-medium">{subscription.gatewayProvider}</span>
          </div>
          {subscription.upiId && (
            <div className="flex justify-between">
              <span className="text-bb-textSoft">UPI ID</span>
              <span className="font-medium">{subscription.upiId}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-bb-textSoft">Created</span>
            <span>{formatDateTime(subscription.createdAt)}</span>
          </div>
        </div>

        {/* Billing Info */}
        <div className="bg-bb-surfaceSoft rounded-lg p-3 text-sm space-y-2">
          <h4 className="font-medium text-bb-text mb-1">Billing History</h4>
          <div className="flex justify-between">
            <span className="text-bb-textSoft">Charges Completed</span>
            <span className="font-medium">
              {subscription.paidCount}
              {subscription.totalCount
                ? ` / ${subscription.totalCount}`
                : ""}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-bb-textSoft">Current Period</span>
            <span>
              {formatDate(subscription.currentStart)} –{" "}
              {formatDate(subscription.currentEnd)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-bb-textSoft">Next Billing</span>
            <span className="font-medium">
              {formatDate(subscription.nextBillingDate)}
            </span>
          </div>
          {subscription.lastPaymentAt && (
            <div className="flex justify-between">
              <span className="text-bb-textSoft">Last Payment</span>
              <span>{formatDateTime(subscription.lastPaymentAt)}</span>
            </div>
          )}
        </div>

        {/* Failure Info */}
        {subscription.failureReason && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Payment Failed</p>
              <p className="text-red-500">{subscription.failureReason}</p>
            </div>
          </div>
        )}

        {subscription.cancelledAt && (
          <div className="flex items-center gap-2 text-sm text-bb-textSoft bg-gray-50 p-3 rounded-lg">
            <Ban size={16} />
            Cancelled on {formatDateTime(subscription.cancelledAt)}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-bb-textSoft hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================
// UPI AutoPay Management Page
// ============================================

const UPIAutoPayManagement: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<UPIAutoPaySubscription[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSubscription, setSelectedSubscription] =
    useState<UPIAutoPaySubscription | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const filters: AutoPayFilters = useMemo(
    () => ({
      status: statusFilter || undefined,
      planId: planFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: search || undefined,
    }),
    [statusFilter, planFilter, startDate, endDate, search]
  );

  const loadSubscriptions = useCallback(
    async (page: number, activeFilters: AutoPayFilters) => {
      try {
        setLoading(true);
        setError(null);
        const response = await listSubscriptions(
          activeFilters,
          page,
          ITEMS_PER_PAGE
        );
        if (response.success && response.data) {
          setSubscriptions(response.data.subscriptions);
          const total = response.data.total || 0;
          setTotalPages(Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)));
        } else {
          setError(
            response.error?.message || "Failed to load subscriptions"
          );
        }
      } catch {
        setError("Failed to load subscriptions. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadSubscriptions(currentPage, filters);
  }, [currentPage, filters, loadSubscriptions]);

  const handleCancelClick = (sub: UPIAutoPaySubscription) => {
    setSelectedSubscription(sub);
    setCancelModalOpen(true);
  };

  const handleDetailsClick = (sub: UPIAutoPaySubscription) => {
    setSelectedSubscription(sub);
    setDetailsModalOpen(true);
  };

  const handleCancelComplete = () => {
    setCancelModalOpen(false);
    setSelectedSubscription(null);
    loadSubscriptions(currentPage, filters);
  };

  const handleRetry = async (sub: UPIAutoPaySubscription) => {
    try {
      setRetryingId(sub.id);
      const response = await retrySubscriptionCharge(sub.id);
      if (response.success) {
        loadSubscriptions(currentPage, filters);
      }
    } catch {
      // Silently handle - will refresh on next load
    } finally {
      setRetryingId(null);
    }
  };

  const planNames = useMemo(() => {
    const names = new Set<string>();
    subscriptions.forEach((s) => {
      if (s.plan?.name) names.add(s.plan.name);
    });
    return Array.from(names);
  }, [subscriptions]);

  const headers = [
    "Plan",
    "Amount",
    "Interval",
    "Status",
    "UPI ID",
    "Next Billing",
    "Charges",
    "Actions",
  ];

  return (
    <DashboardLayout>
      <div className="bb-shell">
        <div className="bb-frame flex flex-col">
          <main className="flex-1 bg-[#FFFBF3] px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h1 className="text-xl font-semibold text-bb-text">
                UPI AutoPay Management
              </h1>
              <button
                onClick={() => loadSubscriptions(currentPage, filters)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-bb-text bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-bb-card p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-bb-textSoft"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by subscription ID or UPI ID..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-bb-text placeholder:text-bb-muted"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-bb-text"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Created">Created</option>
                  <option value="Failed">Failed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                {/* Plan Filter */}
                {planNames.length > 0 && (
                  <select
                    value={planFilter}
                    onChange={(e) => {
                      setPlanFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-bb-text"
                  >
                    <option value="">All Plans</option>
                    {planNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Date Range */}
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-bb-text"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-bb-text"
                />
              </div>
            </div>

            {/* Failed Charges Alert */}
            {!loading &&
              subscriptions.some((s) => s.status === "Failed") && (
                <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                  <AlertTriangle
                    size={20}
                    className="text-orange-600 shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800">
                      Failed Charges Detected
                    </p>
                    <p className="text-xs text-orange-600">
                      {
                        subscriptions.filter((s) => s.status === "Failed")
                          .length
                      }{" "}
                      subscription(s) have failed charges. Review and retry
                      payments.
                    </p>
                  </div>
                </div>
              )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-bb-card overflow-hidden">
              {loading ? (
                <div className="p-6">
                  <TableSkeleton />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <AlertCircle size={40} className="text-bb-danger" />
                  <p className="text-sm text-bb-textSoft">{error}</p>
                  <button
                    onClick={() => loadSubscriptions(currentPage, filters)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-bb-text bg-bb-primary rounded-lg hover:bg-bb-primarySoft transition-colors"
                  >
                    <RotateCcw size={14} />
                    Retry
                  </button>
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16">
                  <Calendar size={40} className="text-bb-textSoft" />
                  <p className="text-sm text-bb-textSoft">
                    No subscriptions found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full text-sm">
                    <thead className="bg-bb-primary text-bb-text">
                      <tr>
                        {headers.map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left font-medium whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {subscriptions.map((sub) => (
                        <tr
                          key={sub.id}
                          className="hover:bg-bb-hover/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-bb-text">
                              {sub.plan?.name || sub.planId}
                            </div>
                            <div className="text-xs text-bb-textSoft truncate max-w-[120px]">
                              {sub.gatewaySubscriptionId}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-bb-text">
                            {formatCurrency(sub.amount)}
                          </td>
                          <td className="px-4 py-3 text-bb-textSoft capitalize">
                            {sub.interval}
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(sub.status)}
                          </td>
                          <td className="px-4 py-3 text-bb-textSoft">
                            {sub.upiId || "—"}
                          </td>
                          <td className="px-4 py-3 text-bb-textSoft whitespace-nowrap">
                            {formatDate(sub.nextBillingDate)}
                          </td>
                          <td className="px-4 py-3 text-bb-text">
                            {sub.paidCount}
                            {sub.totalCount ? ` / ${sub.totalCount}` : ""}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDetailsClick(sub)}
                                className="px-3 py-1.5 text-xs font-medium text-bb-text bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Details
                              </button>
                              {sub.status === "Failed" && (
                                <button
                                  onClick={() => handleRetry(sub)}
                                  disabled={retryingId === sub.id}
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  {retryingId === sub.id ? (
                                    <Loader2
                                      size={12}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Play size={12} />
                                  )}
                                  Retry
                                </button>
                              )}
                              {sub.status === "Active" && (
                                <button
                                  onClick={() => handleCancelClick(sub)}
                                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {!loading &&
                !error &&
                subscriptions.length > 0 &&
                totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                    <span className="text-sm text-bb-textSoft">
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage <= 1}
                        className="p-1.5 rounded-lg border border-gray-200 text-bb-textSoft hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage >= totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 text-bb-textSoft hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </main>
        </div>
      </div>

      {/* Cancel Modal */}
      {selectedSubscription && (
        <CancelSubscriptionModal
          open={cancelModalOpen}
          onClose={() => {
            setCancelModalOpen(false);
            setSelectedSubscription(null);
          }}
          subscription={selectedSubscription}
          onCancelComplete={handleCancelComplete}
        />
      )}

      {/* Details Modal */}
      {selectedSubscription && (
        <SubscriptionDetailsModal
          open={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedSubscription(null);
          }}
          subscription={selectedSubscription}
        />
      )}
    </DashboardLayout>
  );
};

export default UPIAutoPayManagement;
