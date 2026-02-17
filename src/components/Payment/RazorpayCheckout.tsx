import { useState, useCallback, useEffect } from 'react';
import { Loader2, CreditCard, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import {
  createPaymentOrder,
  verifyPayment,
  CreatePaymentOrderResponse,
} from '../../services/paymentService';

// ── Types ──────────────────────────────────────────────────────────

interface RazorpayCheckoutProps {
  orderId: string;
  amount: number;
  currency?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  razorpayKeyId?: string;
  onSuccess?: (paymentId: string, transactionId: string) => void;
  onFailure?: (error: string) => void;
  onCancel?: () => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type CheckoutState = 'idle' | 'creating' | 'checkout' | 'verifying' | 'success' | 'failed';

// ── Helpers ────────────────────────────────────────────────────────

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window.Razorpay !== 'undefined') {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}

// ── Component ──────────────────────────────────────────────────────

export default function RazorpayCheckout({
  orderId,
  amount,
  currency = 'INR',
  customerName,
  customerEmail,
  customerPhone,
  razorpayKeyId,
  onSuccess,
  onFailure,
  onCancel,
}: RazorpayCheckoutProps) {
  const [state, setState] = useState<CheckoutState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [orderData, setOrderData] = useState<CreatePaymentOrderResponse | null>(null);

  // Preload script on mount
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const handlePayNow = useCallback(async () => {
    setState('creating');
    setErrorMessage('');

    try {
      // Step 1: Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay checkout. Please check your internet connection.');
      }

      // Step 2: Create payment order on backend
      const response = await createPaymentOrder({
        orderId,
        provider: 'Razorpay',
        currency,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to create payment order. Please try again.');
      }

      const paymentData = response.data;
      setOrderData(paymentData);

      // Step 3: Get key from prop, env, or provider data
      const keyId =
        razorpayKeyId ||
        process.env.REACT_APP_RAZORPAY_KEY_ID ||
        (paymentData.providerData.key_id as string) ||
        '';

      if (!keyId) {
        throw new Error('Razorpay key not configured.');
      }

      // Step 4: Open Razorpay checkout modal
      setState('checkout');

      const options: RazorpayOptions = {
        key: keyId,
        amount: (paymentData.providerData.amount as number) || Math.round(paymentData.amount * 100),
        currency: paymentData.currency,
        name: 'Bistro Bill',
        description: `Order Payment`,
        order_id: paymentData.gatewayOrderId,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        theme: {
          color: '#FDC836',
        },
        handler: async (razorpayResponse: RazorpayResponse) => {
          // Payment was successful on Razorpay's end - verify on backend
          await handleVerifyPayment(razorpayResponse, paymentData);
        },
        modal: {
          ondismiss: () => {
            setState('idle');
            onCancel?.();
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', (failedResponse: { error: { description: string } }) => {
        const errMsg = failedResponse.error.description || 'Payment failed';
        setState('failed');
        setErrorMessage(errMsg);
        onFailure?.(errMsg);
      });

      razorpayInstance.open();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setState('failed');
      setErrorMessage(msg);
      onFailure?.(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, currency, razorpayKeyId, customerName, customerEmail, customerPhone]);

  const handleVerifyPayment = async (
    razorpayResponse: RazorpayResponse,
    paymentData: CreatePaymentOrderResponse
  ) => {
    setState('verifying');

    try {
      const verifyResponse = await verifyPayment({
        paymentId: razorpayResponse.razorpay_payment_id,
        orderId: razorpayResponse.razorpay_order_id,
        signature: razorpayResponse.razorpay_signature,
        provider: 'Razorpay',
      });

      if (verifyResponse.success && verifyResponse.data?.verified) {
        setState('success');
        onSuccess?.(
          paymentData.paymentId,
          verifyResponse.data.gatewayTransactionId
        );
      } else {
        setState('failed');
        setErrorMessage('Payment verification failed. Please contact support.');
        onFailure?.('Payment verification failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setState('failed');
      setErrorMessage(msg);
      onFailure?.(msg);
    }
  };

  const handleRetry = () => {
    setState('idle');
    setErrorMessage('');
    setOrderData(null);
  };

  // ── Render ─────────────────────────────────────────────────────────

  // Success state
  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-green-50 border border-green-200">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-green-800">Payment Successful</h3>
          <p className="text-sm text-green-600 mt-1">
            {formatCurrency(amount, currency)} paid via Razorpay
          </p>
          {orderData && (
            <p className="text-xs text-green-500 mt-1">
              Transaction ID: {orderData.gatewayOrderId}
            </p>
          )}
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

  // Loading / verifying state
  if (state === 'creating' || state === 'verifying') {
    return (
      <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-bb-bg border border-gray-200">
        <Loader2 className="w-10 h-10 text-bb-primary animate-spin" />
        <p className="text-sm font-medium text-bb-text">
          {state === 'creating' ? 'Preparing payment...' : 'Verifying payment...'}
        </p>
      </div>
    );
  }

  // Idle / checkout state (show Pay Now button)
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
        disabled={state === 'checkout'}
        className="flex items-center gap-2 px-6 py-3 text-base font-semibold text-bb-text bg-bb-primary rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-bb-card"
      >
        <CreditCard className="w-5 h-5" />
        {state === 'checkout' ? 'Complete payment in Razorpay...' : 'Pay Now with Razorpay'}
      </button>
      {state === 'checkout' && (
        <p className="text-xs text-bb-textSoft">
          Complete the payment in the Razorpay popup window
        </p>
      )}
    </div>
  );
}
