interface Props {
  active: string;
  tabs: string[];
  onChange: (tab: string) => void;
}

const TableTabs = ({ active, tabs, onChange }: Props) => {
  return (
    <div className="flex gap-2 mb-3">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition
            ${
              active === tab
                ? "bg-black text-white"
                : "bg-bb-surfaceSoft text-bb-textSoft"
            }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default TableTabs;
