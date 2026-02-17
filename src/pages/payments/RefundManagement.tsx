import React, { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import Modal from "../../components/ui/Modal";
import { TableSkeleton } from "../../components/Common";
import {
  OnlinePayment,
  OnlinePaymentStatus,
  RefundFilters,
  listPayments,
  initiateRefund,
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
} from "lucide-react";

const ITEMS_PER_PAGE = 20;

const REFUND_REASONS = [
  "Customer Request",
  "Duplicate Payment",
  "Order Cancelled",
  "Wrong Amount Charged",
  "Service Not Provided",
  "Quality Issue",
  "Other",
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: OnlinePaymentStatus) {
  const styles: Record<string, string> = {
    Completed: "bg-green-100 text-green-700",
    Refunded: "bg-purple-100 text-purple-700",
    PartiallyRefunded: "bg-orange-100 text-orange-700",
    Failed: "bg-red-100 text-red-700",
    Processing: "bg-blue-100 text-blue-700",
    Created: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status === "Completed" && <CheckCircle2 size={12} />}
      {status === "Failed" && <XCircle size={12} />}
      {status === "Processing" && <Clock size={12} />}
      {status === "Refunded" && <RotateCcw size={12} />}
      {status === "PartiallyRefunded" && <RotateCcw size={12} />}
      {status}
    </span>
  );
}

function getRefundStatusBadge(status: string) {
  const styles: Record<string, string> = {
    Processing: "bg-blue-100 text-blue-700",
    Completed: "bg-green-100 text-green-700",
    Failed: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status === "Processing" && <Loader2 size={12} className="animate-spin" />}
      {status === "Completed" && <CheckCircle2 size={12} />}
      {status === "Failed" && <XCircle size={12} />}
      {status}
    </span>
  );
}

// ============================================
// Issue Refund Modal
// ============================================

interface IssueRefundModalProps {
  open: boolean;
  onClose: () => void;
  payment: OnlinePayment;
  onRefundComplete: () => void;
}

const IssueRefundModal: React.FC<IssueRefundModalProps> = ({
  open,
  onClose,
  payment,
  onRefundComplete,
}) => {
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState(payment.amount.toString());
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const existingRefundTotal = useMemo(() => {
    if (!payment.refunds) return 0;
    return payment.refunds
      .filter((r) => r.status !== "Failed")
      .reduce((sum, r) => sum + r.amount, 0);
  }, [payment.refunds]);

  const maxRefundable = payment.amount - existingRefundTotal;

  useEffect(() => {
    if (refundType === "full") {
      setAmount(maxRefundable.toFixed(2));
    }
  }, [refundType, maxRefundable]);

  const isValidAmount = useMemo(() => {
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && numAmount > 0 && numAmount <= maxRefundable;
  }, [amount, maxRefundable]);

  const handleSubmit = async () => {
    if (!isValidAmount || !reason) return;
    try {
      setLoading(true);
      setError(null);
      const response = await initiateRefund({
        paymentId: payment.id,
        amount: parseFloat(amount),
        reason,
      });
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          onRefundComplete();
        }, 1500);
      } else {
        setError(response.error?.message || "Failed to process refund");
      }
    } catch {
      setError("An error occurred while processing the refund");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Modal open={open} onClose={onClose} className="w-full max-w-md p-6">
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle2 size={48} className="text-green-500" />
          <h3 className="text-lg font-semibold text-bb-text">Refund Initiated</h3>
          <p className="text-sm text-bb-textSoft">
            Refund of {formatCurrency(parseFloat(amount))} has been initiated successfully.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-md p-6">
      <h3 className="text-lg font-semibold text-bb-text mb-4">Issue Refund</h3>

      <div className="space-y-4">
        {/* Payment Info */}
        <div className="bg-bb-surfaceSoft rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-bb-textSoft">Order</span>
            <span className="font-medium">
              {payment.order?.orderNumber || payment.orderId}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-bb-textSoft">Amount Paid</span>
            <span className="font-medium">{formatCurrency(payment.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-bb-textSoft">Gateway</span>
            <span className="font-medium">{payment.gatewayProvider}</span>
          </div>
          {existingRefundTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-bb-textSoft">Already Refunded</span>
              <span className="font-medium text-orange-600">
                {formatCurrency(existingRefundTotal)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t pt-1">
            <span className="text-bb-textSoft">Max Refundable</span>
            <span className="font-semibold">{formatCurrency(maxRefundable)}</span>
          </div>
        </div>

        {/* Refund Type */}
        <div>
          <label className="block text-sm font-medium text-bb-text mb-2">
            Refund Type
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRefundType("full")}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                refundType === "full"
                  ? "border-bb-primary bg-bb-hover text-bb-text"
                  : "border-gray-200 text-bb-textSoft hover:border-gray-300"
              }`}
            >
              Full Refund
            </button>
            <button
              type="button"
              onClick={() => setRefundType("partial")}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                refundType === "partial"
                  ? "border-bb-primary bg-bb-hover text-bb-text"
                  : "border-gray-200 text-bb-textSoft hover:border-gray-300"
              }`}
            >
              Partial Refund
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-bb-text mb-1">
            Refund Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bb-textSoft">
              ₹
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                if (/^\d*\.?\d{0,2}$/.test(e.target.value)) {
                  setAmount(e.target.value);
                }
              }}
              disabled={refundType === "full"}
              className={`w-full pl-8 pr-3 py-2 border rounded-lg text-sm ${
                refundType === "full"
                  ? "bg-gray-50 text-bb-textSoft"
                  : "bg-white text-bb-text"
              } ${!isValidAmount && amount ? "border-red-300" : "border-gray-200"}`}
              placeholder="0.00"
            />
          </div>
          {!isValidAmount && amount && (
            <p className="text-xs text-red-500 mt-1">
              Amount must be between ₹0.01 and {formatCurrency(maxRefundable)}
            </p>
          )}
        </div>

        {/* Reason Dropdown */}
        <div>
          <label className="block text-sm font-medium text-bb-text mb-1">
            Reason
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-bb-text"
          >
            <option value="">Select a reason</option>
            {REFUND_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium text-bb-textSoft hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !isValidAmount || !reason}
            className="flex-1 py-2 px-4 bg-bb-primary text-bb-text rounded-lg text-sm font-medium hover:bg-bb-primarySoft transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Processing..." : "Issue Refund"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================
