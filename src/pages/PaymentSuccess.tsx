import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, FileText, ShoppingBag } from 'lucide-react';
import { getPaymentByOrderId, OnlinePayment } from '../services/paymentService';

function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const PaymentSuccess = () => {
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

  if (error) {
    return (
      <div className="min-h-screen bg-bb-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-bb-card p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-bb-text mb-2">Payment Successful</h1>
          <p className="text-bb-textSoft text-sm mb-6">
            Your payment has been processed successfully.
          </p>
          <button
            onClick={() => navigate('/pos/orderspage')}
            className="w-full h-11 rounded-lg bg-bb-primary text-bb-text font-medium hover:bg-bb-primarySoft transition"
          >
            View Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bb-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-bb-card p-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-center text-bb-text mb-1">
          Payment Successful!
        </h1>
        <p className="text-center text-bb-textSoft text-sm mb-6">
          Your payment has been confirmed.
        </p>

        {/* Payment Details */}
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
            <span className="text-bb-textSoft">Amount Paid</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(payment!.amount, payment!.currency)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-bb-textSoft">Payment Method</span>
            <span className="font-medium text-bb-text">
              {payment!.gatewayProvider}
              {payment!.paymentMethod ? ` (${payment!.paymentMethod})` : ''}
            </span>
          </div>
          {payment!.gatewayTransactionId && (
            <div className="flex justify-between text-sm">
              <span className="text-bb-textSoft">Transaction ID</span>
              <span className="font-mono text-xs text-bb-text">
                {payment!.gatewayTransactionId}
              </span>
            </div>
          )}
          {payment!.paidAt && (
            <div className="flex justify-between text-sm">
              <span className="text-bb-textSoft">Paid At</span>
              <span className="font-medium text-bb-text">
                {formatDate(payment!.paidAt)}
              </span>
            </div>
          )}
        </div>

        {/* Estimated Time */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800 text-center">
            Estimated preparation time: <span className="font-semibold">15-20 minutes</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/order-activity/paid/${orderId}`)}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-bb-primary text-bb-text font-medium hover:bg-bb-primarySoft transition"
          >
            <ShoppingBag className="w-4 h-4" />
            View Order Details
          </button>
          <button
            onClick={() => {
              window.print();
            }}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-white border border-bb-border text-bb-text font-medium hover:bg-gray-50 transition"
          >
            <FileText className="w-4 h-4" />
            Download Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
