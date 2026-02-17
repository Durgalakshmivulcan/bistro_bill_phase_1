const tables = [
  { id: "T-01", status: "running" },
  { id: "T-02", status: "available" },
  { id: "T-03", status: "running" },
  { id: "T-04", status: "reserved" },
];

const statusColor = {
  available: "bg-green-200 text-green-700",
  running: "bg-blue-200 text-blue-700",
  reserved: "bg-red-200 text-red-700",
};

const TablesSection = ({ onTableClick }: any) => {
  return (
    <div className="space-y-6">
      {["Non-AC Area", "AC Area", "Family Section"].map(
        (section) => (
          <div
            key={section}
            className="bg-gray-100 rounded-lg p-4"
          >
            <h3 className="font-bold mb-4">
              {section}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={onTableClick}
                  className="relative bg-white border rounded-xl h-24 flex items-center justify-center"
                >
                  <span
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-medium ${
                      statusColor[
                        table.status as keyof typeof statusColor
                      ]
                    }`}
                  >
                    {table.id}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default TablesSection;
