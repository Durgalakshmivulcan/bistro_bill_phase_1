import React, { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import Modal from "../../components/ui/Modal";
import { TableSkeleton } from "../../components/Common";
import {
  GatewayProvider,
  ReconciliationRecord,
  ReconciliationFilters,
  ReconciliationReport,
  listReconciliations,
  runReconciliation,
  resolveReconciliation,
} from "../../services/paymentService";
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Play,
  CheckSquare,
} from "lucide-react";

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
  });
}

function getStatusBadge(status: string) {
  const config: Record<string, { bg: string; icon: React.ReactNode }> = {
    Reconciled: {
      bg: "bg-green-100 text-green-700",
      icon: <CheckCircle2 size={12} />,
    },
    Disputed: {
      bg: "bg-red-100 text-red-700",
      icon: <AlertTriangle size={12} />,
    },
    Settled: {
      bg: "bg-blue-100 text-blue-700",
      icon: <CheckSquare size={12} />,
    },
  };
  const c = config[status] || { bg: "bg-gray-100 text-gray-700", icon: null };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg}`}
    >
      {c.icon}
      {status}
    </span>
  );
}

// ============================================
// Discrepancy Details Modal
// ============================================

interface DetailsModalProps {
  open: boolean;
  onClose: () => void;
  record: ReconciliationRecord;
  report: ReconciliationReport | null;
  loading: boolean;
  onResolve: () => void;
  resolving: boolean;
}

const DetailsModal: React.FC<DetailsModalProps> = ({
  open,
  onClose,
  record,
  report,
  loading,
  onResolve,
  resolving,
}) => {
  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-2xl p-6">
      <h3 className="text-lg font-semibold text-bb-text mb-4">
        Reconciliation Details
      </h3>

      {/* Summary */}
      <div className="bg-bb-surfaceSoft rounded-lg p-3 text-sm space-y-1 mb-4">
        <div className="flex justify-between">
          <span className="text-bb-textSoft">Settlement Date</span>
          <span className="font-medium">{formatDate(record.settlementDate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-bb-textSoft">Gateway</span>
          <span className="font-medium">{record.gatewayProvider}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-bb-textSoft">Total Payments</span>
          <span className="font-medium">{formatCurrency(record.totalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-bb-textSoft">Fees</span>
          <span className="font-medium text-red-600">
            -{formatCurrency(record.fees)}
          </span>
        </div>
        <div className="flex justify-between border-t pt-1">
          <span className="text-bb-textSoft">Net Settlement</span>
          <span className="font-semibold">{formatCurrency(record.settledAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-bb-textSoft">Transactions</span>
          <span className="font-medium">{record.transactionCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-bb-textSoft">Status</span>
          {getStatusBadge(record.status)}
        </div>
      </div>

      {/* Discrepancies */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-bb-textSoft">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading discrepancy details...</span>
        </div>
      ) : report && report.discrepancies.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold text-bb-text mb-2">
            Discrepancies ({report.discrepancies.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {report.discrepancies.map((d, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 text-sm border ${
                  d.type === "amount_mismatch"
                    ? "bg-orange-50 border-orange-200"
                    : d.type === "missing_in_gateway"
                      ? "bg-red-50 border-red-200"
                      : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-xs uppercase tracking-wide">
                    {d.type === "amount_mismatch"
                      ? "Amount Mismatch"
                      : d.type === "missing_in_gateway"
                        ? "Missing in Gateway"
                        : "Missing in Local"}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{d.details}</p>
                {d.type === "amount_mismatch" && (
                  <div className="flex gap-4 mt-1 text-xs">
                    <span>
                      Gateway: <strong>{formatCurrency(d.gatewayAmount || 0)}</strong>
                    </span>
                    <span>
                      Local: <strong>{formatCurrency(d.localAmount || 0)}</strong>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : report ? (
        <div className="flex flex-col items-center gap-2 py-6 text-green-600">
          <CheckCircle2 size={32} />
          <p className="text-sm font-medium">No discrepancies found</p>
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex gap-3 pt-4 mt-4 border-t">
        <button
          onClick={onClose}
          className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium text-bb-textSoft hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
        {record.status === "Disputed" && (
          <button
            onClick={onResolve}
            disabled={resolving}
            className="flex-1 py-2 px-4 bg-bb-primary text-bb-text rounded-lg text-sm font-medium hover:bg-bb-primarySoft transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {resolving && <Loader2 size={16} className="animate-spin" />}
            {resolving ? "Resolving..." : "Mark as Resolved"}
          </button>
        )}
      </div>
    </Modal>
  );
};

// ============================================
// Run Reconciliation Modal
// ============================================

interface RunReconciliationModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const RunReconciliationModal: React.FC<RunReconciliationModalProps> = ({
  open,
  onClose,
  onComplete,
}) => {
  const [provider, setProvider] = useState<GatewayProvider>("Razorpay");
  const [settlementDate, setSettlementDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRun = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await runReconciliation({
        provider,
        settlementDate,
      });
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          onComplete();
          setSuccess(false);
        }, 1500);
      } else {
        setError(response.error?.message || "Failed to run reconciliation");
      }
    } catch {
      setError("An error occurred while running reconciliation");
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
            Reconciliation Complete
          </h3>
          <p className="text-sm text-bb-textSoft">
            Settlement reconciliation has been processed successfully.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-md p-6">
      <h3 className="text-lg font-semibold text-bb-text mb-4">
        Run Reconciliation
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-bb-text mb-1">
            Payment Gateway
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as GatewayProvider)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-bb-text"
          >
            <option value="Razorpay">Razorpay</option>
            <option value="Stripe">Stripe</option>
            <option value="PayU">PayU</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-bb-text mb-1">
            Settlement Date
          </label>
          <input
            type="date"
            value={settlementDate}
            onChange={(e) => setSettlementDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-bb-text"
          />
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
            Cancel
          </button>
          <button
            onClick={handleRun}
            disabled={loading || !settlementDate}
            className="flex-1 py-2 px-4 bg-bb-primary text-bb-text rounded-lg text-sm font-medium hover:bg-bb-primarySoft transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Running..." : "Run Reconciliation"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================
// Reconciliation Dashboard
// ============================================

const Reconciliation: React.FC = () => {
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerFilter, setProviderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ReconciliationRecord | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailReport, setDetailReport] = useState<ReconciliationReport | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);

  const filters: ReconciliationFilters = useMemo(
    () => ({
      provider: (providerFilter as GatewayProvider) || undefined,
      status: statusFilter as ReconciliationFilters["status"],
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [providerFilter, statusFilter, startDate, endDate]
  );

  const loadRecords = useCallback(async (activeFilters: ReconciliationFilters) => {
    try {
      setLoading(true);
      setError(null);
      const response = await listReconciliations(activeFilters);
      if (response.success && response.data) {
        setRecords(response.data);
      } else {
        setError(response.error?.message || "Failed to load reconciliation records");
      }
    } catch {
      setError("Failed to load reconciliation records. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords(filters);
  }, [filters, loadRecords]);

  const handleViewDetails = async (record: ReconciliationRecord) => {
    setSelectedRecord(record);
    setDetailsModalOpen(true);

    if (record.status === "Disputed") {
      try {
        setDetailLoading(true);
        const response = await runReconciliation({
          provider: record.gatewayProvider,
          settlementDate: record.settlementDate,
        });
        if (response.success && response.data) {
          setDetailReport(response.data);
        }
      } catch {
        // Silently fail — summary info is still shown
      } finally {
        setDetailLoading(false);
      }
    } else {
      setDetailReport(null);
    }
  };

  const handleResolve = async () => {
    if (!selectedRecord) return;
    try {
      setResolving(true);
      const response = await resolveReconciliation(selectedRecord.id);
      if (response.success) {
        setDetailsModalOpen(false);
        setSelectedRecord(null);
        setDetailReport(null);
        loadRecords(filters);
      }
    } catch {
      // Error handled silently — modal stays open
    } finally {
      setResolving(false);
    }
  };

  const handleRunComplete = () => {
    setRunModalOpen(false);
    loadRecords(filters);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const headers = [
    "Date",
    "Gateway",
    "Total Payments",
    "Fees",
    "Net Settlement",
    "Transactions",
    "Status",
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
                Payment Reconciliation
              </h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRunModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-bb-text bg-bb-primary rounded-lg hover:bg-bb-primarySoft transition-colors"
                >
                  <Play size={16} />
                  Run Reconciliation
                </button>
                <button
                  onClick={() => loadRecords(filters)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-bb-text bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-bb-card p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Provider Filter */}
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-bb-text"
                >
                  <option value="">All Gateways</option>
                  <option value="Razorpay">Razorpay</option>
                  <option value="Stripe">Stripe</option>
                  <option value="PayU">PayU</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-bb-text"
                >
                  <option value="">All Statuses</option>
                  <option value="Reconciled">Reconciled</option>
                  <option value="Disputed">Disputed</option>
                  <option value="Settled">Settled</option>
                </select>

                {/* Date Range */}
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-bb-textSoft" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-bb-text"
                  />
                  <span className="text-bb-textSoft text-sm">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-bb-text"
                  />
                </div>
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
                    onClick={() => loadRecords(filters)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-bb-text bg-bb-primary rounded-lg hover:bg-bb-primarySoft transition-colors"
                  >
                    <RefreshCw size={14} />
                    Retry
                  </button>
                </div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16">
                  <Calendar size={40} className="text-bb-textSoft" />
                  <p className="text-sm text-bb-textSoft">
                    No reconciliation records found
                  </p>
                  <p className="text-xs text-bb-textSoft">
                    Run a reconciliation to get started
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
                      {records.map((record) => (
                        <React.Fragment key={record.id}>
                          <tr
                            className={`hover:bg-bb-hover/30 transition-colors ${
                              record.status === "Disputed"
                                ? "bg-red-50/40"
                                : ""
                            }`}
                          >
                            <td className="px-4 py-3 font-medium text-bb-text whitespace-nowrap">
                              {formatDate(record.settlementDate)}
                            </td>
                            <td className="px-4 py-3 text-bb-textSoft">
                              {record.gatewayProvider}
                            </td>
                            <td className="px-4 py-3 font-medium text-bb-text">
                              {formatCurrency(record.totalAmount)}
                            </td>
                            <td className="px-4 py-3 text-red-600">
                              -{formatCurrency(record.fees)}
                            </td>
                            <td className="px-4 py-3 font-medium text-bb-text">
                              {formatCurrency(record.settledAmount)}
                            </td>
                            <td className="px-4 py-3 text-bb-textSoft text-center">
                              {record.transactionCount}
                            </td>
                            <td className="px-4 py-3">
                              {getStatusBadge(record.status)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleViewDetails(record)}
                                  className="px-3 py-1.5 text-xs font-medium text-bb-text bg-bb-primary rounded-lg hover:bg-bb-primarySoft transition-colors"
                                >
                                  View Details
                                </button>
                                {record.status === "Disputed" && (
                                  <button
                                    onClick={() => {
                                      setSelectedRecord(record);
                                      handleResolve();
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                                  >
                                    Resolve
                                  </button>
                                )}
                                <button
                                  onClick={() => toggleExpand(record.id)}
                                  className="p-1 rounded text-bb-textSoft hover:bg-gray-100 transition-colors"
                                >
                                  {expandedId === record.id ? (
                                    <ChevronUp size={16} />
                                  ) : (
                                    <ChevronDown size={16} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Expanded Row */}
                          {expandedId === record.id && (
                            <tr>
                              <td colSpan={8} className="px-4 py-3 bg-gray-50">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-bb-textSoft block text-xs">
                                      Record ID
                                    </span>
                                    <span className="font-mono text-xs text-bb-text">
                                      {record.id}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-bb-textSoft block text-xs">
                                      Fee Rate
                                    </span>
                                    <span className="font-medium text-bb-text">
                                      {record.totalAmount > 0
                                        ? (
                                            (record.fees / record.totalAmount) *
                                            100
                                          ).toFixed(2) + "%"
                                        : "N/A"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-bb-textSoft block text-xs">
                                      Reconciled At
                                    </span>
                                    <span className="font-medium text-bb-text">
                                      {record.reconciledAt
                                        ? new Date(
                                            record.reconciledAt
                                          ).toLocaleString("en-IN")
                                        : "Pending"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-bb-textSoft block text-xs">
                                      Transactions
                                    </span>
                                    <span className="font-medium text-bb-text">
                                      {record.transactionCount} payments processed
                                    </span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRecord && detailsModalOpen && (
        <DetailsModal
          open={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedRecord(null);
            setDetailReport(null);
          }}
          record={selectedRecord}
          report={detailReport}
          loading={detailLoading}
          onResolve={handleResolve}
          resolving={resolving}
        />
      )}

      {/* Run Reconciliation Modal */}
      <RunReconciliationModal
        open={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        onComplete={handleRunComplete}
      />
    </DashboardLayout>
  );
};

export default Reconciliation;
