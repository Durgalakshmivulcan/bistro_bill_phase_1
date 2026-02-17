interface Props {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onClear: () => void;
}

const PlansFilter = ({ statusFilter, onStatusChange, onClear }: Props) => {
  return (
    <div className="flex justify-end gap-3">
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="border px-3 py-2 rounded-md text-sm"
      >
        <option value="">Filter by Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <button
        onClick={onClear}
        className="bg-yellow-400 px-4 py-2 rounded-md text-sm font-medium"
      >
        Clear
      </button>
    </div>
  );
};

export default PlansFilter;
