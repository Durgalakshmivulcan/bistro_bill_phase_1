type Aggregator = "All" | "Swiggy" | "Zomato" | "Uber Eats";

type Props = {
  value: Aggregator;
  onChange: (v: Aggregator) => void;
};

const TABS: { label: string; value: Aggregator }[] = [
  { label: "All", value: "All" },
  { label: "Swiggy", value: "Swiggy" },
  { label: "Zomato", value: "Zomato" },
  { label: "Uber Eats", value: "Uber Eats" },
];

const OnlineAggregatorTabs: React.FC<Props> = ({
  value,
  onChange,
}) => {
  return (
    <div className="flex justify-end gap-3">

      {TABS.map((tab) => {
        const active = value === tab.value;

        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`
              px-5 py-2 rounded-t-[10px] text-sm font-medium transition
              ${
                active
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default OnlineAggregatorTabs;
