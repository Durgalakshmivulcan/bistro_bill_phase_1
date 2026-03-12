import { Tax } from "../../services/settingsService";
import TaxRow from "./TaxRow";

type Props = {
  taxes: Tax[];
  onTaxDeleted?: () => void;
  onTaxUpdated?: () => void;
};

const TaxTable: React.FC<Props> = ({ taxes, onTaxDeleted, onTaxUpdated }) => {
  return (
    <div className="bg-white rounded-md border border-[#EADFC2] overflow-x-auto shadow-sm">
      <table className="w-full text-sm min-w-[640px]">
        <thead className="bg-yellow-400 text-black">
          <tr>
            <th className="px-6 py-4 text-left font-medium">
              Tax Name
            </th>
            <th className="px-6 py-4 text-left font-medium w-40">
              Percentage
            </th>
            <th className="px-6 py-4 text-left font-medium w-28">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {taxes.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
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
