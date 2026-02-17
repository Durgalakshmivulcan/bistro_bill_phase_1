import { Clock } from "lucide-react";
import { BaseOrder } from "./OrderTypes";

export type OrderItem = {
  name: string;
  qty: number;
  price: number;
};

export type OrderType = "Dine In" | "Catering" | "Take Away" | "Subscription";

export type Order = BaseOrder & {
  type: OrderType;
};

const initialBgByType: Record<OrderType, string> = {
  "Dine In": "bg-[#DDAA18]",
  Catering: "bg-[#FC5D3D]",
  "Take Away": "bg-[#2B5361]",
  Subscription: "bg-[#3965F4]",
};

const bgByType: Record<OrderType, string> = {
  "Dine In": "bg-[#FFFAEB]",
  Catering: "bg-[#FFF3F0]",
  "Take Away": "bg-[#F4FCFF]",
  "Subscription": "bg-[#F0F4FF]",
};

type Props = {
  order: Order;
  isUpdated?: boolean;
  onClick?: (order: Order) => void;
  onPrintKOT?: (order: Order) => void;
  onPayBill?: (order: Order) => void;
};

const OrderCard: React.FC<Props> = ({ order, isUpdated = false, onClick, onPrintKOT, onPayBill }) => {
  return (
    <div
      onClick={() => onClick?.(order)}
      className={`
        rounded-xl
        border
        p-4
        space-y-3
        shadow-sm
        cursor-pointer
        ${bgByType[order.type]}
        ${isUpdated ? 'ring-2 ring-green-500 animate-pulse' : ''}
        transition-all duration-300
        hover:shadow-md
      `}
    >
      {/* HEADER */}
      <div className="flex justify-between items-start">

        {/* LEFT */}
        <div className="flex gap-3 items-start">

          {/* INITIAL */}
          <div
            className={`
    w-9 h-9
    rounded-lg
    text-white
    flex
    items-center
    justify-center
    font-semibold
    shrink-0
    ${initialBgByType[order.type]}
  `}
          >
            {order.initials}
          </div>


          {/* NAME */}
          <div>
            <p className="font-medium leading-tight">
              {order.customer}
            </p>

            <div className="flex items-center gap-2 text-xs mt-0.5">
              <span className="text-gray-500">
                #{order.id}
              </span>

              <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-medium">
                {order.type}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col items-end gap-1">

          <span
            className={`text-xs px-2 py-0.5 rounded font-medium ${order.paymentClass}`}
          >
            {order.payment}
          </span>

          {order.statusText && (
            <span className="text-[11px] text-yellow-600">
              ● {order.statusText}
            </span>
          )}
        </div>
      </div>

      {/* DATE / TIME */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>{order.date}</span>

        <span className="flex items-center gap-1">
          <Clock size={12} />
          {order.time}
        </span>
      </div>

      {/* HEADER ROW */}
      <div className="grid grid-cols-[1fr_50px_80px] text-xs font-medium text-gray-500 border-b pb-1">
        <span>Items</span>
        <span className="text-center">Qty</span>
        <span className="text-right">Price</span>
      </div>

      {/* ITEMS */}
      <div className="space-y-1 text-sm">

        {order.items.map((item) => (
          <div
            key={item.name}
            className="grid grid-cols-[1fr_50px_80px]"
          >
            <span>{item.name}</span>
            <span className="text-center">
              {item.qty}
            </span>
            <span className="text-right">
              ₹{item.price.toFixed(2)}
            </span>
          </div>
        ))}

      </div>

      {/* TOTALS */}
      <div className="border-t pt-2 space-y-1 text-sm">

        <div className="flex justify-between">
          <span className="text-gray-500">
            Subtotal
          </span>
          <span>₹{order.subtotal.toFixed(2)}</span>
        </div>

        {order.collected !== undefined && (
          <div className="flex justify-between">
            <span className="text-gray-500">
              Amount Collected
            </span>
            <span>₹{order.collected.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between font-semibold">
          <span>Total Payable</span>
          <span>₹{order.total.toFixed(2)}</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 pt-3">

        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrintKOT?.(order);
          }}
          className="flex-1 border border-black rounded-lg py-2 text-sm"
        >
          Print KOT
        </button>

        <button
          disabled={order.disablePay}
          onClick={(e) => {
            e.stopPropagation();
            onPayBill?.(order);
          }}
          className={`
            flex-1 rounded-lg py-2 text-sm font-medium
            ${order.disablePay
              ? "bg-bb-primary text-yellow-700"
              : "bg-[#FDC836]"
            }
          `}
        >
          Pay Bill
        </button>

      </div>
    </div>
  );
};

export default OrderCard;
