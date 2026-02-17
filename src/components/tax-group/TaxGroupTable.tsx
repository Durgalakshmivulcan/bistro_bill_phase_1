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
    <div className="overflow-x-auto border rounded-lg bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left">Group Name</th>
            <th className="px-4 py-3 text-left">Taxes</th>
            <th className="px-4 py-3 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {groups.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
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
