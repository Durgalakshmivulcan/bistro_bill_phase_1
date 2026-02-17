import { useState } from "react";

type FilterGroupDropdownProps = {
  onGroupBySelect?: (value: string, label: string) => void;
  showFilterBy?: boolean;
};



const filterOptions = [
  "Recently Uploaded",
  "From A-Z",
  "From Z-A",
];

const groupOptions = [
  { label: "Product Type", value: "type" },
  { label: "Product Category", value: "category" },
];

const FilterGroupDropdown = ({
  onGroupBySelect,
  showFilterBy = true,
}: FilterGroupDropdownProps) => {
    
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  return (
    <div className="bg-white border rounded-lg shadow-md p-4 flex gap-6 text-sm min-w-[280px]">

      {/* FILTER BY (OPTIONAL) */}
      {showFilterBy && (
        <div className="w-1/2">
          <p className="font-medium mb-2">Filter By</p>
          <ul className="space-y-1">
            {filterOptions.map((item) => (
              <li
                key={item}
                onMouseDown={() => setSelectedFilter(item)}
                className={`px-3 py-1 rounded cursor-pointer
                  ${
                    selectedFilter === item
                      ? "bg-bb-hover font-medium"
                      : "hover:bg-bb-hover"
                  }`}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* GROUP BY */}
      {(!showFilterBy || selectedFilter) && (
        <div className={`${showFilterBy ? "w-1/2 border-l pl-4" : "w-full"}`}>
          <p className="font-medium mb-2">Group By</p>
          <ul className="space-y-1">
            {groupOptions.map((item) => (
              <li
                key={item.value}
               onMouseDown={() =>
  onGroupBySelect?.(item.value, item.label)
}

                className="px-3 py-1 rounded cursor-pointer hover:bg-bb-hover"
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


export default FilterGroupDropdown;
