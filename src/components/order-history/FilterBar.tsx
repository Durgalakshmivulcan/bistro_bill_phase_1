import React, { useState, useRef, useEffect } from "react";

export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

interface FilterBarProps {
  filters: OrderFilters;
  onFilterChange: (filters: OrderFilters) => void;
  onClear: () => void;
}

const statusOptions = [
  { label: "Paid", value: "Paid" },
  { label: "Unpaid", value: "Unpaid" },
  { label: "Partially Paid", value: "PartiallyPaid" },
  { label: "Refunded", value: "Refunded" },
];

const orderTypeOptions = [
  { label: "Dine In", value: "DineIn" },
  { label: "Takeaway", value: "Takeaway" },
  { label: "Delivery", value: "Delivery" },
  { label: "Online", value: "Online" },
];

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onClear }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleSelect = (key: keyof OrderFilters, value: string) => {
    onFilterChange({ ...filters, [key]: filters[key] === value ? undefined : value });
    setOpenDropdown(null);
  };

  const handleDateChange = (key: "startDate" | "endDate", value: string) => {
    onFilterChange({ ...filters, [key]: value || undefined });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined);

  const getActiveLabel = (key: keyof OrderFilters, defaultLabel: string): string => {
    const value = filters[key];
    if (!value) return defaultLabel;

    if (key === "paymentStatus") {
      return statusOptions.find((o) => o.value === value)?.label || value;
    }
    if (key === "type") {
      return orderTypeOptions.find((o) => o.value === value)?.label || value;
    }
    return value;
  };

  return (
    <div className="flex flex-wrap gap-3 items-center" ref={dropdownRef}>
      {/* Date Range Filter */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={filters.startDate || ""}
          onChange={(e) => handleDateChange("startDate", e.target.value)}
          className="bg-white border px-3 py-2 rounded-md text-sm"
          placeholder="Start Date"
        />
        <span className="text-sm text-gray-500">to</span>
        <input
          type="date"
          value={filters.endDate || ""}
          onChange={(e) => handleDateChange("endDate", e.target.value)}
          className="bg-white border px-3 py-2 rounded-md text-sm"
        />
      </div>

      {/* Order Type Filter */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown("type")}
          className={`bg-white border px-4 py-2 rounded-md text-sm flex items-center gap-2 ${
            filters.type ? "border-bb-primary bg-yellow-50" : ""
          }`}
        >
          {getActiveLabel("type", "Filter by Order Type")}
          <span>⌄</span>
        </button>
        {openDropdown === "type" && (
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-10 min-w-[160px]">
            {orderTypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect("type", option.value)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  filters.type === option.value ? "bg-yellow-50 font-medium" : ""
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Payment Status Filter */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown("paymentStatus")}
          className={`bg-white border px-4 py-2 rounded-md text-sm flex items-center gap-2 ${
            filters.paymentStatus ? "border-bb-primary bg-yellow-50" : ""
          }`}
        >
          {getActiveLabel("paymentStatus", "Filter by Payment Tag")}
          <span>⌄</span>
        </button>
        {openDropdown === "paymentStatus" && (
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-10 min-w-[160px]">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect("paymentStatus", option.value)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  filters.paymentStatus === option.value ? "bg-yellow-50 font-medium" : ""
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clear Button */}
      <button
        onClick={onClear}
        className={`ml-auto px-5 py-2 rounded-md text-sm font-medium ${
          hasActiveFilters
            ? "bg-yellow-400 hover:bg-yellow-500"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}
        disabled={!hasActiveFilters}
      >
        Clear
      </button>
    </div>
  );
};

export default FilterBar;
