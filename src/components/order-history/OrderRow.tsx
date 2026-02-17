import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OrderItem } from "../../types/orderDetails";
import { Pencil, MoreVertical, ViewIcon } from "lucide-react";

const paymentTagStyles: Record<OrderItem["status"], string> = {
  Paid: "bg-black text-yellow-300",
  Unpaid: "bg-black text-white",
  Due: "bg-black text-blue-400",
  Free: "bg-black text-green-400",
  "Partial Paid": "bg-black text-yellow-300",
};

/* ✅ PAYMENT TAG → ROUTE MAP */
const PAYMENT_ROUTE_MAP: Partial<Record<OrderItem["status"], string>> = {
  Paid: "/orders/paid",
  Unpaid: "/orders/unpaid",
  Due: "/orders/due",
};

type Props = {
  order: OrderItem;
};

const OrderRow: React.FC<Props> = ({ order }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEdit = () => {
    setOpen(false);
    navigate("/orderspage", {
      state: { orderId: order.orderNo },
    });
  };

  /* ✅ FIXED VIEW LOGIC */
  const handleView = () => {
    setOpen(false);

    if (order.status === "Paid") {
      navigate(`/order-activity/paid/${order.orderNo}`);
    } else if (order.status === "Unpaid") {
      navigate(`/order-activity/unpaid/${order.orderNo}`);
    } else if (order.status === "Due") {
      navigate(`/order-activity/due/${order.orderNo}`);
    }
  };
  

  return (
    <tr className="border-b last:border-none">
      <td className="px-4 py-3 font-medium">{order.orderNo}</td>
      <td className="px-4 py-3">{order.branch}</td>

      <td className="px-4 py-3">
        <p>{order.customerName}</p>
        <p className="text-xs text-gray-500">{order.phone}</p>
      </td>

      <td className="px-4 py-3">{order.orderType}</td>
      <td className="px-4 py-3">{order.orderValue}</td>

      <td className="px-4 py-3">
        <span
          className={`px-2 py-1 rounded text-xs ${
            paymentTagStyles[order.status]
          }`}
        >
          {order.status}
        </span>
      </td>

      <td className="px-4 py-3">
        <p>{order.createdAt}</p>
        <p className="text-xs text-gray-500">{order.createdBy}</p>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 relative">
        <div ref={menuRef} className="relative inline-block">
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="p-1 rounded hover:bg-gray-100"
          >
            <MoreVertical size={18} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-32 bg-white border rounded-md shadow-lg z-20">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
              >
                <Pencil size={14} />
                Edit
              </button>

              <button
                onClick={handleView}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
              >
                <ViewIcon size={14} />
                View
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default OrderRow;
