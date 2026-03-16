import { useEffect, useMemo, useState } from "react";
import { useBranch } from "../../contexts/BranchContext";
import { getFloors, getTables } from "../../services/tableService";

const statusColor = {
  available: "bg-green-200 text-green-700",
  running: "bg-blue-200 text-blue-700",
  reserved: "bg-red-200 text-red-700",
  maintenance: "bg-gray-200 text-gray-700",
};

const TablesSection = ({ onTableClick }: any) => {
  const { currentBranchId, currentBranch, availableBranches, isAllLocationsSelected } = useBranch();
  const branchId =
    !isAllLocationsSelected && currentBranchId
      ? currentBranchId
      : currentBranch?.id || availableBranches[0]?.id || "";

  const [floors, setFloors] = useState<Array<{ id: string; name: string }>>([]);
  const [tablesByFloor, setTablesByFloor] = useState<Record<string, Array<{ id: string; status: string }>>>({});

  useEffect(() => {
    if (!branchId) {
      setFloors([]);
      setTablesByFloor({});
      return;
    }

    const loadResources = async () => {
      const floorsResponse = await getFloors(branchId, "active");
      if (!floorsResponse.success || !floorsResponse.data?.floors) {
        setFloors([]);
        setTablesByFloor({});
        return;
      }

      const nextFloors = floorsResponse.data.floors.map((floor) => ({ id: floor.id, name: floor.name }));
      setFloors(nextFloors);

      const tableEntries = await Promise.all(
        nextFloors.map(async (floor) => {
          const tablesResponse = await getTables(floor.id);
          return [
            floor.id,
            tablesResponse.success && tablesResponse.data?.tables
              ? tablesResponse.data.tables
                  .filter((table) => table.status !== "maintenance")
                  .map((table) => ({ id: table.tableNumber, status: table.status }))
              : [],
          ] as const;
        })
      );

      setTablesByFloor(Object.fromEntries(tableEntries));
    };

    void loadResources();
  }, [branchId]);

  const visibleFloors = useMemo(
    () => floors.filter((floor) => (tablesByFloor[floor.id] || []).length > 0),
    [floors, tablesByFloor]
  );

  return (
    <div className="space-y-6">
      {visibleFloors.map((floor) => (
        <div key={floor.id} className="bg-gray-100 rounded-lg p-4">
          <h3 className="font-bold mb-4">{floor.name}</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {(tablesByFloor[floor.id] || []).map((table) => (
              <button
                key={`${floor.id}-${table.id}`}
                onClick={() => onTableClick?.(table.id, floor.id)}
                className="relative bg-white border rounded-xl h-24 flex items-center justify-center"
              >
                <span
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-medium ${
                    statusColor[table.status as keyof typeof statusColor] || "bg-gray-200 text-gray-700"
                  }`}
                >
                  {table.id}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TablesSection;
