import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AllergiesTable from "./AllergiesTable";
import MasterDataNavTabs from "../NavTabs/MasterDataNavTabs";
import Pagination from "../Common/Pagination";
import { getAllergies, Allergen } from "../../services/masterDataService";

const AllergiesPage = () => {
  const navigate = useNavigate();

  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadAllergens = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllergies();
      if (res.success && res.data) {
        setAllergens(res.data.allergens);
      } else {
        setError("Failed to load allergens");
      }
    } catch {
      setError("An error occurred while loading allergens");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllergens();
  }, [loadAllergens]);

  // Filter by search
  const filtered = allergens.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  // Paginate
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleClear = () => {
    setSearch("");
    setCurrentPage(1);
  };

  const handleDeleted = () => {
    loadAllergens();
  };

  return (
    <div className="space-y-6 bg-bb-bg min-h-screen p-4 sm:p-6">
      {/* TABS */}
      <MasterDataNavTabs />

      {/* SEARCH + ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* SEARCH */}
        <div className="relative w-full md:w-80">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            placeholder="Search here..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border rounded-md px-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:justify-end">
          <button
            onClick={handleClear}
            className="bg-yellow-400 px-5 py-2 rounded-md border border-black text-sm font-medium w-full sm:w-auto"
          >
            Clear
          </button>

          <button
            className="bg-black text-white px-5 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
            onClick={() =>
              navigate("/master-data/allergies/create")
            }
          >
            Add New
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="text-center py-8 text-bb-textSoft">Loading allergens...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {search ? (
            <p>No results found for "{search}"</p>
          ) : (
            <>
              <p className="mb-4">No allergens found</p>
              <button
                onClick={() => navigate("/master-data/allergies/create")}
                className="bg-black text-white px-4 py-2 rounded text-sm inline-block"
              >
                Add Your First Allergen
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <AllergiesTable allergens={paginated} onDeleted={handleDeleted} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
          />
        </>
      )}
    </div>
  );
};

export default AllergiesPage;
