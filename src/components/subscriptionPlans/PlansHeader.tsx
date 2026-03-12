import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}
const PlansHeader = ({ searchTerm, onSearchChange }: Props) => {

  const navigate = useNavigate();
  

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-semibold text-gray-800">
        Plans
      </h1>

      <div className="flex gap-3">
        <div className="relative w-full lg:w-64">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            />
            <input
              placeholder="Search here..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}

              className="w-full border rounded-md bg-bb-bg px-3 pr-10 py-2 text-sm"
            />
          </div>
        
        <button
          onClick={() => navigate("/subscription-plans/create")}
          className="bg-black text-white px-4 py-2 rounded-md text-sm"
        >
          Create New Plan
        </button>
      </div>
    </div>
  );
};

export default PlansHeader;
