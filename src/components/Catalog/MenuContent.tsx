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

import Modal from "../ui/Modal";
import AddEditMenuModal from "./products/models/AddEditMenuModal";
import { getMenus, Menu, deleteMenu } from "../../services/catalogService";
import { showInfoToast } from "../../utils/toast";
import { getErrorMessage } from "../../utils/errorHandler";
import { LoadingSpinner, TableSkeleton } from "../Common";
import Pagination from "../Common/Pagination";

import tickIcon from "../../assets/tick.png";
import deleteIcon from "../../assets/deleteConformImg.png";
import successIcon from "../../assets/deleteSuccessImg.png";

type SortKey = "name" | "status";

export default function MenuContent() {
  const [view, setView] = useState<"table" | "grid">("grid");
  const [activeItem, setActiveItem] = useState<Menu | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMenus();
      if (response.success && response.data) {
        setMenus(response.data.menus || []);
      } else {
        setError(response.message || response.error?.message || "Failed to load menus");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load menus"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeItem) return;
    try {
      const response = await deleteMenu(activeItem.id);
      if (response.success) {
        setOpenDelete(false);
        setShowDeleteSuccess(true);
        await loadMenus();
        setTimeout(() => {
          setShowDeleteSuccess(false);
          setActiveItem(null);
        }, 2000);
      } else {
        setError(response.message || response.error?.message || "Failed to delete menu");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete menu"));
    }
  };

  const handleSuccess = async (type: "created" | "updated") => {
    setModal(null);
    setShowSuccess(type);
    await loadMenus();
    setTimeout(() => {
      setShowSuccess(null);
      setActiveItem(null);
    }, 2000);
  };

  const filteredAndSorted = useMemo(() => {
    const filtered = menus.filter((m) => {
      const matchesSearch = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      const base = sortKey === "status" ? a.status.localeCompare(b.status) : a.name.localeCompare(b.name);
      return sortOrder === "asc" ? base : -base;
    });
  }, [menus, searchQuery, statusFilter, sortKey, sortOrder]);

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

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortOrder("asc");
  };

  const handleExport = () => {
    const headers = ["Name", "Description", "Status"];
    const rows = filteredAndSorted.map((m) => [m.name, m.description || "", m.status]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "menus.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-w-0 space-y-4 rounded-xl border border-[#eadfca] bg-white p-4 lg:p-5">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h1 className="text-[32px] font-bold">Menu</h1>

        <div className="flex flex-wrap gap-2">
          <div className="relative w-full sm:w-[220px]">
            <Search size={16} className="absolute right-3 top-3 text-gray-500" />
            <input
              placeholder="Search here..."
              className="border rounded-md px-3 pr-8 py-2 text-sm w-full bg-gray-50"
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

      <div className="flex flex-wrap justify-end gap-2">
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

      {view === "table" && (
        <>
          <div className="w-full overflow-x-auto rounded-xl border bg-white">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-yellow-400">
                <tr>
                  <th className="p-3">
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
                  </th>
                  <th className="text-left cursor-pointer" onClick={() => handleSort("name")}>
                    Menu Name
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
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8">
                      <TableSkeleton rows={5} />
                    </td>
                  </tr>
                ) : filteredAndSorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No menus found
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((item) => (
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
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                            No Image
                          </div>
                        )}
                      </td>
                      <td className="text-gray-500 max-w-[260px] truncate">{item.description || "-"}</td>
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
                              <Eye size={14} />
                              View
                            </button>
                            <button
                              onClick={() => {
                                setActiveItem(item);
                                setModal("edit");
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setActiveItem(item);
                                setOpenDelete(true);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left text-red-600"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredAndSorted.length > 0 && (
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
          )}
        </>
      )}

      {view === "grid" && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full p-8">
                <LoadingSpinner size="lg" message="Loading menus..." />
              </div>
            ) : filteredAndSorted.length === 0 ? (
              <div className="col-span-full p-8 text-center text-gray-500">No menus found</div>
            ) : (
              paginatedRows.map((item) => (
                <div key={item.id} className="rounded-lg border border-[#ebe6db] bg-white p-3 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
                  <div className="flex items-start gap-3">
                    {item.image ? (
                      <img src={item.image} className="h-20 w-24 rounded object-cover shrink-0" alt={item.name} />
                    ) : (
                      <div className="h-20 w-24 rounded bg-gray-200 flex items-center justify-center text-[11px] text-gray-500 shrink-0">
                        No Image
                      </div>
                    )}

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
              ))
            )}
          </div>

          {!loading && filteredAndSorted.length > 0 && (
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
          )}
        </>
      )}

      <AddEditMenuModal
        open={modal === "add" || modal === "edit"}
        data={modal === "edit" ? activeItem : null}
        onClose={() => setModal(null)}
        onSuccess={handleSuccess}
      />

      <Modal open={!!showSuccess} onClose={() => setShowSuccess(null)} className="w-[90%] max-w-[420px] p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Menu {showSuccess === "created" ? "Created" : "Updated"}</h2>
          <img src={tickIcon} className="w-16 h-16 mx-auto mb-4" alt="Success" />
          <p className="text-sm text-gray-600">
            Menu details {showSuccess === "created" ? "added" : "updated"} successfully!
          </p>
        </div>
      </Modal>

      <Modal open={openDelete} onClose={() => setOpenDelete(false)} className="w-[90%] max-w-[420px] p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Delete</h2>
          <img src={deleteIcon} className="w-14 h-14 mx-auto mb-4" alt="Delete" />
          <p className="text-sm text-gray-600 mb-6">
            This action cannot be undone.
            <br />
            Do you want to proceed with deletion?
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setOpenDelete(false)} className="border px-6 py-2 rounded">
              Cancel
            </button>
            <button onClick={handleDelete} className="bg-yellow-400 px-6 py-2 rounded">
              Yes
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showDeleteSuccess} onClose={() => setShowDeleteSuccess(false)} className="w-[90%] max-w-[420px] p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Deleted!</h2>
          <img src={successIcon} className="w-16 h-16 mx-auto mb-4" alt="Deleted" />
          <p className="text-sm text-gray-600">Menu has been successfully removed.</p>
        </div>
      </Modal>
    </div>
  );
}
