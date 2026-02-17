type InvoiceItem = {
  name: string;
  qty: number;
  price: number;
};

type Props = {
  items?: InvoiceItem[];
};

const InvoiceItemsTable: React.FC<Props> = ({ items = [] }) => {
  // 🛑 Guard: no items
  if (!items.length) {
    return (
      <p className="text-center text-xs text-gray-400 mt-4">
        No items available
      </p>
    );
  }

  return (
    <table className="w-full text-sm mt-4">
      <thead className="border-b">
        <tr className="text-left text-gray-500">
          <th>Items</th>
          <th className="text-center">Qty</th>
          <th className="text-right">Price</th>
        </tr>
      </thead>

      <tbody>
        {items.map((item, index) => (
          <tr key={index} className="border-b last:border-none">
            <td className="py-2">{item.name}</td>
            <td className="text-center">{item.qty}</td>
            <td className="text-right">
              ₹ {item.price.toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default InvoiceItemsTable;
