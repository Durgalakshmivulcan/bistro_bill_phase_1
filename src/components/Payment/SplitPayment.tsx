import { useState, useCallback, useMemo } from 'react';
import {
  Loader2,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Wallet,
  Banknote,
  Smartphone,
} from 'lucide-react';
import {
  processSplitPayment,
  SplitPaymentInput,
} from '../../services/paymentService';

// ── Types ──────────────────────────────────────────────────────────

interface SplitPaymentProps {
  orderId: string;
  amount: number;
  currency?: string;
  onSuccess?: (splitPayments: Array<{ id: string; provider: string; amount: number }>) => void;
  onFailure?: (error: string) => void;
  onCancel?: () => void;
}

interface SplitEntry {
  id: string;
  provider: string;
  paymentMethod: string;
  amount: string; // String for controlled input
}

type SplitPaymentState = 'editing' | 'processing' | 'success' | 'failed';

// ── Constants ──────────────────────────────────────────────────────

const PAYMENT_OPTIONS = [
  { provider: 'Cash', method: 'cash', label: 'Cash', icon: Banknote },
  { provider: 'Razorpay', method: 'card', label: 'Card (Razorpay)', icon: CreditCard },
  { provider: 'Razorpay', method: 'upi', label: 'UPI (Razorpay)', icon: Smartphone },
  { provider: 'Stripe', method: 'card', label: 'Card (Stripe)', icon: CreditCard },
  { provider: 'Razorpay', method: 'wallet', label: 'Wallet', icon: Wallet },
  { provider: 'Razorpay', method: 'netbanking', label: 'Net Banking', icon: CreditCard },
];

// ── Helpers ────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}

