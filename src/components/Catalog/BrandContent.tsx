import { useState, useEffect, useMemo } from "react";
import {
  Search,
  MoreVertical,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
} from "lucide-react";
import { getBrands, deleteBrand, Brand } from "../../services/catalogService";
import { showInfoToast } from "../../utils/toast";
import Modal from "../ui/Modal";
import AddEditBrandModal from "./products/models/AddEditBrandModal";
import LoadingSpinner from "../Common/LoadingSpinner";

import tickIcon from "../../assets/tick.png";
import deleteIcon from "../../assets/deleteConformImg.png";
import successIcon from "../../assets/deleteSuccessImg.png";

export default function BrandContent() {
  const [view, setView] = useState<"table" | "grid">("table");

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeItem, setActiveItem] = useState<Brand | null>(null);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [showSuccess, setShowSuccess] = useState<"created" | "updated" | null>(
    null,
  );

  const [openDelete, setOpenDelete] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch brands from API
  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBrands();
      if (response.success && response.data) {
        setBrands(response.data.brands || []);
      } else {
        setError(response.message || "Failed to load brands");
      }
    } catch (err) {
      setError("An error occurred while loading brands");
      console.error("Error fetching brands:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (!activeItem) return;

    try {
      const response = await deleteBrand(activeItem.id);
      if (response.success) {
        setOpenDelete(false);
        setShowDeleteSuccess(true);
        setTimeout(() => setShowDeleteSuccess(false), 2000);
        // Refresh brands list
        fetchBrands();
      } else {
        setError(response.message || "Failed to delete brand");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("An error occurred while deleting brand");
      setTimeout(() => setError(null), 3000);
      console.error("Error deleting brand:", err);
    }
  };

  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const matchesSearch = !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [brands, searchQuery, statusFilter]);

  const handleExport = () => {
    const headers = ['Name', 'Description', 'Status'];
    const rows = filteredBrands.map((b) => [b.name, b.description || '', b.status]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brands.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* ================= ERROR MESSAGE ================= */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h1 className="text-[32px] font-bold">Brand</h1>

        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-3" />
            <input
              placeholder="Search here..."
              className="border rounded-md px-3 pr-8 py-2 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button className="bg-yellow-400 px-4 py-2 rounded border" onClick={() => showInfoToast('CSV import coming soon')}>
            Import
          </button>
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

      {/* ================= FILTER + VIEW ================= */}
      <div className="flex justify-end items-center gap-2">
        <select className="border px-3 py-2 rounded text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Filter by Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button className="bg-yellow-400 px-4 py-2 rounded" onClick={() => { setSearchQuery(""); setStatusFilter(""); }}>Clear</button>

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

      {/* ================= LOADING STATE ================= */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading brands..." />
        </div>
      )}

      {/* ================= EMPTY STATE ================= */}
      {!loading && filteredBrands.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No brands found</p>
          <button
            onClick={() => {
              setActiveItem(null);
              setModal("add");
            }}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Add Your First Brand
          </button>
        </div>
      )}

      {/* ================= TABLE VIEW ================= */}
      {!loading && filteredBrands.length > 0 && view === "table" && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-yellow-400">
              <tr>
                <th className="p-3">
                  <input type="checkbox" />
                </th>
                <th className="text-left">Brand Name</th>
                <th>Image</th>
                <th>Description</th>
                <th>Status</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredBrands.map((item: Brand) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">
                    <input type="checkbox" />
                  </td>

                  <td className="font-medium">{item.name}</td>

                  <td>
                    <img
                      src={item.image || '/placeholder.jpg'}
                      alt={item.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  </td>

                  <td className="text-gray-500 max-w-[250px] truncate">
                    {item.description || '-'}
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

      {/* ================= GRID VIEW ================= */}
      {!loading && filteredBrands.length > 0 && view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBrands.map((item) => (
            <div key={item.id} className="bg-white border rounded-xl p-4">
              <img
                src={item.image || '/placeholder.jpg'}
                alt={item.name}
                className="w-full h-32 object-cover rounded-lg"
              />

              <h3 className="font-semibold mt-2">{item.name}</h3>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                {item.description || '-'}
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

      {/* ================= ADD / EDIT MODAL ================= */}
      <AddEditBrandModal
        open={modal === "add" || modal === "edit"}
        data={modal === "edit" ? activeItem : null}
        onClose={() => setModal(null)}
        onSuccess={(type) => {
          setModal(null);
          setShowSuccess(type);
          setTimeout(() => setShowSuccess(null), 2000);
          // Refresh brands list
          fetchBrands();
        }}
      />

      {/* ================= SUCCESS MODAL ================= */}
      <Modal
        open={!!showSuccess}
        onClose={() => setShowSuccess(null)}
        className="w-[90%] max-w-[420px] p-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Brand {showSuccess === "created" ? "Created" : "Updated"}
          </h2>

          <img
            src={tickIcon}
            alt="Success"
            className="w-16 h-16 mx-auto mb-4"
          />

          <p className="text-sm text-gray-600">
            Brand details {showSuccess === "created" ? "added" : "updated"}{" "}
            successfully!
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

          <img
            src={deleteIcon}
            alt="Delete"
            className="w-14 h-14 mx-auto mb-4"
          />

          <p className="text-sm text-gray-600 mb-6">
            This action cannot be undone.
            <br />
            Do you want to proceed with deletion?
          </p>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setOpenDelete(false)}
              className="border px-6 py-2 rounded"
            >
              Cancel
            </button>

            <button
              onClick={handleDeleteBrand}
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

          <img
            src={successIcon}
            alt="Deleted"
            className="w-16 h-16 mx-auto mb-4"
          />

          <p className="text-sm text-gray-600">
            Brand has been successfully removed.
          </p>
        </div>
      </Modal>
    </div>
  );
}
