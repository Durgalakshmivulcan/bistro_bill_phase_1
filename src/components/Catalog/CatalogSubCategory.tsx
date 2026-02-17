import { useEffect, useState } from "react";
import {
  Search,
  MoreVertical,
  LayoutGrid,
  List,
  Pencil,
} from "lucide-react";
import { getAllSubCategories, SubCategory } from "../../services/catalogService";
import LoadingSpinner from "../Common/LoadingSpinner";

export default function CatalogSubCategory() {
  const [view, setView] = useState<"table" | "grid">("table");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubCategories();
  }, []);

  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllSubCategories();
      if (response.success && response.data) {
        setSubCategories(response.data.subCategories);
      } else {
        setError(response.error?.message || "Failed to load sub-categories");
      }
    } catch (err) {
      setError("Failed to load sub-categories");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? subCategories.map((c) => c.id) : []);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    selectedIds.length === subCategories.length &&
    subCategories.length > 0;

  return (
    <div className="flex min-h-screen bg-bb-bg font-inter">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-56 bg-bb-bg border-r p-4 space-y-1">
        {["Category", "Sub-Category", "Menu", "Brand", "Tags"].map((item) => (
          <div
            key={item}
            className={`px-3 py-2 rounded text-sm cursor-pointer ${
              item === "Sub-Category"
                ? "bg-yellow-400 font-bold"
                : "text-gray-600 hover:bg-yellow-100"
            }`}
          >
            {item}
          </div>
        ))}
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 p-6 space-y-4">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <h1 className="text-[28px] lg:text-[35px] font-bold">
            Sub-Category
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              />
              <input
                placeholder="Search here..."
                className="w-full border rounded-md px-3 pr-10 py-2 text-sm"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button className="bg-yellow-400 px-4 py-2 rounded text-sm border border-black">
                Import
              </button>
              <button className="border px-4 py-2 rounded text-sm border-black">
                Export
              </button>
              <button
                onClick={() => setOpenModal(true)}
                className="bg-black text-white px-4 py-2 rounded text-sm border border-black"
              >
                Add New
              </button>
            </div>
          </div>
        </div>

        {/* ================= FILTER ROW ================= */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <select className="border px-3 py-2 rounded text-sm">
            <option>Filter by Category</option>
            <option>Rice Dishes</option>
            <option>Breads</option>
          </select>

          <select className="border px-3 py-2 rounded text-sm">
            <option>Filter by Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>

          <button className="bg-yellow-400 px-4 py-2 rounded text-sm border border-black">
            Clear
          </button>

          <div className="flex border rounded overflow-hidden">
            <button
              onClick={() => setView("table")}
              className={`p-2 ${view === "table" ? "bg-yellow-400" : ""}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setView("grid")}
              className={`p-2 border-l ${view === "grid" ? "bg-yellow-400" : ""}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* ================= LOADING ================= */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" message="Loading sub-categories..." />
          </div>
        )}

        {/* ================= ERROR ================= */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button
              onClick={fetchSubCategories}
              className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* ================= EMPTY STATE ================= */}
        {!loading && !error && subCategories.length === 0 && (
          <div className="bg-white border rounded-xl p-12 text-center">
            <p className="text-gray-500">No sub-categories found.</p>
          </div>
        )}

        {/* ================= TABLE VIEW ================= */}
        {!loading && !error && subCategories.length > 0 && view === "table" && (
          <div className="bg-white border rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bb-primary">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) =>
                        toggleSelectAll(e.target.checked)
                      }
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Sub-Category</th>
                  <th className="px-4 py-3 text-left">Image</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {subCategories.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelectOne(item.id)}
                      />
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {item.name}
                    </td>

                    <td className="px-4 py-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-100" />
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {item.category?.name || "—"}
                    </td>

                    <td className="px-4 py-3 text-gray-500">
                      {item.description || "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          item.status === "active"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="relative px-4 py-3 text-right">
                      <MoreVertical
                        size={16}
                        className="cursor-pointer"
                        onClick={() =>
                          setOpenActionId(
                            openActionId === item.id ? null : item.id
                          )
                        }
                      />

                      {openActionId === item.id && (
                        <div className="absolute right-0 mt-2 w-28 bg-white border rounded shadow text-sm z-10">
                          <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
                            View
                          </div>
                          <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
                            Edit
                          </div>
                          <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-red-600">
                            Delete
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= GRID VIEW ================= */}
        {!loading && !error && subCategories.length > 0 && view === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subCategories.map((item) => (
              <div
                key={item.id}
                className="bg-white border rounded-xl p-4 flex gap-4"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-gray-100" />
                )}

                <div className="flex-1">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">
                        {item.name}
                      </h3>
                      <Pencil size={14} className="cursor-pointer" />
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelectOne(item.id)}
                    />
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    {item.category?.name || "—"}
                  </p>

                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${
                      item.status === "active"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= FOOTER ================= */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border shadow px-4 py-2 rounded flex gap-3 text-sm">
            <span className="bg-black text-white px-2 py-1 rounded text-xs">
              {selectedIds.length} Selected
            </span>
            <button className="border px-3 py-1 rounded">
              Delete
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
