import Select from "../form/Select";

interface Props {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onClear: () => void;
}

const PlansFilter = ({ statusFilter, onStatusChange, onClear }: Props) => {
  const statusOptions = [
    { label: "Filter by Status", value: "" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  return (
    <div className="flex justify-end gap-3 items-center">
      <div className="w-52">
        <Select
          value={statusFilter || ""}
          onChange={(val) =>
            onStatusChange(val === "Filter by Status" ? "" : val)
          }
          options={statusOptions}
        />
      </div>

      <button
        onClick={onClear}
        className="bg-yellow-400 px-4 py-2 rounded-md text-sm font-medium border border-black"
      >
        Clear
      </button>
    </div>
  );
};

export default PlansFilter;
