import { useEffect, useState, useMemo } from "react";
import {
  Search,
  MoreVertical,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  getAllSubCategories,
  deleteSubCategory,
  SubCategory,
} from "../../services/catalogService";
import { showInfoToast } from "../../utils/toast";
import Modal from "../ui/Modal";
import AddEditSubCategoryModal from "./products/models/AddEditSubCategoryModal";
import tickIcon from "../../assets/tick.png";
import deleteIcon from "../../assets/deleteConformImg.png";
import successIcon from "../../assets/deleteSuccessImg.png";
import LoadingSpinner from "../Common/LoadingSpinner";

export default function SubCategoryContent() {
  const [view, setView] = useState<"table" | "grid">("table");
  const [activeItem, setActiveItem] = useState<SubCategory | null>(null);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<"created" | "updated" | null>(
    null,
  );
  const [openDelete, setOpenDelete] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

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

  const handleDelete = async () => {
    if (!activeItem) return;
    try {
      const response = await deleteSubCategory(activeItem.id);
      if (response.success) {
        setOpenDelete(false);
        setShowDeleteSuccess(true);
        fetchSubCategories();
      }
    } catch (err) {
      console.error("Failed to delete sub-category:", err);
      setOpenDelete(false);
    }
  };

  const filteredSubCategories = useMemo(() => {
    return subCategories.filter((sc) => {
      const matchesSearch = !searchQuery || sc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || sc.status === statusFilter;
      const matchesCategory = !categoryFilter || sc.category?.name === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [subCategories, searchQuery, statusFilter, categoryFilter]);

  // Build unique category names from data for dynamic filter dropdown
  const categoryOptions = useMemo(() => {
    const names = new Set<string>();
    subCategories.forEach((sc) => { if (sc.category?.name) names.add(sc.category.name); });
    return Array.from(names).sort();
  }, [subCategories]);

  const handleExport = () => {
    const headers = ['Name', 'Category', 'Description', 'Status'];
    const rows = filteredSubCategories.map((sc) => [sc.name, sc.category?.name || '', sc.description || '', sc.status]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sub-categories.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
        <h1 className="text-[28px] lg:text-[32px] font-bold">Sub-Category</h1>

        <div className="flex flex-wrap gap-2">
          <div className="relative w-full sm:w-[220px]">
            <Search
              size={16}
              className="absolute right-3 top-3 text-gray-500"
            />
            <input
              placeholder="Search here..."
              className="border rounded-md px-3 pr-8 py-2 text-sm w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button className="bg-yellow-400 px-4 py-2 rounded w-full sm:w-auto" onClick={() => showInfoToast('CSV import coming soon')}>
            Import
          </button>
          <button className="border px-4 py-2 rounded w-full sm:w-auto" onClick={handleExport}>
            Export
          </button>

          <button
            onClick={() => {
              setActiveItem(null);
              setModal("add");
            }}
            className="bg-black text-white px-4 py-2 rounded w-full sm:w-auto"
          >
            Add New
          </button>
        </div>
      </div>

      {/* ================= FILTER + VIEW ================= */}
      <div className="flex flex-wrap justify-end gap-2">
        <select className="border px-3 py-2 rounded text-sm w-full sm:w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Filter by Category</option>
          {categoryOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <select className="border px-3 py-2 rounded text-sm w-full sm:w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Filter by Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button className="bg-yellow-400 px-4 py-2 rounded w-full sm:w-auto" onClick={() => { setSearchQuery(""); setStatusFilter(""); setCategoryFilter(""); }}>
          Clear
        </button>

        <div className="flex border rounded">
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
      {!loading && !error && filteredSubCategories.length === 0 && (
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-gray-500">No sub-categories found.</p>
        </div>
      )}

      {/* ================= TABLE VIEW ================= */}
      {!loading && !error && filteredSubCategories.length > 0 && view === "table" && (
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-yellow-400">
              <tr>
                <th className="p-3 text-left">Sub-Categories</th>
                <th>Image</th>
                <th>Category</th>
                <th>Description</th>
                <th>Status</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredSubCategories.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3 font-medium">{item.name}</td>

                  <td>
                    {item.image ? (
                      <img
                        src={item.image}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-100" />
                    )}
                  </td>

                  <td>{item.category?.name || "—"}</td>

                  <td className="max-w-[260px] truncate text-gray-500">
                    {item.description || "—"}
                  </td>

                  <td>
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

                  {/* ACTION MENU */}
                  <td className="relative text-right pr-4">
                    <MoreVertical
                      size={16}
                      className="cursor-pointer"
                      onClick={() =>
                        setOpenMenuId(openMenuId === item.id ? null : item.id)
                      }
                    />

                    {openMenuId === item.id && (
                      <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-30">
                        <button
                          onClick={() => {
                            setActiveItem(item);
                            setModal("edit");
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                        >
                          <Pencil size={14} /> Edit
                        </button>

                        <button
                          onClick={() => {
                            setActiveItem(item);
                            setOpenDelete(true);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left text-red-600"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
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
      {!loading && !error && filteredSubCategories.length > 0 && view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubCategories.map((item) => (
            <div key={item.id} className="bg-white border rounded-xl p-4">
              {item.image ? (
                <img
                  src={item.image}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-32 rounded-lg bg-gray-100" />
              )}

              <h3 className="font-semibold mt-2">{item.name}</h3>
              <p className="text-xs text-gray-500">{item.category?.name || "—"}</p>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                {item.description || "—"}
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
          ))}
        </div>
      )}

      {/* ================= ADD / EDIT ================= */}
      <AddEditSubCategoryModal
        open={modal === "add" || modal === "edit"}
        data={modal === "edit" ? activeItem : null}
        onClose={() => setModal(null)}
        onSuccess={(type) => {
          setModal(null);
          setShowSuccess(type);
          fetchSubCategories();
        }}
      />

      {/* ================= SUCCESS ================= */}
      <Modal
        open={!!showSuccess}
        onClose={() => setShowSuccess(null)}
        className="w-[90%] max-w-[420px] p-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Sub-Category {showSuccess === "created" ? "Created" : "Updated"}
          </h2>

          <img src={tickIcon} className="w-16 h-16 mx-auto mb-4" />

          <p className="text-sm text-gray-600">
            Sub-Category details{" "}
            {showSuccess === "created" ? "added" : "updated"} successfully!
          </p>
        </div>
      </Modal>

      {/* ================= DELETE CONFIRM ================= */}
      <Modal
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        className="w-[90%] max-w-[420px] p-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Delete</h2>

          <img src={deleteIcon} className="w-14 h-14 mx-auto mb-4" />

          <p className="text-sm text-gray-600 mb-6">
            This action cannot be undone.
            <br />
            Do you want to proceed with deletion?
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => setOpenDelete(false)}
              className="border px-6 py-2 rounded"
            >
              Cancel
            </button>

            <button
              onClick={handleDelete}
              className="bg-yellow-400 px-6 py-2 rounded"
            >
              Yes
            </button>
          </div>
        </div>
      </Modal>

      {/* ================= DELETE SUCCESS ================= */}
      <Modal
        open={showDeleteSuccess}
        onClose={() => setShowDeleteSuccess(false)}
        className="w-[90%] max-w-[420px] p-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Deleted!</h2>

          <img src={successIcon} className="w-16 h-16 mx-auto mb-4" />

          <p className="text-sm text-gray-600">
            Sub-Category has been successfully removed.
          </p>
        </div>
      </Modal>
    </div>
  );
}
