import { useState, useEffect, useMemo } from "react";
import {
  Search,
  MoreVertical,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { getBrands, deleteBrand, Brand } from "../../services/catalogService";
import { showInfoToast } from "../../utils/toast";
import { getErrorMessage } from "../../utils/errorHandler";
import Modal from "../ui/Modal";
import AddEditBrandModal from "./products/models/AddEditBrandModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import Pagination from "../Common/Pagination";

import tickIcon from "../../assets/tick.png";
import deleteIcon from "../../assets/deleteConformImg.png";
import successIcon from "../../assets/deleteSuccessImg.png";

type SortKey = "name" | "status";

export default function BrandContent() {
  const [view, setView] = useState<"table" | "grid">("grid");
  const [selected, setSelected] = useState<string[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<Brand | null>(null);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<"created" | "updated" | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
        setError(response.message || response.error?.message || "Failed to load brands");
      }
    } catch (err) {
      setError(getErrorMessage(err, "An error occurred while loading brands"));
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
        fetchBrands();
      } else {
        setError(response.message || response.error?.message || "Failed to delete brand");
      }
    } catch (err) {
      setError(getErrorMessage(err, "An error occurred while deleting brand"));
    }
  };

  const filteredAndSorted = useMemo(() => {
    const filtered = brands.filter((b) => {
      const matchesSearch = !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      const base = sortKey === "status" ? a.status.localeCompare(b.status) : a.name.localeCompare(b.name);
      return sortOrder === "asc" ? base : -base;
    });
  }, [brands, searchQuery, statusFilter, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / itemsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSorted.slice(start, start + itemsPerPage);
  }, [filteredAndSorted, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const allVisibleSelected =
    paginatedRows.length > 0 && paginatedRows.every((row) => selected.includes(row.id));

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelected((prev) => prev.filter((id) => !paginatedRows.some((row) => row.id === id)));
      return;
    }
    setSelected((prev) => Array.from(new Set([...prev, ...paginatedRows.map((row) => row.id)])));
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleExport = () => {
    const headers = ["Name", "Description", "Status"];
    const rows = filteredAndSorted.map((b) => [b.name, b.description || "", b.status]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brands.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortOrder("asc");
  };

  return (
    <div className="space-y-4 rounded-xl border border-[#eadfca] bg-white p-4 lg:p-5">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h1 className="text-[32px] font-bold">Brand</h1>

        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-3 text-gray-500" />
            <input
              placeholder="Search here..."
              className="border rounded-md px-3 pr-8 py-2 text-sm bg-gray-50"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <button className="border px-4 py-2 rounded" onClick={() => showInfoToast("CSV import coming soon")}>
            Import
          </button>
          <button className="border px-4 py-2 rounded" onClick={handleExport}>
            Export
          </button>
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

      <div className="flex justify-end items-center gap-2">
        <select
          className="border px-3 py-2 rounded text-sm bg-white"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Filter by Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          className="border px-4 py-2 rounded"
          onClick={() => {
            setSearchQuery("");
            setStatusFilter("");
            setCurrentPage(1);
          }}
        >
          Clear
        </button>

        <div className="flex border rounded overflow-hidden">
          <button onClick={() => setView("table")} className={`p-2 ${view === "table" ? "bg-yellow-400" : ""}`}>
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

      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading brands..." />
        </div>
      )}

      {!loading && filteredAndSorted.length === 0 && <div className="text-center py-8 text-gray-500">No brands found</div>}

      {!loading && filteredAndSorted.length > 0 && view === "table" && (
        <>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm min-w-[850px]">
              <thead className="bg-yellow-400">
                <tr>
                  <th className="p-3">
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
                  </th>
                  <th className="text-left cursor-pointer" onClick={() => handleSort("name")}>
                    Brand Name
                  </th>
                  <th>Image</th>
                  <th>Description</th>
                  <th className="cursor-pointer" onClick={() => handleSort("status")}>
                    Status
                  </th>
                  <th className="text-right pr-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td className="font-medium">{item.name}</td>
                    <td>
                      <img
                        src={item.image || "/placeholder.jpg"}
                        alt={item.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    </td>
                    <td className="text-gray-500 max-w-[250px] truncate">{item.description || "-"}</td>
                    <td>
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          item.status === "active" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="relative text-right pr-4">
                      <MoreVertical
                        size={16}
                        className="cursor-pointer"
                        onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                      />
                      {openMenuId === item.id && (
                        <div className="absolute right-0 mt-2 w-36 bg-white border rounded shadow z-30">
                          <button
                            onClick={() => {
                              setActiveItem(item);
                              setModal("edit");
                              setOpenMenuId(null);
                            }}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                          >
                            <Eye size={14} /> View
                          </button>
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

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAndSorted.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
            showPageSize
          />
        </>
      )}

      {!loading && filteredAndSorted.length > 0 && view === "grid" && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {paginatedRows.map((item) => (
              <div key={item.id} className="rounded-lg border border-[#ebe6db] bg-white p-3 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
                <div className="flex items-start gap-3">
                  <img
                    src={item.image || "/placeholder.jpg"}
                    alt={item.name}
                    className="h-20 w-24 rounded object-cover bg-gray-100 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="truncate text-[15px] font-semibold text-[#333]">{item.name}</h3>
                        <Pencil size={12} className="text-[#d69b00] shrink-0" />
                      </div>
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="mt-0.5 h-4 w-4 shrink-0"
                      />
                    </div>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-[#7a7a7a]">
                      {item.description || "No description available."}
                    </p>
                    <span
                      className={`mt-3 inline-flex rounded px-2 py-1 text-[11px] ${
                        item.status === "active" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAndSorted.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
            showPageSize
          />
        </>
      )}

      <AddEditBrandModal
        open={modal === "add" || modal === "edit"}
        data={modal === "edit" ? activeItem : null}
        onClose={() => setModal(null)}
        onSuccess={(type) => {
          setModal(null);
          setShowSuccess(type);
          setTimeout(() => setShowSuccess(null), 2000);
          fetchBrands();
        }}
      />

      <Modal open={!!showSuccess} onClose={() => setShowSuccess(null)} className="w-[90%] max-w-[420px] p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Brand {showSuccess === "created" ? "Created" : "Updated"}</h2>
          <img src={tickIcon} alt="Success" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-sm text-gray-600">
            Brand details {showSuccess === "created" ? "added" : "updated"} successfully!
          </p>
        </div>
      </Modal>

      <Modal open={openDelete} onClose={() => setOpenDelete(false)} className="w-[90%] max-w-[420px] p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Delete</h2>
          <img src={deleteIcon} alt="Delete" className="w-14 h-14 mx-auto mb-4" />
          <p className="text-sm text-gray-600 mb-6">
            This action cannot be undone.
            <br />
            Do you want to proceed with deletion?
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setOpenDelete(false)} className="border px-6 py-2 rounded">
              Cancel
            </button>
            <button onClick={handleDeleteBrand} className="bg-yellow-400 px-6 py-2 rounded">
              Yes
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showDeleteSuccess} onClose={() => setShowDeleteSuccess(false)} className="w-[90%] max-w-[420px] p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Deleted!</h2>
          <img src={successIcon} alt="Deleted" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Brand has been successfully removed.</p>
        </div>
      </Modal>
    </div>
  );
}
