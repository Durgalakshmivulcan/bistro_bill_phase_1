import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
  value?: string; // ⭐ NEW (controlled support)
  defaultValue?: string;
}

export default function SearchInput({
  placeholder = "Search here...",
  onSearch,
  debounceMs = 300,
  className = "",
  value,
  defaultValue = "",
}: SearchInputProps) {
  const [query, setQuery] = useState(value ?? defaultValue);

  // ⭐ Sync when parent controls value
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  // ⭐ Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onSearch]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    []
  );

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 pr-10 py-2 text-sm bg-bb-bg placeholder:text-gray-500"
      />
      <Search
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-black"
      />
    </div>
  );
}
