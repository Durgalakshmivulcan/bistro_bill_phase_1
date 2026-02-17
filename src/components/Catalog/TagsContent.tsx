import { useState, useEffect, useMemo } from "react";
import { Search, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { getTags, deleteTag, Tag } from "../../services/catalogService";
import { showInfoToast } from "../../utils/toast";
import Modal from "../ui/Modal";
import AddEditTagModal from "./products/models/AddEditTagModal";
import LoadingSpinner from "../Common/LoadingSpinner";

import tickIcon from "../../assets/tick.png";
import deleteIcon from "../../assets/deleteConformImg.png";
import successIcon from "../../assets/deleteSuccessImg.png";

export default function TagsContent() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeItem, setActiveItem] = useState<Tag | null>(null);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [showSuccess, setShowSuccess] = useState<"created" | "updated" | null>(
    null,
  );

  const [openDelete, setOpenDelete] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch tags from API
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTags();
      if (response.success && response.data) {
        setTags(response.data.tags);
      } else {
        setError(response.message || 'Failed to load tags');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
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
        // Auto-close success modal after 2 seconds
        setTimeout(() => {
          setShowDeleteSuccess(false);
        }, 2000);
        // Refresh tags list
        fetchTags();
      } else {
        setError(response.message || 'Failed to delete tag');
        setOpenDelete(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag');
      setOpenDelete(false);
    }
  };

  const filteredTags = useMemo(() => {
    return tags.filter((tag) => {
      const matchesSearch = !searchQuery || tag.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || tag.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tags, searchQuery, statusFilter]);

  const handleExport = () => {
    const headers = ['Name', 'Status'];
    const rows = filteredTags.map((t) => [t.name, t.status]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tags.csv';
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
        <h1 className="text-[32px] font-bold">Tags</h1>

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

      {/* ================= FILTER ================= */}
      <div className="flex justify-end gap-2">
        <select
          className="border px-3 py-2 rounded text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Filter by Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button className="bg-yellow-400 px-4 py-2 rounded" onClick={() => { setSearchQuery(""); setStatusFilter(""); }}>Clear</button>
      </div>

      {/* ================= LOADING / EMPTY STATE ================= */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading tags..." />
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No tags found</p>
          <button
            onClick={() => {
              setActiveItem(null);
              setModal("add");
            }}
            className="bg-black text-white px-6 py-2 rounded"
          >
            Add Your First Tag
          </button>
        </div>
      ) : (
        /* ================= TABLE ================= */
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-yellow-400">
              <tr>
                <th className="p-3">
                  <input type="checkbox" />
                </th>
                <th className="text-left">Tag Name</th>
                <th>Status</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTags.map((tag: Tag) => (
                <tr key={tag.id} className="border-t">
                  <td className="p-3">
                    <input type="checkbox" />
                  </td>

                  <td className="font-medium">{tag.name}</td>

                  <td>
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        tag.status === "active"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {tag.status}
                    </span>
                  </td>

                  {/* ACTION MENU */}
                  <td className="relative text-right pr-4">
                    <MoreVertical
                      size={16}
                      className="cursor-pointer"
                      onClick={() =>
                        setOpenMenuId(openMenuId === tag.id ? null : tag.id)
                      }
                    />

                    {openMenuId === tag.id && (
                      <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-30">
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
      )}

      {/* ================= ADD / EDIT MODAL ================= */}
      <AddEditTagModal
        open={modal === "add" || modal === "edit"}
        data={modal === "edit" ? activeItem : null}
        onClose={() => setModal(null)}
        onSuccess={(type) => {
          setModal(null);
          setShowSuccess(type);
          // Auto-close success modal after 2 seconds
          setTimeout(() => {
            setShowSuccess(null);
          }, 2000);
          // Refresh tags list
          fetchTags();
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
            Tag {showSuccess === "created" ? "Created" : "Updated"}
          </h2>

          <img
            src={tickIcon}
            alt="Success"
            className="w-16 h-16 mx-auto mb-4"
          />

          <p className="text-sm text-gray-600">
            Tag {showSuccess === "created" ? "added" : "updated"} successfully!
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
              onClick={handleDeleteTag}
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
            Tag has been successfully removed.
          </p>
        </div>
      </Modal>
    </div>
  );
}
