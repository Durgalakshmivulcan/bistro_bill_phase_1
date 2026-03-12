import { ChevronDown } from 'lucide-react';
import Select from '../form/Select';

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  /**
   * Label for the filter dropdown (displayed as first option when nothing selected)
   */
  label: string;

  /**
   * Current selected value(s)
   * - For single-select: string
   * - For multi-select: string[]
   */
  value: string | string[];

  /**
   * Available filter options
   */
  options: FilterOption[];

  /**
   * Callback when filter value changes
   * - For single-select: receives string
   * - For multi-select: receives string[]
   */
  onChange: (value: string | string[]) => void;

  /**
   * Enable multi-select mode
   * @default false
   */
  multiSelect?: boolean;

  /**
   * Custom className for styling
   */
  className?: string;

  /**
   * Disable the filter dropdown
   */
  disabled?: boolean;
}

/**
 * FilterDropdown component with single-select and multi-select modes
 *
 * Features:
 * - Single-select mode: standard dropdown
 * - Multi-select mode: checkbox-based selection (future enhancement)
 * - Customizable options and styling
 * - Built on top of existing Select component
 *
 * @example
 * ```tsx
 * // Single-select
 * <FilterDropdown
 *   label="Filter by Status"
 *   value={statusFilter}
 *   options={[
 *     { label: "Active", value: "active" },
 *     { label: "Inactive", value: "inactive" }
 *   ]}
 *   onChange={(value) => setStatusFilter(value as string)}
 * />
 *
 * // Multi-select
 * <FilterDropdown
 *   label="Filter by Categories"
 *   value={categoryFilters}
 *   options={categoryOptions}
 *   onChange={(values) => setCategoryFilters(values as string[])}
 *   multiSelect
 * />
 * ```
 */
export default function FilterDropdown({
  label,
  value,
  options,
  onChange,
  multiSelect = false,
  className = "",
  disabled = false
}: FilterDropdownProps) {
  // For single-select mode, use existing Select component
  if (!multiSelect) {
    const selectOptions = [
      { label, value: "" }, // Placeholder option
      ...options
    ];

    const normalizedValue =
      typeof value === "string" && value !== label ? value : "";

    return (
      <div className={className}>
        <Select
          value={normalizedValue}
          onChange={(newValue) => onChange(newValue)}
          options={selectOptions}
          disabled={disabled}
        />
      </div>
    );
  }

  // Multi-select mode implementation
  // For now, we'll implement a simple multi-select using checkboxes in a dropdown
  const selectedValues = Array.isArray(value) ? value : [];
  const selectedCount = selectedValues.length;

  const handleToggleOption = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      // Remove from selection
      onChange(selectedValues.filter(v => v !== optionValue));
    } else {
      // Add to selection
      onChange([...selectedValues, optionValue]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className={`relative ${className}`}>
      <details className="group">
        <summary className="flex items-center justify-between w-full border border-grey rounded-md px-3 py-2 text-sm bg-bb-bg cursor-pointer list-none">
          <span className={selectedCount > 0 ? "text-bb-text" : "text-gray-500"}>
            {selectedCount > 0 ? `${label} (${selectedCount})` : label}
          </span>
          <ChevronDown
            size={16}
            className="text-gray-400 transition-transform group-open:rotate-180"
          />
        </summary>

        <div className="absolute z-10 w-full mt-1 bg-white border border-grey rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Clear all button */}
          {selectedCount > 0 && (
            <div className="sticky top-0 bg-gray-50 border-b border-grey px-3 py-2">
              <button
                onClick={handleClearAll}
                className="text-xs text-bb-primary hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Options with checkboxes */}
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleOption(option.value)}
                  className="w-4 h-4 text-bb-primary border-gray-300 rounded focus:ring-bb-primary"
                  disabled={disabled}
                />
                <span className="text-sm text-bb-text">{option.label}</span>
              </label>
            );
          })}

          {options.length === 0 && (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              No options available
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
