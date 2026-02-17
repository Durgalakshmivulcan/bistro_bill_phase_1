import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
  defaultValue?: string;
}

/**
 * SearchInput component with debounced onChange
 *
 * Features:
 * - Debounced search to avoid excessive API calls
 * - Customizable debounce delay
 * - Search icon indicator
 * - Controlled input with local state
 *
 * @example
 * ```tsx
 * <SearchInput
 *   placeholder="Search products..."
 *   onSearch={(query) => fetchProducts(query)}
 *   debounceMs={500}
 * />
 * ```
 */
export default function SearchInput({
  placeholder = "Search here...",
  onSearch,
  debounceMs = 300,
  className = "",
  defaultValue = ""
}: SearchInputProps) {
  const [query, setQuery] = useState(defaultValue);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onSearch]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full border border-grey rounded-md px-3 pr-10 py-2 text-sm bg-bb-bg placeholder:text-gray-500"
      />
      <Search
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
    </div>
  );
}
