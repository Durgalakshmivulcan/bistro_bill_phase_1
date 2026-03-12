import TaxGroupRow from "./TaxGroupRow";

type Props = {
  groups: any[];
  onEditSuccess: () => void;
  onDeleteSuccess: () => void;
};

const TaxGroupTable: React.FC<Props> = ({
  groups,
  onEditSuccess,
  onDeleteSuccess,
}) => {
  return (
    <div className="bg-white rounded-md border border-[#EADFC2] overflow-x-auto shadow-sm">
      <table className="w-full text-sm min-w-[780px]">
        <thead className="bg-yellow-400 text-black">
          <tr>
            <th className="px-6 py-4 text-left font-medium">
              Tax Name
            </th>
            <th className="px-6 py-4 text-left font-medium">
              Mix of
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
          {groups.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                <p>No tax groups found</p>
              </td>
            </tr>
          ) : (
            groups.map((group) => (
              <TaxGroupRow
                key={group.id}
                group={group}
                onEditSuccess={onEditSuccess}
                onDeleteSuccess={onDeleteSuccess}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TaxGroupTable;
