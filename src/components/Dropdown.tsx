import React from "react";
import { ChevronDown } from "lucide-react";

const Dropdown = ({ label }: { label: string }) => (
  <button
    className="flex items-center gap-2 bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm shadow"
  >
    {label}
    <ChevronDown size={16} />
  </button>
);

export default Dropdown;
