import { useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader2, CreditCard, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import {
  createPaymentOrder,
  verifyPayment,
  CreatePaymentOrderResponse,
} from '../../services/paymentService';

// ── Types ──────────────────────────────────────────────────────────

interface StripeCheckoutProps {
  orderId: string;
  amount: number;
  currency?: string;
  customerName?: string;
  customerEmail?: string;
  stripePublishableKey?: string;
  onSuccess?: (paymentId: string, transactionId: string) => void;
  onFailure?: (error: string) => void;
  onCancel?: () => void;
}

type CheckoutState = 'idle' | 'creating' | 'processing' | 'verifying' | 'success' | 'failed';

// ── Helpers ────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1A1C1E',
      fontFamily: '"Inter", system-ui, sans-serif',
      '::placeholder': {
        color: '#667085',
      },
    },
    invalid: {
      color: '#EF4444',
      iconColor: '#EF4444',
    },
  },
};

// ── Inner checkout form (must be inside Elements provider) ────────

interface CheckoutFormProps {
  orderId: string;
  amount: number;
  currency: string;
  onSuccess?: (paymentId: string, transactionId: string) => void;
  onFailure?: (error: string) => void;
  onCancel?: () => void;
}

function CheckoutForm({
  orderId,
  amount,
  currency,
  onSuccess,
  onFailure,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [state, setState] = useState<CheckoutState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [orderData, setOrderData] = useState<CreatePaymentOrderResponse | null>(null);
  const [cardError, setCardError] = useState('');

  const handlePayNow = useCallback(async () => {
    if (!stripe || !elements) {
      setErrorMessage('Stripe is not loaded yet. Please wait.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setErrorMessage('Card input not found. Please refresh and try again.');
      return;
    }

    setState('creating');
    setErrorMessage('');

    try {
      // Step 1: Create payment order on backend (gets client_secret)
      const response = await createPaymentOrder({
        orderId,
        provider: 'Stripe',
        currency,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to create payment order. Please try again.');
      }

      const paymentData = response.data;
      setOrderData(paymentData);

      const clientSecret = paymentData.providerData.client_secret as string;
      if (!clientSecret) {
        throw new Error('Failed to get payment details from Stripe.');
      }

      // Step 2: Confirm card payment with Stripe
      setState('processing');

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        throw new Error(error.message || 'Payment failed. Please try again.');
      }

      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        throw new Error('Payment was not completed. Please try again.');
      }

      // Step 3: Verify payment on backend
      setState('verifying');

      const verifyResponse = await verifyPayment({
        paymentId: paymentIntent.id,
        orderId: paymentData.gatewayOrderId,
        signature: '', // Stripe doesn't use signature - verification is via PaymentIntent status
        provider: 'Stripe',
      });

      if (verifyResponse.success && verifyResponse.data?.verified) {
        setState('success');
        onSuccess?.(paymentData.paymentId, verifyResponse.data.gatewayTransactionId);
      } else {
        setState('failed');
        setErrorMessage('Payment verification failed. Please contact support.');
        onFailure?.('Payment verification failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setState('failed');
      setErrorMessage(msg);
      onFailure?.(msg);
    }
  }, [stripe, elements, orderId, currency, onSuccess, onFailure]);

  const handleRetry = () => {
    setState('idle');
    setErrorMessage('');
    setOrderData(null);
    setCardError('');
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
            {formatCurrency(amount, currency)} paid via Stripe
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

  // Loading / processing / verifying state
  if (state === 'creating' || state === 'processing' || state === 'verifying') {
    const loadingMessages: Record<string, string> = {
      creating: 'Preparing payment...',
      processing: 'Processing payment...',
      verifying: 'Verifying payment...',
    };
    return (
      <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-bb-bg border border-gray-200">
        <Loader2 className="w-10 h-10 text-bb-primary animate-spin" />
        <p className="text-sm font-medium text-bb-text">{loadingMessages[state]}</p>
      </div>
    );
  }

  // Idle state – show card input and Pay Now button
  return (
    <div className="flex flex-col gap-4 p-6 rounded-xl bg-bb-bg border border-gray-200">
      <div className="text-center">
        <p className="text-sm text-bb-textSoft">Amount to pay</p>
        <p className="text-2xl font-bold text-bb-text mt-1">
          {formatCurrency(amount, currency)}
        </p>
      </div>

      <div className="p-3 border border-gray-300 rounded-lg bg-white">
        <CardElement
          options={CARD_ELEMENT_OPTIONS}
          onChange={(event) => {
            setCardError(event.error?.message || '');
          }}
        />
      </div>

      {cardError && (
        <p className="text-sm text-red-500">{cardError}</p>
      )}

      <button
        onClick={handlePayNow}
        disabled={!stripe || !elements}
        className="flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-bb-text bg-bb-primary rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-bb-card"
      >
        <CreditCard className="w-5 h-5" />
        Pay Now with Stripe
      </button>
    </div>
  );
}

// ── Wrapper component (loads Stripe and provides Elements) ────────

export default function StripeCheckout({
  orderId,
  amount,
  currency = 'INR',
  customerName,
  customerEmail,
  stripePublishableKey,
  onSuccess,
  onFailure,
  onCancel,
}: StripeCheckoutProps) {
  const publishableKey =
    stripePublishableKey ||
    process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
    '';

  if (!publishableKey) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-red-50 border border-red-200">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-800">Stripe Not Configured</h3>
          <p className="text-sm text-red-600 mt-1">
            Stripe publishable key is not set. Please configure it in settings.
          </p>
        </div>
      </div>
    );
  }

  const stripePromise = loadStripe(publishableKey);

  return (
    <Elements
      stripe={stripePromise}
      options={{
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#FDC836',
          },
        },
      }}
    >
      <CheckoutForm
        orderId={orderId}
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
        onFailure={onFailure}
        onCancel={onCancel}
      />
    </Elements>
  );
}
