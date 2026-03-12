import { Filter, ChevronRight } from "lucide-react";

export type FilterByValue =
  | "recent"
  | "az"
  | "za"
  | "regular"
  | "combo"
  | "retail"
  | "addons"
  | "favorites"
  | "lowStock";

export type GroupByValue =
  | "type"
  | "category"
  | "subCategory"
  | "menu"
  | "tags"
  | "brand";

type FilterGroupDropdownProps = {
  selectedFilter?: FilterByValue | null;
  selectedGroup?: GroupByValue;
  onFilterBySelect?: (value: FilterByValue) => void;
  onGroupBySelect?: (value: GroupByValue) => void;
};

const filterOptions: Array<{ label: string; value: FilterByValue }> = [
  { label: "Recently Uploaded", value: "recent" },
  { label: "From A-Z", value: "az" },
  { label: "From Z-A", value: "za" },
  { label: "Regular Items", value: "regular" },
  { label: "Combo Items", value: "combo" },
  { label: "Retail Items", value: "retail" },
  { label: "Addons", value: "addons" },
  { label: "Favorites", value: "favorites" },
  { label: "Low Stock Items", value: "lowStock" },
];

const groupOptions: Array<{ label: string; value: GroupByValue }> = [
  { label: "Product Type", value: "type" },
  { label: "Product Category", value: "category" },
  { label: "Product Sub- Category", value: "subCategory" },
  { label: "Menu", value: "menu" },
  { label: "By Tags", value: "tags" },
  { label: "By Brand", value: "brand" },
];

const FilterGroupDropdown = ({
  selectedFilter,
  selectedGroup = "type",
  onFilterBySelect,
  onGroupBySelect,
}: FilterGroupDropdownProps) => {
  return (
    <div className="bg-white border border-[#d7d7d7] rounded-md shadow-md p-0 flex text-sm min-w-[350px]">
      <div className="w-1/2 p-2 border-r border-[#ececec]">
        <p className="font-medium mb-2 text-xs flex items-center gap-1">
          <Filter size={12} /> Filter By
        </p>
        <ul className="space-y-0.5">
          {filterOptions.map((item) => (
            <li
              key={item.value}
              onMouseDown={(event) => {
                event.preventDefault();
                onFilterBySelect?.(item.value);
              }}
              className={`px-2 py-1 rounded cursor-pointer text-xs ${
                selectedFilter === item.value
                  ? "bg-[#f2deb0] font-medium"
                  : "hover:bg-[#f4f4f4] text-[#5e5e5e]"
              }`}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="w-1/2 p-2">
        <p className="font-medium mb-2 text-xs flex items-center gap-1">
          <ChevronRight size={12} /> Group By
        </p>
        <ul className="space-y-0.5">
          {groupOptions.map((item) => (
            <li
              key={item.value}
              onMouseDown={(event) => {
                event.preventDefault();
                onGroupBySelect?.(item.value);
              }}
              className={`px-2 py-1 rounded cursor-pointer text-xs ${
                selectedGroup === item.value
                  ? "bg-[#f2deb0] font-medium"
                  : "hover:bg-[#f4f4f4] text-[#5e5e5e]"
              }`}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FilterGroupDropdown;
