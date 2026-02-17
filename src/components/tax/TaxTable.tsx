import { Tax } from "../../services/settingsService";
import TaxRow from "./TaxRow";

type Props = {
  taxes: Tax[];
  onTaxDeleted?: () => void;
  onTaxUpdated?: () => void;
};

const TaxTable: React.FC<Props> = ({ taxes, onTaxDeleted, onTaxUpdated }) => {
  return (
    <div className="bg-white rounded-md overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-yellow-400">
          <tr>
            <th className="px-4 py-3 text-left font-medium">
              Tax Name
            </th>
            <th className="px-4 py-3 text-left font-medium">
              Percentage
            </th>
            <th className="px-4 py-3 text-left font-medium">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {taxes.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                <p>No taxes found</p>
              </td>
            </tr>
          ) : (
            taxes.map((tax) => (
              <TaxRow key={tax.id} tax={tax} onDeleted={onTaxDeleted} onUpdated={onTaxUpdated} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TaxTable;
