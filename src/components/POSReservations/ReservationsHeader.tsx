const tabs = ["All", "New", "Accepted", "Waiting", "Cancelled"];

interface ReservationsHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ReservationsHeader: React.FC<ReservationsHeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <div
      className="
        flex flex-col gap-4
        md:flex-row md:items-center md:justify-between
      "
    >
      {/* Tabs */}
      <div className="overflow-x-auto">
        <div className="flex gap-6 border-b min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`pb-2 text-sm whitespace-nowrap ${
                activeTab === tab
                  ? "border-b-2 border-black font-semibold"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      {/* <div className="relative w-full md:w-auto">
        <input
          placeholder="Search here..."
          className="
            w-full
            md:w-64
            rounded-lg
            border
            px-3 py-2
            text-sm
            focus:outline-none
            focus:ring-2
            focus:ring-black/20
          "
        />
      </div> */}
    </div>
  );
};

export default ReservationsHeader;
