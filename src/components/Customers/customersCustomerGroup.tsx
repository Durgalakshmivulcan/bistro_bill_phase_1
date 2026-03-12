import { Search, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import Modal from "../../components/ui/Modal";
import Pagination from "../Common/Pagination";
import { TableSkeleton } from "../Common";
import Select from "../form/Select";
import { usePermissions } from "../../hooks/usePermissions";
import {
  createCustomerGroup,
  deleteCustomerGroup,
  getCustomerGroups,
  updateCustomerGroup,
} from "../../services/customerService";
import type { CustomerGroup } from "../../services/customerService";

type Mode = "add" | "edit";

function getTextColor(bgColor: string): string {
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1A1C1E" : "#FFFFFF";
}

export default function CustomersGroup() {
  usePermissions("customers");
  const [addOpen, setAddOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [selectedGroup, setSelectedGroup] = useState<CustomerGroup | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Filter by Status");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [formData, setFormData] = useState({
    name: "",
    status: "" as "" | "active" | "inactive",
  });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCustomerGroups();
      if (response.success && response.data) {
        setGroups(response.data);
      } else {
        setError(response.message || "Failed to load customer groups");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load customer groups");
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        group.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "Filter by Status" ||
        statusFilter === "" ||
        group.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [groups, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize));
  const pagedGroups = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredGroups.slice(start, start + pageSize);
  }, [filteredGroups, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openModal = (m: Mode, group?: CustomerGroup) => {
    setMode(m);
    setSelectedGroup(group || null);
    if (group) {
      setFormData({
        name: group.name,
        status: group.status,
      });
    } else {
      setFormData({
        name: "",
        status: "",
      });
    }
    setAddOpen(true);
    setMenuOpen(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      await Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Customer Group Name is required",
        background: "#ffffff",
      });
      return;
    }
    if (!formData.status) {
      await Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Status is required",
        background: "#ffffff",
      });
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response =
        mode === "add"
          ? await createCustomerGroup({
              name: formData.name.trim(),
              status: formData.status,
            })
          : selectedGroup
            ? await updateCustomerGroup(selectedGroup.id, {
                name: formData.name.trim(),
                status: formData.status,
              })
            : null;

      if (response?.success) {
        setAddOpen(false);
        // Ensure newly created/updated group is visible in list view
        setSearchQuery("");
        setStatusFilter("Filter by Status");
        setCurrentPage(1);

        if (mode === "add" && response.data) {
          const created = response.data as CustomerGroup;
          setGroups((prev) => [created, ...prev.filter((g) => g.id !== created.id)]);
        } else if (mode === "edit" && response.data) {
          const updated = response.data as CustomerGroup;
          setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        }

        await loadGroups();
        await Swal.fire({
          icon: "success",
          title: mode === "add" ? "Customer Group Added" : "Customer Group Updated",
          text:
            mode === "add"
              ? "Customer Group added successfully."
              : "Customer Group updated successfully.",
          timer: 1700,
          showConfirmButton: false,
          background: "#ffffff",
        });
      } else {
        setError(response?.message || "Failed to save customer group");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save customer group");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async (group: CustomerGroup) => {
    const result = await Swal.fire({
      title: "Delete Customer Group?",
      text: `Do you want to delete ${group.name}? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#EAB308",
      background: "#ffffff",
    });

    if (!result.isConfirmed) return;

    try {
      setError(null);
      const response = await deleteCustomerGroup(group.id);
      if (response.success) {
        await loadGroups();
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Customer Group has been successfully removed.",
          timer: 1700,
          showConfirmButton: false,
          background: "#ffffff",
        });
      } else {
        setError(response.message || "Failed to delete customer group");
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete customer group");
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("Filter by Status");
    setCurrentPage(1);
  };

  return (
    <div className="bg-bb-bg min-h-screen p-4 md:p-6 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-[28px] font-bold">Customers Group</h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black pointer-events-none"
            />
            <input
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="text-black w-full border rounded-md px-3 pr-10 py-2 text-sm bg-white placeholder:text-black focus:outline-none"
            />
          </div>

          <button
            onClick={() => openModal("add")}
            className="bg-black text-white px-4 py-2 rounded text-sm border border-black"
          >
            Add New
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2">
        <div className="w-full sm:w-[15%]">
          <Select
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
            options={[
              { label: "Filter by Status", value: "Filter by Status" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
        </div>
        <button
          onClick={handleClearFilters}
          className="bg-yellow-400 px-4 py-2 rounded text-sm border border-black"
        >
          Clear
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-bb-primary">
            <tr>
              <th className="px-4 py-3 text-left">Sl. No.</th>
              <th className="px-4 py-3 text-left">Customer Group</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8">
                  <TableSkeleton rows={5} />
                </td>
              </tr>
            ) : pagedGroups.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  {searchQuery || statusFilter !== "Filter by Status"
                    ? "No customer groups match your filters"
                    : "No customer groups found"}
                </td>
              </tr>
            ) : (
              pagedGroups.map((group: CustomerGroup, index) => {
                const rowNo = (currentPage - 1) * pageSize + index + 1;
                return (
                  <tr
                    key={group.id}
                    className={`border-t ${index % 2 === 0 ? "bg-[#F5F5F5]" : "bg-[#F2EEDC]"}`}
                  >
                    <td className="px-4 py-3">{rowNo}</td>
                    <td className="px-4 py-3 font-medium">
                      <span
                        className="px-3 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: group.color || "#3B82F6",
                          color: getTextColor(group.color || "#3B82F6"),
                        }}
                      >
                        {group.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          group.status === "active"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {group.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center relative">
                      <MoreVertical
                        size={16}
                        className="cursor-pointer inline-block"
                        onClick={() => setMenuOpen(menuOpen === group.id ? null : group.id)}
                      />
                      {menuOpen === group.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-4 top-8 bg-white border rounded-md shadow-md w-36 z-50"
                        >
                          <button
                            onClick={() => openModal("edit", group)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            onClick={async () => {
                              setMenuOpen(null);
                              await handleDeleteConfirm(group);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredGroups.length}
        itemsPerPage={pageSize}
        onPageChange={setCurrentPage}
        showPageSize={false}
      />

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        className="w-[95%] max-w-lg p-6 md:p-8"
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-6">
          {mode === "add" ? "Add New Customer Group" : "Edit Customer Group"}
        </h2>

        <div className="space-y-4 text-left">
          <div>
            <label className="text-sm font-medium">
              Customer Group Name<span className="text-red-500">*</span>
            </label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Customer Group Name"
              className="w-full mt-1 border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Status<span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.status}
              onChange={(value) =>
                setFormData({ ...formData, status: value as "" | "active" | "inactive" })
              }
              options={[
                { label: "Select Status", value: "" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={() => setAddOpen(false)}
            className="border px-6 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
