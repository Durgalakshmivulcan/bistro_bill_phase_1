import { useState, useMemo } from 'react';

interface UseSearchOptions<T> {
  /**
   * Array of items to search through
   */
  items: T[];

  /**
   * Function to extract searchable text from an item
   * @example
   * searchFields: (item) => [item.name, item.description, item.sku]
   */
  searchFields: (item: T) => string[];

  /**
   * Whether to perform case-sensitive search
   * @default false
   */
  caseSensitive?: boolean;

  /**
   * Initial search query
   * @default ""
   */
  initialQuery?: string;
}

interface UseSearchResult<T> {
  /**
   * Current search query
   */
  query: string;

  /**
   * Update the search query
   */
  setQuery: (query: string) => void;

  /**
   * Filtered items based on search query
   */
  filteredItems: T[];

  /**
   * Clear the search query
   */
  clearSearch: () => void;

  /**
   * Whether search is active (query is not empty)
   */
  isSearching: boolean;
}

/**
 * Custom hook for client-side search functionality
 *
 * Features:
 * - Client-side filtering of items array
 * - Multiple field search support
 * - Case-sensitive/insensitive search
 * - Memoized filtering for performance
 *
 * @example
 * ```tsx
 * const { query, setQuery, filteredItems } = useSearch({
 *   items: products,
 *   searchFields: (product) => [product.name, product.sku, product.category]
 * });
 *
 * return (
 *   <>
 *     <SearchInput onSearch={setQuery} />
 *     {filteredItems.map(item => <ProductCard key={item.id} product={item} />)}
 *   </>
 * );
 * ```
 */
export function useSearch<T>({
  items,
  searchFields,
  caseSensitive = false,
  initialQuery = ""
}: UseSearchOptions<T>): UseSearchResult<T> {
  const [query, setQuery] = useState(initialQuery);

  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return items;
    }

    const searchTerm = caseSensitive ? query : query.toLowerCase();

    return items.filter((item) => {
      const fields = searchFields(item);
      return fields.some((field) => {
        const fieldValue = caseSensitive ? field : field.toLowerCase();
        return fieldValue.includes(searchTerm);
      });
    });
  }, [items, query, searchFields, caseSensitive]);

  const clearSearch = () => {
    setQuery("");
  };

  const isSearching = query.trim().length > 0;

  return {
    query,
    setQuery,
    filteredItems,
    clearSearch,
    isSearching
  };
}

/**
 * Type guard to check if an item matches search criteria
 * Useful for custom filtering logic
 */
export function matchesSearch<T>(
  item: T,
  query: string,
  searchFields: (item: T) => string[],
  caseSensitive = false
): boolean {
  if (!query.trim()) {
    return true;
  }

  const searchTerm = caseSensitive ? query : query.toLowerCase();
  const fields = searchFields(item);

  return fields.some((field) => {
    const fieldValue = caseSensitive ? field : field.toLowerCase();
    return fieldValue.includes(searchTerm);
  });
}
