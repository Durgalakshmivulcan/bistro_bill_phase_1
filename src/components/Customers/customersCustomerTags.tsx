import { Search, MoreVertical, Pencil, Trash2, Plus, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Modal from "../../components/ui/Modal";
import deleteImg from "../../assets/deleteConformImg.png";
import tickImg from "../../assets/deleteSuccessImg.png";
import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
} from "../../services/customerService";
import { TableSkeleton } from "../Common";
import { usePermissions } from "../../hooks/usePermissions";

import type { Tag } from "../../services/customerService";

type Mode = "add" | "edit";

const COLOR_PALETTE = [
  { value: "#3B82F6", name: "Blue" },
  { value: "#8B5CF6", name: "Purple" },
  { value: "#10B981", name: "Green" },
  { value: "#F59E0B", name: "Amber" },
  { value: "#EF4444", name: "Red" },
  { value: "#EC4899", name: "Pink" },
  { value: "#06B6D4", name: "Cyan" },
  { value: "#84CC16", name: "Lime" },
  { value: "#F97316", name: "Orange" },
  { value: "#6366F1", name: "Indigo" },
  { value: "#14B8A6", name: "Teal" },
  { value: "#A855F7", name: "Violet" },
];

function getTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1A1C1E" : "#FFFFFF";
}

export default function CustomersTagManagement() {
  const { canCreate, canUpdate, canDelete } = usePermissions('customers');
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletedOpen, setDeletedOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    color: "#3B82F6",
    status: "active" as "active" | "inactive",
  });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTags();
      if (response.success && response.data) {
        setTags(response.data.tags);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch tags");
    } finally {
      setLoading(false);
    }
  };

  const filteredTags = tags.filter((tag) => {
    if (!searchQuery) return true;
    return tag.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const openAdd = () => {
    setMode("add");
    setSelectedTag(null);
    setFormData({ name: "", color: "#3B82F6", status: "active" });
    setModalOpen(true);
  };

  const openEdit = (tag: Tag) => {
    setMode("edit");
    setSelectedTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color || "#3B82F6",
      status: tag.status as "active" | "inactive",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Tag name is required");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (mode === "add") {
        const response = await createTag({
          name: formData.name.trim(),
          color: formData.color,
          status: formData.status,
        });
        if (response.success) {
          setModalOpen(false);
          await fetchTags();
        } else {
          setError(response.error?.message || "Failed to create tag");
        }
      } else if (mode === "edit" && selectedTag) {
        const response = await updateTag(selectedTag.id, {
          name: formData.name.trim(),
          color: formData.color,
          status: formData.status,
        });
        if (response.success) {
          setModalOpen(false);
          await fetchTags();
        } else {
          setError(response.error?.message || "Failed to update tag");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to save tag");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTag) return;
    try {
      const response = await deleteTag(selectedTag.id);
      if (response.success) {
        setDeleteOpen(false);
        setDeletedOpen(true);
        await fetchTags();
      } else {
        setError(response.error?.message || "Failed to delete tag");
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete tag");
    }
  };

  return (
    <div className="bg-bb-bg min-h-screen p-4 md:p-6 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-[28px] md:text-[32px] font-bold">Tag Management</h1>

        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-black w-full border rounded-md pl-10 pr-10 py-2 text-sm bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {canCreate && (
            <button
              onClick={openAdd}
              className="bg-black text-white px-4 py-2 rounded text-sm flex items-center gap-2"
            >
              <Plus size={14} /> Add Tag
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-x-auto">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : tags.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No tags created yet</p>
            <button onClick={openAdd} className="bg-black text-white px-6 py-2 rounded">
              Create Your First Tag
            </button>
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No tags match your search</p>
            <button
              onClick={() => setSearchQuery("")}
              className="bg-yellow-400 px-6 py-2 rounded border border-black"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bb-primary">
              <tr>
                <th className="px-4 py-3 text-left">Sl No.</th>
                <th className="px-4 py-3 text-left">Tag Name</th>
                <th className="px-4 py-3 text-left">Color</th>
                <th className="px-4 py-3 text-left">Customer Count</th>
                <th className="px-4 py-3 text-left">Product Count</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTags.map((tag, index) => (
                <tr key={tag.id} className="border-t">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: tag.color || "#3B82F6",
                        color: getTextColor(tag.color || "#3B82F6"),
                      }}
                    >
                      {tag.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border"
                        style={{ backgroundColor: tag.color || "#3B82F6" }}
                      />
                      <span className="text-xs text-bb-textSoft">{tag.color || "#3B82F6"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{tag.customerCount}</td>
                  <td className="px-4 py-3 font-medium">{tag.productCount}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs capitalize ${
                      tag.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {tag.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center relative">
                    <button onClick={() => setOpenMenuId(openMenuId === tag.id ? null : tag.id)}>
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === tag.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-8 top-10 z-50 bg-white border rounded-md shadow w-40"
                      >
                        {canUpdate && (
                          <button
                            className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100"
                            onClick={() => { openEdit(tag); setOpenMenuId(null); }}
                          >
                            <Pencil size={14} /> Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="w-full px-3 py-2 flex items-center gap-2 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setSelectedTag(tag);
                              setDeleteOpen(true);
                              setOpenMenuId(null);
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        className="w-[95%] max-w-lg p-6"
      >
        <h2 className="text-xl font-bold mb-6">
          {mode === "add" ? "Add New Tag" : "Edit Tag"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Tag Name *</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="e.g., VIP, Loyal, New"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Color *</label>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c.value })}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    formData.color === c.value ? "ring-2 ring-offset-2 ring-black scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                >
                  {formData.color === c.value && (
                    <span style={{ color: getTextColor(c.value) }} className="text-lg">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Preview */}
          <div>
            <label className="text-sm font-medium block mb-1">Preview</label>
            <span
              className="px-3 py-1 rounded-full text-xs font-medium inline-block"
              style={{
                backgroundColor: formData.color,
                color: getTextColor(formData.color),
              }}
            >
              {formData.name || "Tag Name"}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setModalOpen(false)}
            className="border px-6 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : mode === "add" ? "Create" : "Update"}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Delete Tag</h2>
        <div className="flex justify-center mb-4">
          <img src={deleteImg} alt="Delete" className="w-16 h-16" />
        </div>
        <p className="text-sm text-gray-600 mb-2">
          This will remove the tag from all customers and products.
        </p>
        <p className="text-sm text-gray-600 mb-6">
          Do you want to delete <span className="font-semibold">{selectedTag?.name}</span>?
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={() => setDeleteOpen(false)} className="border border-black px-6 py-2 rounded">
            Cancel
          </button>
          <button onClick={handleDeleteConfirm} className="bg-yellow-400 px-8 py-2 rounded font-medium">
            Yes
          </button>
        </div>
      </Modal>

      {/* Deleted Success Modal */}
      <Modal
        open={deletedOpen}
        onClose={() => setDeletedOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">Deleted!</h2>
        <div className="flex justify-center mb-6">
          <img src={tickImg} alt="Deleted" className="w-16 h-16" />
        </div>
        <p className="text-sm text-gray-600">Tag has been successfully removed.</p>
      </Modal>
    </div>
  );
}
