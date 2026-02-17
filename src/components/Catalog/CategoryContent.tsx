import { useState, useEffect, useMemo } from "react";
import {
  Search,
  MoreVertical,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
} from "lucide-react";
import { Category, getCategories, deleteCategory } from "../../services/catalogService";
import { showSuccessToast, showInfoToast } from "../../utils/toast";
import AddEditCategoryModal from "../../components/Catalog/products/models/AddEditCategoryModal";
import CategorySuccessModal from "./products/models/CategorySuccessModal";
import Modal from "../ui/Modal";
import LoadingSpinner from "../Common/LoadingSpinner";
import deleteIcon from "../../assets/deleteConformImg.png";
import successIcon from "../../assets/deleteSuccessImg.png";

export default function CategoryContent() {
  const [view, setView] = useState<"table" | "grid">("table");
  const [selected, setSelected] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState<Category | null>(null);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCategories();
      if (response.success && response.data) {
        setCategories(response.data.categories || []);
      } else {
        setError(response.message || "Failed to fetch categories");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!activeItem) return;

    try {
      const response = await deleteCategory(activeItem.id);
      if (response.success) {
        setOpenDelete(false);
        setShowDeleteSuccess(true);
        // Refresh categories list
        await fetchCategories();
        // Auto-close success modal after 2 seconds
        setTimeout(() => setShowDeleteSuccess(false), 2000);
      } else {
        setError(response.message || "Failed to delete category");
        setOpenDelete(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
      setOpenDelete(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((p) =>
      p.includes(id) ? p.filter((i) => i !== id) : [...p, id],
    );
  };

  const handleModalSuccess = () => {
    setModal(null);
    setShowSuccess(true);
    // Refresh categories list
    fetchCategories();
    // Auto-close success modal after 2 seconds
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesSearch = !searchQuery || cat.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || cat.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [categories, searchQuery, statusFilter]);

  const handleExport = () => {
    const headers = ['Name', 'Description', 'Status'];
    const rows = filteredCategories.map((c) => [c.name, c.description || '', c.status]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'categories.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    showInfoToast('CSV import coming soon');
  };

  const handleClear = () => {
    setSearchQuery("");
    setStatusFilter("");
  };

  return (
    <div className="space-y-4">
      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
        <h1 className="text-[28px] lg:text-[32px] font-bold">Category</h1>

        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-3" />
            <input
              placeholder="Search here..."
              className="border rounded-md px-3 pr-8 py-2 text-sm w-[220px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button className="bg-yellow-400 px-4 py-2 rounded" onClick={handleImport}>Import</button>
          <button className="border px-4 py-2 rounded" onClick={handleExport}>Export</button>
          <button
            onClick={() => {
              setActiveItem(null);
              setModal("add");
            }}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Add New
          </button>
        </div>
      </div>

      {/* FILTER + VIEW */}
      <div className="flex flex-wrap justify-end gap-2">
        <select
          className="border px-3 py-2 rounded text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Filter by Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button className="bg-yellow-400 px-4 py-2 rounded" onClick={handleClear}>Clear</button>

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

      {/* LOADING STATE */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading categories..." />
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && filteredCategories.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          <p>No categories found</p>
          <button
            onClick={() => {
              setActiveItem(null);
              setModal("add");
            }}
            className="mt-4 bg-yellow-400 px-6 py-2 rounded"
          >
            Add Your First Category
          </button>
        </div>
      )}

      {/* TABLE VIEW */}
      {!loading && view === "table" && filteredCategories.length > 0 && (
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-yellow-400">
              <tr>
                <th className="p-3"></th>
                <th className="text-left">Categories</th>
                <th>Image</th>
                <th>Description</th>
                <th>Status</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCategories.map((cat) => (
                <tr key={cat.id} className="border-t">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(cat.id)}
                      onChange={() => toggleSelect(cat.id)}
                    />
                  </td>

                  <td>{cat.name}</td>

                  <td>
                    <img
                      src={cat.image || "/placeholder.jpg"}
                      className="w-12 h-12 rounded object-cover"
                      alt={cat.name}
                    />
                  </td>

                  <td className="max-w-[260px] truncate">{cat.description || "—"}</td>

                  <td>
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        cat.status === "active"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {cat.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* ACTION MENU */}
                  <td className="relative text-right pr-4">
                    <MoreVertical
                      size={16}
                      className="cursor-pointer"
                      onClick={() =>
                        setOpenMenuId(openMenuId === cat.id ? null : cat.id)
                      }
                    />

                    {openMenuId === cat.id && (
                      <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-20">
                        <button
                          onClick={() => {
                            setActiveItem(cat);
                            setModal("edit");
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                        >
                          <Pencil size={14} /> Edit
                        </button>

                        <button
                          onClick={() => {
                            setActiveItem(cat);
                            setOpenDelete(true);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
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

      {/* GRID VIEW */}
      {!loading && view === "grid" && filteredCategories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="bg-white border rounded-xl p-4">
              <img
                src={cat.image || "/placeholder.jpg"}
                className="w-full h-32 object-cover rounded-lg"
                alt={cat.name}
              />
              <h3 className="font-semibold mt-2">{cat.name}</h3>
              <p className="text-xs text-gray-500 line-clamp-2">
                {cat.description || "—"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* MODALS */}
      <AddEditCategoryModal
        open={modal === "add" || modal === "edit"}
        data={modal === "edit" ? activeItem : null}
        onClose={() => setModal(null)}
        onSuccess={handleModalSuccess}
      />

      <CategorySuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
      />

      {/* DELETE CONFIRM MODAL */}
      <Modal
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        className="w-[420px] p-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Delete</h2>

          <img
            src={deleteIcon}
            alt="Delete"
            className="w-14 h-14 mx-auto mb-4"
          />

          <p className="text-sm text-gray-600 mb-6">
            This action cannot be undone. <br />
            Do you want to proceed with deletion?
          </p>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setOpenDelete(false)}
              className="border px-6 py-2 rounded"
            >
              Cancel
            </button>

            <button
              onClick={handleDeleteCategory}
              className="bg-yellow-400 px-6 py-2 rounded"
            >
              Yes
            </button>
          </div>
        </div>
      </Modal>
      {/* DELETE SUCCESS MODAL */}
      <Modal
        open={showDeleteSuccess}
        onClose={() => setShowDeleteSuccess(false)}
        className="w-[420px] p-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Deleted!</h2>

          <img
            src={successIcon}
            alt="Success"
            className="w-16 h-16 mx-auto mb-4"
          />

          <p className="text-sm text-gray-600">
            Category has been successfully removed.
          </p>
        </div>
      </Modal>
    </div>
  );
}
