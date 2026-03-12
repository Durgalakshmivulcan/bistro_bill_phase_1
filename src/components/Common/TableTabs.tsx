interface Props {
  active: string;
  tabs: string[];
  onChange: (tab: string) => void;
}

const TableTabs = ({ active, tabs, onChange }: Props) => {
  return (
    <div className="flex gap-3 mb-3">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`p-1.5  rounded-t-md text-[10px] leading-none font-medium transition
            ${
              active === tab
                ? "bg-black text-white"
                : "bg-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default TableTabs;
