import React from "react";
import { OrderItem } from "../../types/orderDetails";
import OrderRow from "./OrderRow";

type Props = {
  orders: OrderItem[];
};

const headers = [
  "Order No.",
  "Branch",
  "Customer Details",
  "Order Type",
  "Order Value",
  "Payment Tag",
  "Created At",
  "Actions",
];

const OrderTable: React.FC<Props> = ({ orders }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
      <table className="min-w-[1100px] w-full text-sm">
        <thead className="bg-yellow-400 text-black">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left font-medium whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
