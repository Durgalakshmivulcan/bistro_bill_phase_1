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
    } catch {
      setError("An error occurred while loading payment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, [startDate, endDate, branchId]);

  return (
    <TableCard title="Net Revenue" subtitle="By Payment Mode">
      {loading && <TableSkeleton rows={6} />}

      {!loading && error && (
        <div className="py-3">
          <ErrorDisplay
            message={error}
            variant="card"
            size="small"
            onRetry={fetchPaymentData}
          />
        </div>
      )}

      {!loading && !error && (
        <table className="w-full text-sm border border-[#E5E7EB] rounded-md overflow-hidden">
          <thead className="bg-[#F5C628] text-black">
            <tr>
              <th className="px-3 py-2 text-left text-[12px] font-medium">Payment Mode</th>
              <th className="px-3 py-2 text-center text-[12px] font-medium">% Revenue</th>
              <th className="px-3 py-2 text-right text-[12px] font-medium">Total Revenue</th>
            </tr>
          </thead>

          <tbody>
            {payments.length > 0 ? (
              payments.map((payment, index) => (
                <tr key={payment.paymentMethod} className={`${index % 2 === 0 ? "bg-[#F7F7F7]" : "bg-[#F6F0E1]"} border-t border-[#E5E7EB]`}>
                  <td className="px-3 py-2 text-[12px] text-[#374151]">{payment.paymentMethod}</td>
                  <td className="px-3 py-2 text-center text-[12px] text-[#374151]">{payment.percentage.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-right text-[12px] text-[#374151]">{"\u20B9"} {payment.revenue.toLocaleString("en-IN")}</td>
                </tr>
              ))
            ) : (
              <tr className="bg-[#F7F7F7] border-t border-[#E5E7EB]">
                <td colSpan={3} className="px-3 py-6 text-center text-[12px] text-bb-textSoft">
                  No payment data available for the selected period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </TableCard>
  );
};

export default NetRevenueByPaymentMode;
