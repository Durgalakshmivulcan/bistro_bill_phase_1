import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, RotateCcw, CreditCard, XCircle } from 'lucide-react';
import { getPaymentByOrderId, OnlinePayment } from '../services/paymentService';

function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}

const PaymentFailure = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<OnlinePayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;

    const fetchPayment = async () => {
      try {
        const response = await getPaymentByOrderId(orderId);
        if (response.success && response.data) {
          setPayment(response.data);
        } else {
          setError('Payment details not found');
        }
      } catch {
        setError('Failed to load payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bb-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-bb-primary animate-spin" />
          <p className="text-sm font-medium text-bb-text">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error && !payment) {
    return (
      <div className="min-h-screen bg-bb-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-bb-card p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-bb-text mb-2">Payment Failed</h1>
          <p className="text-bb-textSoft text-sm mb-6">
            Something went wrong with your payment. Please try again.
          </p>
          <button
            onClick={() => navigate('/pos/orderspage')}
            className="w-full h-11 rounded-lg bg-bb-primary text-bb-text font-medium hover:bg-bb-primarySoft transition"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bb-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-bb-card p-8">
        {/* Failure Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-center text-bb-text mb-1">
          Payment Failed
        </h1>
        <p className="text-center text-bb-textSoft text-sm mb-6">
          Your payment could not be processed. Please try again.
        </p>

        {/* Failure Reason */}
        {payment?.failureReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{payment.failureReason}</p>
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-bb-bg rounded-xl p-4 space-y-3 mb-6">
          {payment?.order && (
            <div className="flex justify-between text-sm">
              <span className="text-bb-textSoft">Order Number</span>
              <span className="font-medium text-bb-text">
                #{payment.order.orderNumber}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-bb-textSoft">Amount</span>
            <span className="font-semibold text-bb-text">
              {payment ? formatCurrency(payment.amount, payment.currency) : '—'}
            </span>
          </div>
          {payment && (
            <div className="flex justify-between text-sm">
              <span className="text-bb-textSoft">Payment Method</span>
              <span className="font-medium text-bb-text">
                {payment.gatewayProvider}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-bb-primary text-bb-text font-medium hover:bg-bb-primarySoft transition"
          >
            <RotateCcw className="w-4 h-4" />
            Retry Payment
          </button>
          <button
            onClick={() => navigate('/pos/takeorder')}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-white border border-bb-border text-bb-text font-medium hover:bg-gray-50 transition"
          >
            <CreditCard className="w-4 h-4" />
            Try Different Method
          </button>
          <button
            onClick={() => navigate('/pos/orderspage')}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-lg text-bb-textSoft font-medium hover:text-bb-text hover:bg-gray-50 transition"
          >
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
