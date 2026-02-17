import { useState, useMemo } from 'react';

/**
 * Single filter definition
 */
export interface FilterDefinition<T> {
  /**
   * Unique key for this filter
   */
  key: string;

  /**
   * Function to check if an item passes this filter
   * @param item - The item to test
   * @param filterValue - The current filter value (string or string[])
   * @returns true if item passes the filter
   */
  predicate: (item: T, filterValue: string | string[]) => boolean;

  /**
   * Default value for this filter
   * @default "" for single-select, [] for multi-select
   */
  defaultValue?: string | string[];
}

/**
 * Map of filter keys to their current values
 */
export type FilterValues = Record<string, string | string[]>;

interface UseFiltersOptions<T> {
  /**
   * Array of items to filter
   */
  items: T[];

  /**
   * Filter definitions
   */
  filters: FilterDefinition<T>[];
}

interface UseFiltersResult<T> {
  /**
   * Current filter values
   */
  filterValues: FilterValues;

  /**
   * Update a specific filter value
   */
  setFilterValue: (key: string, value: string | string[]) => void;

  /**
   * Filtered items based on all active filters
   */
  filteredItems: T[];

  /**
   * Clear all filters (reset to default values)
   */
  clearAllFilters: () => void;

  /**
   * Clear a specific filter
   */
  clearFilter: (key: string) => void;

  /**
   * Check if any filters are active
   */
  hasActiveFilters: boolean;

  /**
   * Get count of active filters
   */
  activeFilterCount: number;
}

/**
 * Custom hook for managing multiple filters
 *
 * Features:
 * - Support for multiple filter types (single-select, multi-select)
 * - Client-side filtering with memoized results
 * - Easy filter reset and management
 * - Composable filter predicates
 *
 * @example
 * ```tsx
 * const { filterValues, setFilterValue, filteredItems, clearAllFilters } = useFilters({
 *   items: products,
 *   filters: [
 *     {
 *       key: 'status',
 *       predicate: (product, value) => {
 *         if (!value || value === 'All') return true;
 *         return product.status === value;
 *       },
 *       defaultValue: 'All'
 *     },
 *     {
 *       key: 'categories',
 *       predicate: (product, values) => {
 *         if (!Array.isArray(values) || values.length === 0) return true;
 *         return values.includes(product.categoryId);
 *       },
 *       defaultValue: []
 *     }
 *   ]
 * });
 *
 * return (
 *   <>
 *     <FilterDropdown
 *       label="Status"
 *       value={filterValues.status}
 *       options={statusOptions}
 *       onChange={(value) => setFilterValue('status', value)}
 *     />
 *     <FilterDropdown
 *       label="Categories"
 *       value={filterValues.categories}
 *       options={categoryOptions}
 *       onChange={(values) => setFilterValue('categories', values)}
 *       multiSelect
 *     />
 *     {filteredItems.map(item => <ProductCard key={item.id} product={item} />)}
 *   </>
 * );
 * ```
 */
export function useFilters<T>({
  items,
  filters
}: UseFiltersOptions<T>): UseFiltersResult<T> {
  // Initialize filter values from defaults
  const initialValues: FilterValues = useMemo(() => {
    const values: FilterValues = {};
    filters.forEach(filter => {
      values[filter.key] = filter.defaultValue ?? "";
    });
    return values;
  }, [filters]);

  const [filterValues, setFilterValues] = useState<FilterValues>(initialValues);

  // Update a specific filter value
  const setFilterValue = (key: string, value: string | string[]) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear a specific filter
  const clearFilter = (key: string) => {
    const filter = filters.find(f => f.key === key);
    if (filter) {
      setFilterValue(key, filter.defaultValue ?? "");
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilterValues(initialValues);
  };

  // Apply all filters to items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Item must pass ALL filters
      return filters.every(filter => {
        const filterValue = filterValues[filter.key];
        return filter.predicate(item, filterValue);
      });
    });
  }, [items, filters, filterValues]);

  // Check if any filters are active (non-default)
  const hasActiveFilters = useMemo(() => {
    return filters.some(filter => {
      const currentValue = filterValues[filter.key];
      const defaultValue = filter.defaultValue ?? "";

      // Compare arrays
      if (Array.isArray(currentValue) && Array.isArray(defaultValue)) {
        return currentValue.length !== defaultValue.length ||
          !currentValue.every((v, i) => v === defaultValue[i]);
      }

      // Compare strings
      return currentValue !== defaultValue;
    });
  }, [filterValues, filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return filters.filter(filter => {
      const currentValue = filterValues[filter.key];
      const defaultValue = filter.defaultValue ?? "";

      // Count arrays with items
      if (Array.isArray(currentValue)) {
        return currentValue.length > 0;
      }

      // Count non-empty, non-default strings
      return currentValue !== "" && currentValue !== defaultValue;
    }).length;
  }, [filterValues, filters]);

  return {
    filterValues,
    setFilterValue,
    filteredItems,
    clearAllFilters,
    clearFilter,
    hasActiveFilters,
    activeFilterCount
  };
}

/**
 * Helper function to check if filter value is active (not default/empty)
 */
export function isFilterActive(value: string | string[], defaultValue?: string | string[]): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  const defaultVal = defaultValue ?? "";
  return value !== "" && value !== defaultVal;
}

/**
 * Common filter predicates for reuse
 */
export const filterPredicates = {
  /**
   * Single-select filter that matches exact value
   */
  exactMatch: <T>(field: keyof T) => (item: T, value: string | string[]) => {
    if (!value || value === "" || (Array.isArray(value) && value.length === 0)) {
      return true;
    }
    return String(item[field]) === value;
  },

  /**
   * Multi-select filter that matches any of the selected values
   */
  includesAny: <T>(field: keyof T) => (item: T, values: string | string[]) => {
    if (!Array.isArray(values) || values.length === 0) {
      return true;
    }
    return values.includes(String(item[field]));
  },

  /**
   * Date range filter
   */
  dateRange: <T>(field: keyof T) => (item: T, range: string | string[]) => {
    if (!range || range === "") return true;

    const itemDate = new Date(item[field] as any);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (range) {
      case "Today": {
        const checkDate = new Date(itemDate);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate.getTime() === today.getTime();
      }
      case "Last 7 days": {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return itemDate >= sevenDaysAgo && itemDate <= today;
      }
      case "Last 30 days": {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return itemDate >= thirtyDaysAgo && itemDate <= today;
      }
      default:
        return true;
    }
  },

  /**
   * Boolean filter (active/inactive, yes/no, etc.)
   */
  boolean: <T>(field: keyof T, activeValue: string = "active") => (item: T, value: string | string[]) => {
    if (!value || value === "" || value === "All") return true;
    const itemValue = String(item[field]).toLowerCase();
    const filterValue = String(value).toLowerCase();
    return itemValue === filterValue || (filterValue === activeValue && itemValue === "active");
  }
};
