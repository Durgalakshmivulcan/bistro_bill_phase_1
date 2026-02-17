import { useState, useEffect, useMemo } from "react";
import {
  Search,
  MoreVertical,
  LayoutGrid,
  List,
  Pencil,
  Trash2,
} from "lucide-react";

import Modal from "../ui/Modal";
import AddEditMenuModal from "./products/models/AddEditMenuModal";
import { getMenus, Menu, deleteMenu } from "../../services/catalogService";
import { showInfoToast } from "../../utils/toast";
import { LoadingSpinner, TableSkeleton } from "../Common";

import tickIcon from "../../assets/tick.png";
import deleteIcon from "../../assets/deleteConformImg.png";
import successIcon from "../../assets/deleteSuccessImg.png";

export default function MenuContent() {
  const [view, setView] = useState<"table" | "grid">("table");
  const [activeItem, setActiveItem] = useState<Menu | null>(null);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSuccess, setShowSuccess] = useState<"created" | "updated" | null>(
    null,
  );

  const [openDelete, setOpenDelete] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Load menus on mount
  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const response = await getMenus();
      if (response.success && response.data) {
        setMenus(response.data.menus || []);
      }
    } catch (error) {
      console.error("Failed to load menus:", error);
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
        // Refresh menus list
        await loadMenus();
        // Auto-close delete success modal
        setTimeout(() => {
          setShowDeleteSuccess(false);
          setActiveItem(null);
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to delete menu:", error);
    }
  };

  const handleSuccess = async (type: "created" | "updated") => {
    setModal(null);
    setShowSuccess(type);
    // Refresh menus list
    await loadMenus();
    // Auto-close success modal
    setTimeout(() => {
      setShowSuccess(null);
      setActiveItem(null);
    }, 2000);
  };

  const filteredMenus = useMemo(() => {
    return menus.filter((m) => {
      const matchesSearch = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [menus, searchQuery, statusFilter]);

  const handleExport = () => {
    const headers = ['Name', 'Description', 'Status'];
    const rows = filteredMenus.map((m) => [m.name, m.description || '', m.status]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'menus.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h1 className="text-[32px] font-bold">Menu</h1>

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

          <button className="bg-yellow-400 px-4 py-2 rounded" onClick={() => showInfoToast('CSV import coming soon')}>Import</button>

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
      <div className="flex flex-wrap justify-end gap-2">
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

      {/* ================= TABLE VIEW ================= */}
      {view === "table" && (
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-yellow-400">
              <tr>
                <th className="p-3">
                  <input type="checkbox" />
                </th>
                <th className="text-left">Menu Name</th>
                <th>Image</th>
                <th>Description</th>
                <th>Status</th>
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
              ) : filteredMenus.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No menus found
                  </td>
                </tr>
              ) : (
                filteredMenus.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">
                    <input type="checkbox" />
                  </td>

                  <td className="font-medium">{item.name}</td>

                  <td>
                    <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                      No Image
                    </div>
                  </td>

                  <td className="text-gray-500 max-w-[260px] truncate">
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
                      {item.status}
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
      )}

      {/* ================= GRID VIEW ================= */}
      {view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full p-8">
              <LoadingSpinner size="lg" message="Loading menus..." />
            </div>
          ) : filteredMenus.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-500">
              No menus found
            </div>
          ) : (
            filteredMenus.map((item) => (
            <div key={item.id} className="bg-white border rounded-xl p-4">
              <div className="w-full h-32 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500">
                No Image
              </div>

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
                {item.status}
              </span>

              {/* GRID ACTIONS */}
              <div className="flex justify-end gap-3 mt-3">
                <button
                  onClick={() => {
                    setActiveItem(item);
                    setModal("edit");
                  }}
                >
                  <Pencil size={16} />
                </button>

                <button
                  onClick={() => {
                    setActiveItem(item);
                    setOpenDelete(true);
                  }}
                  className="text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            ))
          )}
        </div>
      )}

      {/* ================= ADD / EDIT ================= */}
      <AddEditMenuModal
        open={modal === "add" || modal === "edit"}
        data={modal === "edit" ? activeItem : null}
        onClose={() => setModal(null)}
        onSuccess={handleSuccess}
      />

      {/* ================= SUCCESS ================= */}
      <Modal
        open={!!showSuccess}
        onClose={() => setShowSuccess(null)}
        className="w-[90%] max-w-[420px] p-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Menu {showSuccess === "created" ? "Created" : "Updated"}
          </h2>

          <img src={tickIcon} className="w-16 h-16 mx-auto mb-4" />

          <p className="text-sm text-gray-600">
            Menu details {showSuccess === "created" ? "added" : "updated"}{" "}
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

          <img src={deleteIcon} className="w-14 h-14 mx-auto mb-4" />

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
            Menu has been successfully removed.
          </p>
        </div>
      </Modal>
    </div>
  );
}
