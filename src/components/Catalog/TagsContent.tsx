import { useState, useEffect, useMemo } from "react";
import {
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  Eye,
} from "lucide-react";
import { getTags, deleteTag, Tag } from "../../services/catalogService";
import { showInfoToast } from "../../utils/toast";
import { getErrorMessage } from "../../utils/errorHandler";
import Modal from "../ui/Modal";
import AddEditTagModal from "./products/models/AddEditTagModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import Pagination from "../Common/Pagination";

import tickIcon from "../../assets/tick.png";
import deleteIcon from "../../assets/deleteConformImg.png";
import successIcon from "../../assets/deleteSuccessImg.png";

type SortKey = "name" | "status";

export default function TagsContent() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "grid">("table");
  const [selected, setSelected] = useState<string[]>([]);
  const [activeItem, setActiveItem] = useState<Tag | null>(null);
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
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTags();
      if (response.success && response.data) {
        setTags(response.data.tags || []);
      } else {
        setError(response.message || response.error?.message || "Failed to load tags");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load tags"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async () => {
    if (!activeItem) return;
    try {
      const response = await deleteTag(activeItem.id);
      if (response.success) {
        setOpenDelete(false);
        setShowDeleteSuccess(true);
        setTimeout(() => setShowDeleteSuccess(false), 2000);
        fetchTags();
      } else {
        setError(response.message || response.error?.message || "Failed to delete tag");
        setOpenDelete(false);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete tag"));
      setOpenDelete(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    const filtered = tags.filter((tag) => {
      const matchesSearch = !searchQuery || tag.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || tag.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      const base = sortKey === "status" ? a.status.localeCompare(b.status) : a.name.localeCompare(b.name);
      return sortOrder === "asc" ? base : -base;
    });
  }, [tags, searchQuery, statusFilter, sortKey, sortOrder]);

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
    const headers = ["Name", "Status"];
    const rows = filteredAndSorted.map((t) => [t.name, t.status]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tags.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h1 className="text-[32px] font-bold">Tags</h1>

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

      <div className="flex justify-end gap-2 flex-wrap">
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

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading tags..." />
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No tags found</div>
      ) : view === "table" ? (
        <>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-yellow-400">
                <tr>
                  <th className="p-3">
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
                  </th>
                  <th className="text-left cursor-pointer" onClick={() => handleSort("name")}>
                    Tag Name
                  </th>
                  <th className="cursor-pointer" onClick={() => handleSort("status")}>
                    Status
                  </th>
                  <th className="text-right pr-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map((tag) => (
                  <tr key={tag.id} className="border-t">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(tag.id)}
                        onChange={() => toggleSelect(tag.id)}
                      />
                    </td>
                    <td className="font-medium">{tag.name}</td>
                    <td>
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          tag.status === "active" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {tag.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="relative text-right pr-4">
                      <MoreVertical
                        size={16}
                        className="cursor-pointer"
                        onClick={() => setOpenMenuId(openMenuId === tag.id ? null : tag.id)}
                      />
                      {openMenuId === tag.id && (
                        <div className="absolute right-0 mt-2 w-36 bg-white border rounded shadow z-30 max-h-56 overflow-y-auto">
                          <button
                            onClick={() => {
                              setActiveItem(tag);
                              setModal("edit");
                              setOpenMenuId(null);
                            }}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                          >
                            <Eye size={14} /> View
                          </button>
                          <button
                            onClick={() => {
                              setActiveItem(tag);
                              setModal("edit");
                              setOpenMenuId(null);
                            }}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setActiveItem(tag);
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
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedRows.map((tag) => (
              <div key={tag.id} className="bg-white border rounded-xl p-4">
                <h3 className="font-semibold">{tag.name}</h3>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${
                    tag.status === "active" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {tag.status === "active" ? "Active" : "Inactive"}
                </span>
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

      <AddEditTagModal
        open={modal === "add" || modal === "edit"}
        data={modal === "edit" ? activeItem : null}
        onClose={() => setModal(null)}
        onSuccess={(type) => {
          setModal(null);
          setShowSuccess(type);
          setTimeout(() => setShowSuccess(null), 2000);
          fetchTags();
        }}
      />

      <Modal open={!!showSuccess} onClose={() => setShowSuccess(null)} className="w-[90%] max-w-[420px] p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Tag {showSuccess === "created" ? "Created" : "Updated"}</h2>
          <img src={tickIcon} alt="Success" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Tag {showSuccess === "created" ? "added" : "updated"} successfully!</p>
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
            <button onClick={handleDeleteTag} className="bg-yellow-400 px-6 py-2 rounded">
              Yes
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showDeleteSuccess} onClose={() => setShowDeleteSuccess(false)} className="w-[90%] max-w-[420px] p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Deleted!</h2>
          <img src={successIcon} alt="Deleted" className="w-16 h-16 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Tag has been successfully removed.</p>
        </div>
      </Modal>
    </div>
  );
}
