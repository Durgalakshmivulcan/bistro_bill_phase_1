import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ActionsMenu from "../form/ActionButtons";
import Pagination from "../Common/Pagination";
import LoadingSpinner from "../Common/LoadingSpinner";
import PurchaseOrderTabs from "../NavTabs/PurchaseOrderTabs";
import { useState, useEffect, useRef } from "react";
import Modal from "../../components/ui/Modal";
import deleteImg from "../../assets/deleteConformImg.png";
import tickImg from "../../assets/deleteSuccessImg.png";
import { getSuppliers, deleteSupplier, type Supplier } from "../../services/supplierService";
import { CRUDToasts } from "../../utils/toast";
import { useDebounce } from "../../hooks/useDebounce";
import { usePagination } from "../../hooks/usePagination";

export default function PurchaseOrderSuppliersList() {
  const navigate = useNavigate();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletedOpen, setDeletedOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const { page, pageSize, setPage, setPageSize, resetPagination } = usePagination({
    defaultPage: 1,
    defaultPageSize: 25,
    persistInUrl: true,
  });
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounce search query for API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch suppliers from API with search and pagination
  useEffect(() => {
    fetchSuppliers();
  }, [debouncedSearch, page, pageSize]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSuppliers({
        search: debouncedSearch.trim() || undefined,
        page,
        limit: pageSize,
      });
      if (response.success && response.data) {
        setSuppliers(response.data.suppliers);

        // Update pagination metadata
        if (response.pagination) {
          setTotalItems(response.pagination.total || 0);
          setTotalPages(response.pagination.totalPages || 0);
        } else {
          // Fallback if backend doesn't send pagination metadata
          setTotalItems(response.data.suppliers.length);
          setTotalPages(1);
        }
      } else {
        setError(response.message || "Failed to fetch suppliers");
      }
    } catch (err) {
      setError("Error fetching suppliers");
      console.error("Error fetching suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Clear search handler
  const handleClearSearch = () => {
    setSearchQuery("");
    resetPagination(); // Reset to page 1 when clearing search
  };

  const handleDeleteConfirm = async () => {
    if (!selectedId) return;

    try {
      const response = await deleteSupplier(selectedId);
      if (response.success) {
        CRUDToasts.deleted("Supplier");
        setDeleteOpen(false);
        setDeletedOpen(true);

        // Auto-close success modal and refresh list
        setTimeout(() => {
          setDeletedOpen(false);
          fetchSuppliers();
        }, 2000);
      } else {
        setError(response.message || "Failed to delete supplier");
        setDeleteOpen(false);
      }
    } catch (err) {
      setError("Error deleting supplier");
      setDeleteOpen(false);
      console.error("Error deleting supplier:", err);
    }
  };

  const handleExportSuppliers = () => {
    if (suppliers.length === 0) return;
    const headers = ["Code", "Name", "Phone", "Email", "Address", "Status"];
    const csvRows = [headers.join(",")];
    suppliers.forEach((s) => {
      const row = [
        s.code || "",
        s.name,
        s.phone || "",
        s.email || "",
        (s.address || "").replace(/"/g, '""'),
        s.status,
      ];
      csvRows.push(row.map((cell) => `"${cell}"`).join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `suppliers-export-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    CRUDToasts.created("Import is not supported yet for suppliers");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-bb-bg min-h-screen p-6 space-y-4">
      <PurchaseOrderTabs />

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-[32px] font-bold">Suppliers List</h1>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative w-64">
            <Search
              size={16}
              className="
                absolute left-3 top-1/2
                -translate-y-1/2
                text-gray-400
                pointer-events-none
              "
            />
            <input
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                text-black
                w-full
                border rounded-md
                pl-10 pr-10 py-2
                text-sm
                bg-white
                focus:outline-none
              "
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={handleImportClick} className="bg-yellow-400 px-4 py-2 rounded border border-black">
              Import
            </button>
            <button onClick={handleExportSuppliers} className="border px-4 py-2 rounded border-black">
              Export
            </button>
            <button
              onClick={() => navigate("/purchaseorder/suppliers/add")}
              className="bg-black text-white px-4 py-2 rounded"
            >
              Add New
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" message="Loading suppliers..." />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bb-primary">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Supplier Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500">
                    No suppliers found.{" "}
                    <button
                      onClick={() => navigate("/purchaseorder/suppliers/add")}
                      className="text-bb-primary underline"
                    >
                      Add Your First Supplier
                    </button>
                  </td>
                </tr>
              )}

              {suppliers.map((s) => (
                <tr key={s.id} className="border-t odd:bg-white even:bg-bb-bg">
                  <td className="px-4 py-3">{s.code || "N/A"}</td>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.phone || "N/A"}</td>
                  <td className="px-4 py-3">{s.email || "N/A"}</td>
                  <td className="px-4 py-3">{s.address || "N/A"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs capitalize ${
                        s.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ActionsMenu
                      actions={["view", "edit", "delete"]}
                      onView={() =>
                        navigate(`/purchaseorder/suppliers/view/${s.id}`)
                      }
                      onEdit={() =>
                        navigate(`/purchaseorder/suppliers/edit/${s.id}`)
                      }
                      onDelete={() => {
                        setSelectedId(s.id);
                        setDeleteOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && suppliers.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={pageSize}
          onPageChange={setPage}
          onItemsPerPageChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          showPageSize={true}
        />
      )}

      {/* 🔴 DELETE CONFIRM MODAL */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Delete</h2>

        <div className="flex justify-center mb-4">
          <img src={deleteImg} alt="Delete" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600 mb-6">
          This action cannot be undone. Do <br />
          you want to proceed with deletion?
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setDeleteOpen(false)}
            className="border border-black px-6 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleDeleteConfirm}
            className="bg-yellow-400 px-8 py-2 rounded font-medium"
          >
            Yes
          </button>
        </div>
      </Modal>

      {/* 🔵 SUCCESS MODAL */}
      <Modal
        open={deletedOpen}
        onClose={() => setDeletedOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">Deleted!</h2>

        <div className="flex justify-center mb-6">
          <img src={tickImg} alt="Deleted" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          Supplier has been successfully removed.
        </p>
      </Modal>
    </div>
  );
}
