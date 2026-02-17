import { useState, useCallback, useRef, useEffect } from 'react';
import { Loader2, CreditCard, AlertCircle, RotateCcw } from 'lucide-react';
import { createPaymentOrder, CreatePaymentOrderResponse } from '../../services/paymentService';

// ── Types ──────────────────────────────────────────────────────────

interface PayUCheckoutProps {
  orderId: string;
  amount: number;
  currency?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onFailure?: (error: string) => void;
}

type CheckoutState = 'idle' | 'creating' | 'redirecting' | 'failed';

// ── Helpers ────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}

// ── Component ──────────────────────────────────────────────────────

export default function PayUCheckout({
  orderId,
  amount,
  currency = 'INR',
  customerName,
  customerEmail,
  customerPhone,
  onFailure,
}: PayUCheckoutProps) {
  const [state, setState] = useState<CheckoutState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [orderData, setOrderData] = useState<CreatePaymentOrderResponse | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-submit form when orderData is set and state is 'redirecting'
  useEffect(() => {
    if (state === 'redirecting' && orderData && formRef.current) {
      formRef.current.submit();
    }
  }, [state, orderData]);

  const handlePayNow = useCallback(async () => {
    setState('creating');
    setErrorMessage('');

    try {
      // Create payment order on backend (gets PayU hash and params)
      const response = await createPaymentOrder({
        orderId,
        provider: 'PayU',
        currency,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to create payment order. Please try again.');
      }

      const paymentData = response.data;

      if (!paymentData.providerData.hash || !paymentData.providerData.payment_url) {
        throw new Error('PayU payment configuration is incomplete.');
      }

      setOrderData(paymentData);
      setState('redirecting');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setState('failed');
      setErrorMessage(msg);
      onFailure?.(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, currency]);

  const handleRetry = () => {
    setState('idle');
    setErrorMessage('');
    setOrderData(null);
  };

  // Build success and failure URLs
  const baseUrl = window.location.origin;
  const successUrl = `${baseUrl}/payment/success/${orderId}`;
  const failureUrl = `${baseUrl}/payment/failure/${orderId}`;

  // ── Render ─────────────────────────────────────────────────────────

  // Failed state
  if (state === 'failed') {
    return (
      <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-red-50 border border-red-200">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-800">Payment Failed</h3>
          <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
        </div>
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // Loading / redirecting state
  if (state === 'creating' || state === 'redirecting') {
    return (
      <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-bb-bg border border-gray-200">
        <Loader2 className="w-10 h-10 text-bb-primary animate-spin" />
        <p className="text-sm font-medium text-bb-text">
          {state === 'creating' ? 'Preparing payment...' : 'Redirecting to PayU...'}
        </p>
        {/* Hidden form for PayU redirect */}
        {orderData && (
          <form
            ref={formRef}
            method="POST"
            action={orderData.providerData.payment_url as string}
            style={{ display: 'none' }}
          >
            <input type="hidden" name="key" value={orderData.providerData.key as string} />
            <input type="hidden" name="txnid" value={orderData.providerData.txnid as string} />
            <input type="hidden" name="amount" value={orderData.providerData.amount as string} />
            <input type="hidden" name="productinfo" value={orderData.providerData.productinfo as string} />
            <input type="hidden" name="firstname" value={(orderData.providerData.firstname as string) || customerName || 'Customer'} />
            <input type="hidden" name="email" value={(orderData.providerData.email as string) || customerEmail || 'customer@example.com'} />
            <input type="hidden" name="phone" value={customerPhone || ''} />
            <input type="hidden" name="hash" value={orderData.providerData.hash as string} />
            <input type="hidden" name="surl" value={successUrl} />
            <input type="hidden" name="furl" value={failureUrl} />
          </form>
        )}
      </div>
    );
  }

  // Idle state – show Pay Now button
  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-bb-bg border border-gray-200">
      <div className="text-center">
        <p className="text-sm text-bb-textSoft">Amount to pay</p>
        <p className="text-2xl font-bold text-bb-text mt-1">
          {formatCurrency(amount, currency)}
        </p>
      </div>
      <button
        onClick={handlePayNow}
        className="flex items-center gap-2 px-6 py-3 text-base font-semibold text-bb-text bg-bb-primary rounded-lg hover:bg-yellow-400 transition-colors shadow-bb-card"
      >
        <CreditCard className="w-5 h-5" />
        Pay Now with PayU
      </button>
      <p className="text-xs text-bb-textSoft">
        You will be redirected to PayU for secure payment via UPI, Net Banking, or Cards
      </p>
    </div>
  );
}
