import { useState } from "react";
import InvoiceItemsTable from "./InvoiceItemsTable";
import { syncOrderToAccounting } from "../../services/orderService";

type Props = {
  order?: any;
};

const InvoiceCard: React.FC<Props> = ({ order }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSyncToAccounting = async () => {
    if (!order?.id) return;
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const response = await syncOrderToAccounting(order.id);
      if (response.success) {
        setSyncStatus({ success: true, message: response.message || 'Synced successfully' });
      } else {
        setSyncStatus({ success: false, message: response.error?.message || 'Sync failed' });
      }
    } catch {
      setSyncStatus({ success: false, message: 'Failed to sync to accounting' });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!order || order.status === "UNPAID" || order.status === "CANCELLED") {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full
        flex flex-col items-center justify-center min-h-[420px]">
        <img
          src="/assets/no-invoice.svg"
          alt="No Invoice"
          className="w-36 mb-4"
        />
        <p className="text-gray-500 text-sm">
          No Invoice generated.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
      <div className="flex justify-between items-center border-b pb-3">
        <p className="font-medium">
          Invoice: <span className="font-semibold">{order.orderNo}</span>
        </p>
        <button title="Print">🖨</button>
      </div>

      <div className="text-center mt-4">
        <p className="font-semibold">
          GK Hospitality Chaitanya Food Court
        </p>
        <p className="text-xs text-gray-500 mt-1">
          1-55/322, Rohan Delite, Botanical Garden, Kondapur – 500084
        </p>
        <p className="text-xs mt-1">GSTIN: 56ADUYT154EL10</p>
        <p className="text-xs">Mobile Number: 9874561230</p>
      </div>

      <div className="text-xs flex flex-wrap justify-between mt-4 border-b pb-3">
        <span>Date: {order.date}</span>
        <span>Time: {order.time}</span>
        <span>Cashier: {order.createdBy}</span>
        <span>Bill No: {order.billNo}</span>
        <span>KOT No: {order.kotNo}</span>
        <span>{order.orderType}</span>
      </div>

      <InvoiceItemsTable items={order.items} />

      <div className="text-sm mt-4 space-y-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹ {order.subtotal}</span>
        </div>

        <div className="flex justify-between">
          <span>Discount</span>
          <span>- ₹ {order.discount}</span>
        </div>

        <div className="flex justify-between">
          <span>Tax</span>
          <span>₹ {order.tax}</span>
        </div>

        <div className="flex justify-between font-semibold border-t pt-2">
          <span>Total</span>
          <span>₹ {order.total}</span>
        </div>

        {order.status === "PARTIAL_PAID" && (
          <div className="flex justify-between text-red-500 font-medium">
            <span>Amount Due</span>
            <span>₹ {order.total - order.paidAmount}</span>
          </div>
        )}
      </div>

      {order.status === "COMPLETED" && (
        <div className="mt-4 border-t pt-3">
          <button
            onClick={handleSyncToAccounting}
            disabled={isSyncing}
            className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-bb-primary text-bb-text hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? 'Syncing...' : 'Sync to Accounting'}
          </button>
          {syncStatus && (
            <p className={`text-xs mt-2 text-center ${syncStatus.success ? 'text-green-600' : 'text-red-500'}`}>
              {syncStatus.message}
            </p>
          )}
        </div>
      )}

      <p className="text-center text-sm text-gray-500 mt-6">
        Thank You Visit Again
      </p>
    </div>
  );
};

export default InvoiceCard;
