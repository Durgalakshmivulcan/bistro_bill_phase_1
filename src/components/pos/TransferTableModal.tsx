import { useState, useEffect } from "react";
import { transferTable, getTableStatusOverview, FloorWithTables, TableStatus } from "../../services/orderService";

interface TransferTableModalProps {
  orderId: string;
  currentTableId: string;
  currentTableName: string;
  branchId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const TransferTableModal = ({
  orderId,
  currentTableId,
  currentTableName,
  branchId,
  onClose,
  onSuccess
}: TransferTableModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [floors, setFloors] = useState<FloorWithTables[]>([]);
  const [availableTables, setAvailableTables] = useState<TableStatus[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getTableStatusOverview(branchId);

        if (response.success && response.data) {
          setFloors(response.data.floors);

          // Filter only available and reserved tables (exclude current table)
          const allTables = response.data.floors.flatMap(floor => floor.tables);
          const available = allTables.filter(
            table =>
              table.id !== currentTableId &&
              (table.currentStatus === 'available' || table.currentStatus === 'reserved')
          );
          setAvailableTables(available);
        } else {
          setError(response.error?.message || "Failed to load tables");
        }
      } catch (err) {
        console.error("Error fetching tables:", err);
        setError("An error occurred while loading tables");
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, [branchId, currentTableId]);

  const filteredTables = availableTables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.floorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTransfer = async () => {
    if (!selectedTableId) {
      setError("Please select a table to transfer to");
      return;
    }

    setTransferring(true);
    setError(null);

    try {
      const response = await transferTable(orderId, selectedTableId);

      if (response.success) {
        onSuccess();
      } else {
        setError(response.error?.message || "Failed to transfer table");
      }
    } catch (err) {
      console.error("Error transferring table:", err);
      setError("An error occurred while transferring table");
    } finally {
      setTransferring(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 max-h-[80vh] flex flex-col">
        <div className="flex justify-between mb-4">
          <h3 className="text-xl font-bold">
            Transfer Table
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-bb-textSoft mb-1">Current Table:</p>
          <p className="text-base font-semibold">{currentTableName}</p>
        </div>

        <p className="text-sm mb-2">
          Select the table you want to transfer to:
        </p>

        <input
          placeholder="Search table or floor..."
          className="w-full border rounded-md px-3 py-2 mb-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="text-bb-textSoft">Loading tables...</div>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="text-bb-textSoft text-center">
              {searchQuery ? "No tables found matching your search" : "No available tables"}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto mb-4 border rounded-md">
            <div className="divide-y">
              {filteredTables.map((table) => (
                <label
                  key={table.id}
                  className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition ${
                    selectedTableId === table.id ? 'bg-bb-primary/10' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="table"
                    value={table.id}
                    checked={selectedTableId === table.id}
                    onChange={(e) => setSelectedTableId(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{table.name}</div>
                    <div className="text-sm text-bb-textSoft">{table.floorName}</div>
                    <div className="text-xs text-bb-textSoft">Capacity: {table.capacity}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(table.currentStatus)}`}>
                    {table.currentStatus}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <button
            className="border px-4 py-2 rounded-md hover:bg-gray-50 transition"
            onClick={onClose}
            disabled={transferring}
          >
            Cancel
          </button>
          <button
            className="bg-bb-primary px-4 py-2 rounded-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleTransfer}
            disabled={!selectedTableId || transferring}
          >
            {transferring ? "Transferring..." : "Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferTableModal;
