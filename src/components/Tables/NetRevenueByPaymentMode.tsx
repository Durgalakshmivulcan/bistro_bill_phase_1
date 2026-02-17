import { useState, useEffect } from "react";
import TableCard from "./TableCard";
import { getRevenueByPayment, PaymentMethodRevenue } from "../../services/dashboardService";
import { TableSkeleton } from "../Common/SkeletonLoader";
import ErrorDisplay from "../Common/ErrorDisplay";

interface NetRevenueByPaymentModeProps {
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

const NetRevenueByPaymentMode = ({ startDate, endDate, branchId }: NetRevenueByPaymentModeProps) => {
  const [payments, setPayments] = useState<PaymentMethodRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRevenueByPayment(startDate, endDate, branchId);

      if (response.success && response.data) {
        setPayments(response.data);
      } else {
        setError(response.error?.message || "Failed to load payment data");
      }
    } catch (err) {
      setError("An error occurred while loading payment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, [startDate, endDate, branchId]);

  if (loading) {
    return (
      <TableCard title="Net Revenue" subtitle="By Payment Mode">
        <TableSkeleton rows={6} />
      </TableCard>
    );
  }

  if (error) {
    return (
      <TableCard title="Net Revenue" subtitle="By Payment Mode">
        <div className="py-4">
          <ErrorDisplay
            message={error}
            variant="card"
            size="small"
            onRetry={fetchPaymentData}
          />
        </div>
      </TableCard>
    );
  }

  if (payments.length === 0) {
    return (
      <TableCard title="Net Revenue" subtitle="By Payment Mode">
        <div className="py-8 text-center text-bb-textSoft">
          No payment data available for the selected period
        </div>
      </TableCard>
    );
  }

  return (
    <TableCard title="Net Revenue" subtitle="By Payment Mode">
      <table className="w-full text-sm border border-bb-border rounded-lg overflow-hidden">
        <thead className="bg-bb-primary text-black">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Payment Mode</th>
            <th className="px-3 py-2 text-center font-medium">% Revenue</th>
            <th className="px-3 py-2 text-right font-medium">Total Revenue</th>
          </tr>
        </thead>

        <tbody>
          {payments.map((payment) => (
            <tr key={payment.paymentMethod}>
              <td className="px-3 py-2">{payment.paymentMethod}</td>
              <td className="px-3 py-2 text-center">{payment.percentage.toFixed(1)}%</td>
              <td className="px-3 py-2 text-right">₹ {payment.revenue.toLocaleString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
};

export default NetRevenueByPaymentMode;
