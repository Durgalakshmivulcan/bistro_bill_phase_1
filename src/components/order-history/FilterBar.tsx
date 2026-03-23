import React, { useState, useRef, useEffect } from "react";

export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  branch?: string;
  customer?: string;
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
  { label: "Catering", value: "Catering" },
  { label: "Subscription", value: "Subscription" },
];

const branchOptions = [
  { label: "Hitech City", value: "Hitech City" },
  { label: "Kukatpally", value: "Kukatpally" },
  { label: "Gachibowli", value: "Gachibowli" },
];

const customerOptions = [
  { label: "Priya Gupta", value: "Priya Gupta" },
  { label: "Vivek", value: "Vivek" },
  { label: "Anil Desai", value: "Anil Desai" },
  { label: "Rani Patel", value: "Rani Patel" },
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

  const pillClasses = (active: boolean) =>
    `bg-white border px-4 py-2 rounded-md text-sm flex items-center gap-2 shadow-sm ${
      active ? "border-[#d8b04c] bg-[#fff8e6]" : "hover:bg-gray-50"
    }`;

  const dropdownClasses =
    "absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-10 min-w-[180px]";

  return (
    <div className="flex flex-wrap gap-3 items-center" ref={dropdownRef}>
      {/* Date Filter (start only to match UI) */}
      <div className="relative">
        <label className="sr-only">Filter by Date</label>
        <input
          type="date"
          value={filters.startDate || ""}
          onChange={(e) => {
            handleDateChange("startDate", e.target.value);
            handleDateChange("endDate", e.target.value);
          }}
          className="bg-white border px-4 py-2 rounded-md text-sm shadow-sm cursor-pointer"
        />
      </div>

      {/* Branch Filter */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown("branch")}
          className={pillClasses(!!filters.branch)}
        >
          {getActiveLabel("branch" as keyof OrderFilters, "Filter by Branch")}
          <span>⌄</span>
        </button>
        {openDropdown === "branch" && (
          <div className={dropdownClasses}>
            {branchOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect("branch" as keyof OrderFilters, option.value)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  filters.branch === option.value ? "bg-[#fff3d4] font-medium" : ""
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Customer Filter */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown("customer")}
          className={pillClasses(!!filters.customer)}
        >
          {getActiveLabel("customer" as keyof OrderFilters, "Filter by Customer")}
          <span>⌄</span>
        </button>
        {openDropdown === "customer" && (
          <div className={dropdownClasses}>
            {customerOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect("customer" as keyof OrderFilters, option.value)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  filters.customer === option.value ? "bg-[#fff3d4] font-medium" : ""
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Order Type Filter */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown("type")}
          className={pillClasses(!!filters.type)}
        >
          {getActiveLabel("type", "Filter by Order Type")}
          <span>⌄</span>
        </button>
        {openDropdown === "type" && (
          <div className={dropdownClasses}>
            {orderTypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect("type", option.value)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  filters.type === option.value ? "bg-[#fff3d4] font-medium" : ""
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
          className={pillClasses(!!filters.paymentStatus)}
        >
          {getActiveLabel("paymentStatus", "Filter by Payment Tag")}
          <span>⌄</span>
        </button>
        {openDropdown === "paymentStatus" && (
          <div className={dropdownClasses}>
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect("paymentStatus", option.value)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  filters.paymentStatus === option.value ? "bg-[#fff3d4] font-medium" : ""
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
        className={`ml-auto px-5 py-2 rounded-md text-sm font-medium border shadow-sm ${
          hasActiveFilters
            ? "bg-[#f6c441] hover:bg-[#eeb62b] border-[#e0ac28]"
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
