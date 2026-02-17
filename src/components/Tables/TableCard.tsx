interface TableCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  filterLabel?: string;
}

const TableCard = ({ title, subtitle, children, filterLabel }: TableCardProps) => {
  return (
    <div className="bg-bb-surface border border-bb-border rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-bb-warning">{title}</h3>
          {subtitle && (
            <p className="text-xs text-bb-textSoft">{subtitle}</p>
          )}
        </div>

        {filterLabel && (
          <button className="bb-btn bb-btn-secondary bb-btn-sm">
            {filterLabel}
          </button>
        )}
      </div>

      {children}
    </div>
  );
};

export default TableCard;