function generateId(): string {
  return `split_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Component ──────────────────────────────────────────────────────

export default function SplitPayment({
  orderId,
  amount,
  currency = 'INR',
  onSuccess,
  onFailure,
  onCancel,
}: SplitPaymentProps) {
  const [state, setState] = useState<SplitPaymentState>('editing');
  const [errorMessage, setErrorMessage] = useState('');
  const [splits, setSplits] = useState<SplitEntry[]>([
    { id: generateId(), provider: 'Cash', paymentMethod: 'cash', amount: '' },
    { id: generateId(), provider: 'Razorpay', paymentMethod: 'card', amount: '' },
  ]);

  // ── Computed Values ─────────────────────────────────────────────

  const splitTotal = useMemo(() => {
    return splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  }, [splits]);

  const remaining = useMemo(() => {
    return Math.max(0, amount - splitTotal);
  }, [amount, splitTotal]);

  const isValidSplit = useMemo(() => {
    if (splits.length < 2) return false;
    const total = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    const allPositive = splits.every(s => parseFloat(s.amount) > 0);
    return allPositive && Math.abs(total - amount) < 0.01;
  }, [splits, amount]);

  // ── Handlers ────────────────────────────────────────────────────

  const handleAddSplit = useCallback(() => {
    setSplits(prev => [
      ...prev,
      { id: generateId(), provider: 'Cash', paymentMethod: 'cash', amount: '' },
    ]);
  }, []);

  const handleRemoveSplit = useCallback((id: string) => {
    setSplits(prev => {
      if (prev.length <= 2) return prev; // Minimum 2 splits
      return prev.filter(s => s.id !== id);
    });
  }, []);

  const handleMethodChange = useCallback((id: string, optionIndex: number) => {
    const option = PAYMENT_OPTIONS[optionIndex];
    if (!option) return;
    setSplits(prev =>
      prev.map(s =>
        s.id === id
          ? { ...s, provider: option.provider, paymentMethod: option.method }
          : s
      )
    );
  }, []);

  const handleAmountChange = useCallback((id: string, value: string) => {
    // Only allow valid decimal numbers
    if (value !== '' && !/^\d*\.?\d{0,2}$/.test(value)) return;
    setSplits(prev =>
      prev.map(s => (s.id === id ? { ...s, amount: value } : s))
    );
  }, []);

  const handleAutoFillRemaining = useCallback((id: string) => {
    const otherTotal = splits
      .filter(s => s.id !== id)
      .reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    const autoAmount = Math.max(0, amount - otherTotal);
    setSplits(prev =>
      prev.map(s =>
        s.id === id ? { ...s, amount: autoAmount.toFixed(2) } : s
      )
    );
  }, [splits, amount]);

  const handleProcessPayment = useCallback(async () => {
    if (!isValidSplit) return;

    setState('processing');
    setErrorMessage('');

    try {
      const splitInputs: SplitPaymentInput[] = splits.map(s => ({
        provider: s.provider,
        amount: parseFloat(s.amount),
        paymentMethod: s.paymentMethod,
      }));

      const response = await processSplitPayment({
        orderId,
        splits: splitInputs,
      });

      if (response.success && response.data) {
        setState('success');
        onSuccess?.(
          response.data.splitPayments.map(p => ({
            id: p.id,
            provider: p.provider,
            amount: p.amount,
          }))
        );
      } else {
        const msg = response.error?.message || 'Split payment failed';
        setState('failed');
        setErrorMessage(msg);
        onFailure?.(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setState('failed');
      setErrorMessage(msg);
      onFailure?.(msg);
    }
  }, [isValidSplit, splits, orderId, onSuccess, onFailure]);

  const handleRetry = useCallback(() => {
    setState('editing');
    setErrorMessage('');
  }, []);

  // ── Render ──────────────────────────────────────────────────────

  // Success state
  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-green-50 border border-green-200">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-green-800">Split Payment Successful</h3>
          <p className="text-sm text-green-600 mt-1">
            {formatCurrency(amount, currency)} paid via split payment
          </p>
          <div className="mt-3 space-y-1">
            {splits.map(s => {
              const option = PAYMENT_OPTIONS.find(
                o => o.provider === s.provider && o.method === s.paymentMethod
              );
              return (
                <p key={s.id} className="text-xs text-green-500">
                  {option?.label || s.paymentMethod}: {formatCurrency(parseFloat(s.amount), currency)}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  if (state === 'failed') {
    return (
      <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-red-50 border border-red-200">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-800">Split Payment Failed</h3>
          <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
        </div>
        <button
          onClick={handleRetry}
          className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Processing state
  if (state === 'processing') {
    return (
      <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-bb-bg border border-gray-200">
        <Loader2 className="w-10 h-10 text-bb-primary animate-spin" />
        <p className="text-sm font-medium text-bb-text">Processing split payment...</p>
        <p className="text-xs text-bb-textSoft">Please wait while we process each payment method</p>
      </div>
    );
  }

  // Editing state - main UI
  return (
    <div className="flex flex-col gap-4 p-6 rounded-xl bg-bb-bg border border-gray-200">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-bb-text">Split Payment</h3>
        <p className="text-sm text-bb-textSoft mt-1">
          Order Total: <span className="font-semibold text-bb-text">{formatCurrency(amount, currency)}</span>
        </p>
      </div>

      {/* Split entries */}
      <div className="space-y-3">
        {splits.map((split, index) => {
          const selectedOptionIndex = PAYMENT_OPTIONS.findIndex(
            o => o.provider === split.provider && o.method === split.paymentMethod
          );
          const SelectedIcon = PAYMENT_OPTIONS[selectedOptionIndex]?.icon || CreditCard;

          return (
            <div key={split.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
              {/* Payment method selector */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <SelectedIcon className="w-5 h-5 text-bb-textSoft flex-shrink-0" />
                <select
                  value={selectedOptionIndex}
                  onChange={(e) => handleMethodChange(split.id, parseInt(e.target.value))}
                  className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white text-bb-text focus:outline-none focus:ring-1 focus:ring-bb-primary flex-1 min-w-0"
                >
                  {PAYMENT_OPTIONS.map((option, i) => (
                    <option key={i} value={i}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount input */}
              <div className="flex items-center gap-1">
                <span className="text-sm text-bb-textSoft">₹</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={split.amount}
                  onChange={(e) => handleAmountChange(split.id, e.target.value)}
                  onFocus={() => {
                    if (!split.amount && remaining > 0) {
                      handleAutoFillRemaining(split.id);
                    }
                  }}
                  placeholder="0.00"
                  className="w-24 text-sm text-right border border-gray-200 rounded-md px-2 py-1.5 bg-white text-bb-text focus:outline-none focus:ring-1 focus:ring-bb-primary"
                />
              </div>

              {/* Remove button */}
              <button
                onClick={() => handleRemoveSplit(split.id)}
                disabled={splits.length <= 2}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={splits.length <= 2 ? 'Minimum 2 splits required' : `Remove split ${index + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add split button */}
      <button
        onClick={handleAddSplit}
        className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-bb-textSoft border border-dashed border-gray-300 rounded-lg hover:border-bb-primary hover:text-bb-text transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Payment Method
      </button>

      {/* Summary */}
      <div className="border-t border-gray-200 pt-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-bb-textSoft">Split Total</span>
          <span className={`font-medium ${Math.abs(splitTotal - amount) < 0.01 ? 'text-green-600' : 'text-bb-text'}`}>
            {formatCurrency(splitTotal, currency)}
          </span>
        </div>
        {remaining > 0.01 && (
          <div className="flex justify-between text-sm">
            <span className="text-bb-textSoft">Remaining</span>
            <span className="font-medium text-amber-600">
              {formatCurrency(remaining, currency)}
            </span>
          </div>
        )}
        {splitTotal > amount + 0.01 && (
          <div className="flex justify-between text-sm">
            <span className="text-bb-textSoft">Overpayment</span>
            <span className="font-medium text-red-600">
              {formatCurrency(splitTotal - amount, currency)}
            </span>
          </div>
        )}
      </div>

      {/* Validation message */}
      {!isValidSplit && splits.some(s => parseFloat(s.amount) > 0) && (
        <p className="text-xs text-amber-600 text-center">
          {splits.some(s => !s.amount || parseFloat(s.amount) <= 0)
            ? 'All splits must have a positive amount'
            : `Split amounts must equal the order total (${formatCurrency(amount, currency)})`}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-bb-textSoft bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleProcessPayment}
          disabled={!isValidSplit}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-bb-text bg-bb-primary rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-bb-card"
        >
          <CreditCard className="w-4 h-4" />
          Process Split Payment
        </button>
      </div>
    </div>
  );
}