// Refund Management Page
// ============================================

const RefundManagement: React.FC = () => {
  const [payments, setPayments] = useState<OnlinePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<OnlinePayment | null>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  const filters: RefundFilters = useMemo(
    () => ({
      status: statusFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: search || undefined,
    }),
    [statusFilter, startDate, endDate, search]
  );

  const loadPayments = useCallback(
    async (page: number, activeFilters: RefundFilters) => {
      try {
        setLoading(true);
        setError(null);
        const response = await listPayments(activeFilters, page, ITEMS_PER_PAGE);
        if (response.success && response.data) {
          setPayments(response.data.payments);
          const total = response.data.total || 0;
          setTotalPages(Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)));
        } else {
          setError(response.error?.message || "Failed to load payments");
        }
      } catch {
        setError("Failed to load payments. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadPayments(currentPage, filters);
  }, [currentPage, filters, loadPayments]);

  const handleRefundClick = (payment: OnlinePayment) => {
    setSelectedPayment(payment);
    setRefundModalOpen(true);
  };

  const handleRefundComplete = () => {
    setRefundModalOpen(false);
    setSelectedPayment(null);
    loadPayments(currentPage, filters);
  };

  const canRefund = (payment: OnlinePayment): boolean => {
    return (
      payment.status === "Completed" || payment.status === "PartiallyRefunded"
    );
  };

  const headers = [
    "Order",
    "Amount",
    "Gateway",
    "Payment Status",
    "Refund Status",
    "Refund Amount",
    "Date",
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
                Refund Management
              </h1>
              <button
                onClick={() => loadPayments(currentPage, filters)}
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
                    placeholder="Search by order number or payment ID..."
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
                  <option value="Completed">Completed</option>
                  <option value="Refunded">Refunded</option>
                  <option value="PartiallyRefunded">Partially Refunded</option>
                  <option value="Failed">Failed</option>
                  <option value="Processing">Processing</option>
                </select>

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
                    onClick={() => loadPayments(currentPage, filters)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-bb-text bg-bb-primary rounded-lg hover:bg-bb-primarySoft transition-colors"
                  >
                    <RotateCcw size={14} />
                    Retry
                  </button>
                </div>
              ) : payments.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16">
                  <p className="text-sm text-bb-textSoft">No payments found</p>
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
                      {payments.map((payment) => {
                        const refundTotal =
                          payment.refunds
                            ?.filter((r) => r.status !== "Failed")
                            .reduce((sum, r) => sum + r.amount, 0) || 0;
                        const latestRefund =
                          payment.refunds && payment.refunds.length > 0
                            ? payment.refunds[payment.refunds.length - 1]
                            : null;

                        return (
                          <tr
                            key={payment.id}
                            className="hover:bg-bb-hover/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-bb-text">
                                {payment.order?.orderNumber || "—"}
                              </div>
                              <div className="text-xs text-bb-textSoft truncate max-w-[120px]">
                                {payment.id}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-medium text-bb-text">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-4 py-3 text-bb-textSoft">
                              {payment.gatewayProvider}
                            </td>
                            <td className="px-4 py-3">
                              {getStatusBadge(payment.status)}
                            </td>
                            <td className="px-4 py-3">
                              {latestRefund
                                ? getRefundStatusBadge(latestRefund.status)
                                : <span className="text-bb-muted text-xs">—</span>}
                            </td>
                            <td className="px-4 py-3 text-bb-text">
                              {refundTotal > 0
                                ? formatCurrency(refundTotal)
                                : <span className="text-bb-muted">—</span>}
                            </td>
                            <td className="px-4 py-3 text-bb-textSoft whitespace-nowrap">
                              {formatDate(payment.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              {canRefund(payment) ? (
                                <button
                                  onClick={() => handleRefundClick(payment)}
                                  className="px-3 py-1.5 text-xs font-medium text-bb-text bg-bb-primary rounded-lg hover:bg-bb-primarySoft transition-colors"
                                >
                                  Refund
                                </button>
                              ) : (
                                <span className="text-xs text-bb-muted">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {!loading && !error && payments.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <span className="text-sm text-bb-textSoft">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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

      {/* Refund Modal */}
      {selectedPayment && (
        <IssueRefundModal
          open={refundModalOpen}
          onClose={() => {
            setRefundModalOpen(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
          onRefundComplete={handleRefundComplete}
        />
      )}
    </DashboardLayout>
  );
};

export default RefundManagement;
