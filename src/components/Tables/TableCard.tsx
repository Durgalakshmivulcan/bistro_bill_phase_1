interface TableCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  filterLabel?: string;
  filterValue?: string;
  filterOptions?: Array<{ label: string; value: string }>;
  onFilterChange?: (value: string) => void;
}

const TableCard = ({
  title,
  subtitle,
  children,
  filterLabel,
  filterValue,
  filterOptions,
  onFilterChange,
}: TableCardProps) => {
  return (
    <div className="bg-[#FFFEFA] border border-[#E8DFCC] rounded-md p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 gap-3">
        <div className="flex items-center gap-1 min-w-0">
          <h3 className="text-[30px] leading-none font-semibold text-[#D79A00] whitespace-nowrap">{title}</h3>
          {subtitle && <p className="text-[12px] text-[#111827] mt-1">{subtitle}</p>}
        </div>

        {filterLabel && filterOptions?.length && onFilterChange ? (
          <select
            value={filterValue || ""}
            onChange={(e) => onFilterChange(e.target.value)}
            className="border border-[#D9D9D9] bg-white rounded-md px-3 py-1.5 text-[12px] text-[#6B7280]"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : filterLabel ? (
          <button className="bb-btn bb-btn-secondary bb-btn-sm">
            {filterLabel}
          </button>
        ) : null}
      </div>

      {children}
    </div>
  );
};

export default TableCard;
