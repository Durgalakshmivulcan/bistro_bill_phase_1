interface Props {
  title: string;
}

const SectionHeader = ({ title }: Props) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-bb-text">{title}</h2>

      <button className="text-xs text-bb-textSoft border border-bb-border px-3 py-1 rounded-md hover:bg-bb-surfaceSoft">
        Filter by
      </button>
    </div>
  );
};

export default SectionHeader;
