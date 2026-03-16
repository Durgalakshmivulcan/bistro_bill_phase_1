const tabs = ["All", "New", "Accepted", "Waiting", "Cancelled"];

interface ReservationsHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ReservationsHeader: React.FC<ReservationsHeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <div className="flex gap-6 border-b min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`pb-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReservationsHeader;
