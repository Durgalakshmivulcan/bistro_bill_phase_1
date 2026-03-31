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
  const { page, pageSize, setPage, resetPagination } = usePagination({
    defaultPage: 1,
    defaultPageSize: 10,
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
        if ((response.data as any)?.pagination) {
          setTotalItems((response.data as any).pagination.total || 0);
          setTotalPages((response.data as any).pagination.totalPages || 0);
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
        setDeleteOpen(false);
        setDeletedOpen(true);
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
    setError("Import is not supported yet for suppliers");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 9;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);

    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="space-y-4">
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h1 className="text-[32px] font-bold">Suppliers List</h1>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <input
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                text-black
                w-full
                border border-gray-200 rounded-md
                pl-4 pr-10 py-2
                text-sm
                bg-white
                focus:outline-none
              "
            />
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleImportClick}
              className="bg-yellow-400 px-4 py-2 rounded-md border border-black text-sm font-medium"
            >
              Import
            </button>
            <button
              onClick={handleExportSuppliers}
              className="border px-4 py-2 rounded-md border-black bg-white text-sm font-medium"
            >
              Export
            </button>
            <button
              onClick={() => navigate("/purchaseorder/suppliers/add")}
              className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add New
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-[#EADFC2] rounded-md overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" message="Loading suppliers..." />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-yellow-400 text-black">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-left font-medium">Supplier Name</th>
                <th className="px-4 py-3 text-left font-medium">Phone Number</th>
                <th className="px-4 py-3 text-left font-medium">Email Address</th>
                <th className="px-4 py-3 text-left font-medium">Address</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
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

              {suppliers.map((s, idx) => (
                <tr
                  key={s.id}
                  className={`border-t ${idx % 2 ? "bg-[#FFF9E8]" : "bg-white"}`}
                >
                  <td className="px-4 py-3">{s.code || "N/A"}</td>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.phone || "N/A"}</td>
                  <td className="px-4 py-3">{s.email || "N/A"}</td>
                  <td className="px-4 py-3 whitespace-pre-line break-words max-w-[320px]">
                    {s.address || "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-md text-xs capitalize ${
                        s.status === "active"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-[#FFE3E3] text-red-600"
                      }`}
                    >
                      {s.status === "active" ? "Active" : "Inactive"}
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

      {!loading && suppliers.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={pageSize}
          onPageChange={setPage}
          showPageSize={false}
        />
      )}

      {/* Legacy Pagination Controls */}
      {false && !loading && suppliers.length > 0 && totalPages > 1 && (
        <div className="flex justify-end pt-2">
          <div className="flex items-center gap-1 text-sm">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center disabled:opacity-50"
              aria-label="First page"
            >
              «
            </button>
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center disabled:opacity-50"
              aria-label="Previous page"
            >
              ‹
            </button>

            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-2 text-gray-500">
                  ...
                </span>
              ) : (
                <button
                  key={`p-${p}`}
                  type="button"
                  onClick={() => setPage(p as number)}
                  className={`w-7 h-7 border rounded flex items-center justify-center ${
                    page === p
                      ? "bg-yellow-400 border-yellow-400 font-medium"
                      : "border-gray-300 bg-white hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center disabled:opacity-50"
              aria-label="Next page"
            >
              ›
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center disabled:opacity-50"
              aria-label="Last page"
            >
              »
            </button>
          </div>
        </div>
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
        onClose={() => {
          setDeletedOpen(false);
          fetchSuppliers();
        }}
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
