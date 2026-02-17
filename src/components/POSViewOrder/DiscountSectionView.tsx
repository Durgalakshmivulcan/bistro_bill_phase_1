import { useState, useCallback } from "react";
import POSActionsBar from "../NavTabs/POSActionsBar";

interface FloorOption {
  id: string;
  name: string;
}

type Props = {
  viewMode: "grid" | "list";
  setViewMode: (v: "grid" | "list") => void;
  floors?: FloorOption[];
  onSearchChange?: (search: string) => void;
  onFloorFilter?: (floorId: string) => void;
  onStatusFilter?: (status: string) => void;
  onClear?: () => void;
  onRefresh?: () => void;
};

const DiscountSectionView = ({
  viewMode,
  setViewMode,
  floors = [],
  onSearchChange,
  onFloorFilter,
  onStatusFilter,
  onClear,
  onRefresh,
}: Props) => {
  const [search, setSearch] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      onSearchChange?.(value);
    },
    [onSearchChange]
  );

  const handleClear = () => {
    setSearch("");
    setFloorFilter("");
    setStatusFilter("");
    onClear?.();
  };

  return (
    <div className="space-y-4">
      {/* POS ACTION BAR */}
      <POSActionsBar />

      {/* Search & Filters Row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          placeholder="Search here..."
          className="h-10 w-52 rounded-lg border bg-white px-3 text-sm"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />

        <select
          className="h-10 rounded-lg border bg-white px-3 text-sm"
          value={floorFilter}
          onChange={(e) => {
            setFloorFilter(e.target.value);
            onFloorFilter?.(e.target.value);
          }}
        >
          <option value="">Filter by Floor / Area</option>
          {floors.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <select
          className="h-10 rounded-lg border bg-white px-3 text-sm"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            onStatusFilter?.(e.target.value);
          }}
        >
          <option value="">Filter by Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
        </select>

        <button
          className="h-10 rounded-lg bg-yellow-400 px-4 text-sm font-medium"
          onClick={handleClear}
        >
          Clear
        </button>

        <button
          className="h-10 w-10 rounded-lg bg-black text-white"
          onClick={onRefresh}
        >
          &#x27F3;
        </button>

        {/* Status Legend */}
        <div className="ml-auto flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Available
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Reserved
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Order Running
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountSectionView;
