import { PaymentOption } from "../../services/settingsService";
import PaymentRow from "./PaymentRow";

type Props = {
  options: PaymentOption[];
  onRefresh: () => void;
  onUpdatedSuccess: () => void | Promise<void>;
};

const PaymentOptionsTable: React.FC<Props> = ({ options, onRefresh, onUpdatedSuccess }) => {
  return (
    <div className="bg-white rounded-md overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-yellow-400">
          <tr>
            <th className="px-4 py-3 text-left font-medium">
              Payment Mode
            </th>
            <th className="px-4 py-3 text-left font-medium">
              Status
            </th>
            <th className="px-4 py-3 text-left font-medium">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {options.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                <p>No payment options found</p>
              </td>
            </tr>
          ) : (
            options.map((option) => (
              <PaymentRow
                key={option.id}
                option={option}
                onRefresh={onRefresh}
                onUpdatedSuccess={onUpdatedSuccess}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentOptionsTable;
