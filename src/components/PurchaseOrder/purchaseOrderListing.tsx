import { Search, X, RefreshCw, Pause, Play } from "lucide-react";
import Select from "../form/Select";
import { useNavigate } from "react-router-dom";
import Actions from "../form/ActionButtons";
import Pagination from "../Common/Pagination";
import LoadingSpinner from "../Common/LoadingSpinner";
import PurchaseOrderTabs from "../NavTabs/PurchaseOrderTabs";
import { useState, useEffect, useRef, useMemo } from "react";
import Modal from "../../components/ui/Modal";
import deleteImg from "../../assets/deleteConformImg.png";
import tickImg from "../../assets/deleteSuccessImg.png";
import sucesstickImg from "../../assets/tick.png";
import { getPurchaseOrders, deletePurchaseOrder, importPurchaseOrders, resendPOEmail, downloadPOPdf, pausePORecurrence, resumePORecurrence, PurchaseOrder } from "../../services/purchaseOrderService";
import { getSuppliers, Supplier } from "../../services/supplierService";
import { getBranches, Branch } from "../../services/branchService";
import { useFilters } from "../../hooks/useFilters";
import { CRUDToasts } from "../../utils/toast";
import { useDebounce } from "../../hooks/useDebounce";
import { usePagination } from "../../hooks/usePagination";

export default function PurchaseOrderPOList() {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletedOpen, setDeletedOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resendOpen, setResendOpen] = useState(false);
  const [resendConfirmOpen, setResendConfirmOpen] = useState(false);
  const [resendSending, setResendSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // State for purchase orders
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Pagination state
  const { page, pageSize, setPage, setPageSize, resetPagination } = usePagination({
    defaultPage: 1,
    defaultPageSize: 25,
    persistInUrl: true,
  });
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // State for export/import
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Setup filters using useFilters hook
  const { filterValues, setFilterValue, filteredItems: filteredByFilters, clearAllFilters } = useFilters({
    items: purchaseOrders,
    filters: [
      {
        key: 'branch',
        predicate: (po, value) => {
          if (!value || value === 'Filter by Branch') return true;
          return po.branch.name === value;
        },
        defaultValue: 'Filter by Branch'
      },
      {
        key: 'date',
        predicate: (po, value) => {
          if (!value || value === 'Filter by Date' || !po.createdAt) return true;

          const poDate = new Date(po.createdAt);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (value === 'Today') {
            const checkDate = new Date(poDate);
            checkDate.setHours(0, 0, 0, 0);
            return checkDate.getTime() === today.getTime();
          } else if (value === 'Last 7 days') {
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            return poDate >= sevenDaysAgo && poDate <= today;
          }

          return true;
        },
        defaultValue: 'Filter by Date'
      },
      {
        key: 'supplier',
        predicate: (po, value) => {
          if (!value || value === 'Filter by Supplier') return true;
          return po.supplier.name === value;
        },
        defaultValue: 'Filter by Supplier'
      }
    ]
  });

  // Get supplier names for filter options from API data
  const supplierOptions = useMemo(() => {
    return [
      { label: "Filter by Supplier", value: "Filter by Supplier" },
      ...suppliers.map(supplier => ({ label: supplier.name, value: supplier.name }))
    ];
  }, [suppliers]);

  // Debounce search query for API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load suppliers and branches on mount
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const response = await getSuppliers({ status: "active" });
        if (response.success && response.data) {
          setSuppliers(response.data.suppliers);
        }
      } catch (err) {
        console.error("Failed to load suppliers:", err);
      }
    };

    const loadBranches = async () => {
      try {
        const response = await getBranches({ status: "Active" });
        if (response.success && response.data) {
          setBranches(response.data.branches || []);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };

    loadSuppliers();
    loadBranches();
  }, []);

  // Fetch purchase orders with search and pagination
  useEffect(() => {
    fetchPurchaseOrders();
  }, [debouncedSearch, page, pageSize]);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getPurchaseOrders({
        search: debouncedSearch.trim() || undefined,
        page,
        limit: pageSize,
      });

      if (response.success && response.data?.purchaseOrders) {
        setPurchaseOrders(response.data.purchaseOrders);

        // Update pagination metadata
        if (response.pagination) {
          setTotalItems(response.pagination.total || 0);
          setTotalPages(response.pagination.totalPages || 0);
        } else {
          // Fallback if backend doesn't send pagination metadata
          setTotalItems(response.data.purchaseOrders.length);
          setTotalPages(1);
        }
      } else {
        setError(response.message || "Failed to load purchase orders");
      }
    } catch (err) {
      setError("An error occurred while fetching purchase orders");
      console.error("Failed to fetch purchase orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Clear search handler
  const handleClearSearch = () => {
    setSearchQuery("");
    resetPagination(); // Reset to page 1 when clearing search
  };

  // Use filtered results directly (search handled by API)
  const filteredPurchaseOrders = filteredByFilters;

  const handleClearFilters = () => {
    setSearchQuery("");
    clearAllFilters();
    resetPagination(); // Reset to page 1 when clearing filters
  };

  const handleDeleteConfirm = async () => {
    if (!selectedId) return;

    setDeleteOpen(false);

    try {
      const response = await deletePurchaseOrder(selectedId);

      if (response.success) {
        CRUDToasts.deleted("Purchase Order");
        setDeletedOpen(true);

        // Auto close success modal and refresh list
        setTimeout(() => {
          setDeletedOpen(false);
          fetchPurchaseOrders();
        }, 2000);
      } else {
        setError(response.message || "Failed to delete purchase order");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      setError("An error occurred while deleting purchase order");
      setTimeout(() => setError(""), 3000);
      console.error("Failed to delete purchase order:", err);
    }
  };

  const handleResendConfirm = async () => {
    if (!selectedId) return;

    setResendSending(true);

    try {
      const response = await resendPOEmail(selectedId);

      if (response.success) {
        setResendConfirmOpen(false);
        setResendOpen(true);

        // Auto close success modal
        setTimeout(() => {
          setResendOpen(false);
        }, 2000);
      } else {
        setResendConfirmOpen(false);
        setError(response.error?.message || "Failed to send email");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      setResendConfirmOpen(false);
      setError("An error occurred while sending email");
      setTimeout(() => setError(""), 3000);
      console.error("Failed to resend PO email:", err);
    } finally {
      setResendSending(false);
    }
  };

  const handleDownloadPdf = async (poId: string) => {
    try {
      const blob = await downloadPOPdf(poId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `purchase-order-${poId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download purchase order PDF");
      setTimeout(() => setError(""), 3000);
      console.error("Failed to download PO PDF:", err);
    }
  };

  const handleExportPurchaseOrders = async () => {
    if (purchaseOrders.length === 0) {
      setError("No purchase orders to export");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setExporting(true);

    try {
      // Generate CSV content
      const headers = [
        "ID",
        "Invoice Number",
        "Branch",
        "Supplier",
        "Amount Paid",
        "Grand Total",
        "Status",
        "Notes",
        "Created At",
      ];

      const csvRows = [headers.join(",")];

      purchaseOrders.forEach((po) => {
        const row = [
          po.id,
          po.invoiceNumber || "",
          po.branch.name,
          po.supplier.name,
          po.amountPaid.toString(),
          po.grandTotal.toString(),
          po.status,
          (po.notes || "").replace(/"/g, '""'),
          new Date(po.createdAt).toLocaleDateString(),
        ];
        csvRows.push(row.map((cell) => `"${cell}"`).join(","));
      });

      const csvContent = csvRows.join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `purchase-orders-export-${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export purchase orders");
      setTimeout(() => setError(""), 3000);
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError("Please select a CSV file");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setImporting(true);
    setError("");
    setImportSuccess("");

    try {
      const response = await importPurchaseOrders(file);

      if (response.success && response.data) {
        const { imported, failed, errors: importErrors } = response.data;
        const parts: string[] = [];
        if (imported > 0) parts.push(`${imported} PO(s) imported successfully`);
        if (failed > 0) parts.push(`${failed} row(s) failed`);

        if (imported > 0) {
          setImportSuccess(parts.join(", "));
          setTimeout(() => setImportSuccess(""), 8000);
          // Refresh the list
          fetchPurchaseOrders();
        }

        if (failed > 0 && importErrors && importErrors.length > 0) {
          const errorMsg = importErrors.length <= 2
            ? importErrors.join("; ")
            : `${importErrors.slice(0, 2).join("; ")} and ${importErrors.length - 2} more error(s)`;
          setError(errorMsg);
          setTimeout(() => setError(""), 8000);
        }
      } else {
        setError(response.error?.message || "Failed to import purchase orders");
        setTimeout(() => setError(""), 5000);
      }
    } catch (err) {
      setError("Failed to import purchase orders");
      setTimeout(() => setError(""), 3000);
      console.error("Import error:", err);
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleToggleRecurrence = async (po: PurchaseOrder) => {
    try {
      const response = po.recurrenceStatus === 'Paused'
        ? await resumePORecurrence(po.id)
        : await pausePORecurrence(po.id);

      if (response.success) {
        CRUDToasts.updated("Recurring PO");
        fetchPurchaseOrders();
      } else {
        setError(response.message || "Failed to update recurrence status");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      setError("Failed to update recurrence status");
      setTimeout(() => setError(""), 3000);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700";
      case "Pending":
        return "bg-gray-200 text-gray-700";
      case "Declined":
        return "bg-red-100 text-red-700";
      case "Received":
        return "bg-blue-100 text-blue-700";
      default:
        return "";
    }
  };

  return (
    <div className="bg-bb-bg min-h-screen p-6 space-y-4">
      <PurchaseOrderTabs />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Success Message */}
      {importSuccess && (
        <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded">
          {importSuccess}
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-[32px] font-bold">PO Listing</h1>

        <div className="flex items-center gap-4 flex-wrap">
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
              placeholder="Search purchase orders..."
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
          <button
            onClick={handleImportClick}
            disabled={importing || loading}
            className="bg-yellow-400 px-4 py-2 rounded border border-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? "Importing..." : "Import"}
          </button>
          <button
            onClick={handleExportPurchaseOrders}
            disabled={exporting || loading}
            className="border px-4 py-2 rounded border border-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? "Exporting..." : "Export"}
          </button>
          <button
            onClick={() => navigate("/purchaseorder/polist/add")}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Add New
          </button>
        </div>
      </div>

      {/* FILTER ROW */}
      <div className="flex justify-end items-center gap-2">
        <div className="w-[15%]">
          <Select
            value={filterValues.branch as string}
            onChange={(value) => setFilterValue('branch', value)}
            options={[
              { label: "Filter by Branch", value: "Filter by Branch" },
              ...branches.map((b) => ({ label: b.name, value: b.name })),
            ]}
          />
        </div>
        <div className="w-[15%]">
          <Select
            value={filterValues.date as string}
            onChange={(value) => setFilterValue('date', value)}
            options={[
              { label: "Filter by Date", value: "Filter by Date" },
              { label: "Today", value: "Today" },
              { label: "Last 7 days", value: "Last 7 days" },
            ]}
          />
        </div>
        <div className="w-[15%]">
          <Select
            value={filterValues.supplier as string}
            onChange={(value) => setFilterValue('supplier', value)}
            options={supplierOptions}
          />
        </div>
        <button
          onClick={handleClearFilters}
          className="bg-yellow-400 px-4 py-2 rounded border border-black"
        >
          Clear
        </button>
      </div>
      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" message="Loading purchase orders..." />
          </div>
        ) : filteredPurchaseOrders.length === 0 ? (
          <div className="text-center py-8">
            {purchaseOrders.length === 0 ? (
              <>
                <p className="text-gray-500 mb-4">No purchase orders found</p>
                <button
                  onClick={() => navigate("/purchaseorder/polist/add")}
                  className="bg-black text-white px-4 py-2 rounded"
                >
                  Add Your First Purchase Order
                </button>
              </>
            ) : (
              <p className="text-gray-500">No matching purchase orders found</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bb-primary">
              <tr>
                <th className="px-4 py-3">Sl No</th>
                <th className="px-4 py-3">Created on</th>
                <th className="px-4 py-3">PO Invoice</th>
                <th className="px-4 py-3">Supplier Name</th>
                <th className="px-4 py-3">Branch Name</th>
                <th className="px-4 py-3">Amount paid</th>
                <th className="px-4 py-3">Grand Total</th>
                <th className="px-4 py-3">Recurring</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPurchaseOrders.map((po, index) => (
                <tr key={po.id} className="border-t odd:bg-white even:bg-bb-bg">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">
                    {new Date(po.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{po.invoiceNumber || "N/A"}</td>
                  <td className="px-4 py-3">{po.supplier.name}</td>
                  <td className="px-4 py-3">{po.branch.name}</td>
                  <td className="px-4 py-3">
                    ₹ {po.amountPaid.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    ₹ {po.grandTotal.toLocaleString()}
                  </td>

                  {/* Recurring Column */}
                  <td className="px-4 py-3">
                    {po.isRecurring ? (
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-1">
                          <RefreshCw size={12} className="text-blue-600" />
                          <span className="text-xs font-medium text-blue-700">
                            {po.recurrenceFrequency}
                          </span>
                        </div>
                        {po.nextScheduledDate && (
                          <span className="text-[10px] text-gray-500">
                            Next: {new Date(po.nextScheduledDate).toLocaleDateString()}
                          </span>
                        )}
                        <button
                          onClick={() => handleToggleRecurrence(po)}
                          className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                            po.recurrenceStatus === 'Paused'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                          title={po.recurrenceStatus === 'Paused' ? 'Resume recurring PO' : 'Pause recurring PO'}
                        >
                          {po.recurrenceStatus === 'Paused' ? (
                            <><Play size={10} /> Resume</>
                          ) : (
                            <><Pause size={10} /> Pause</>
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(
                        po.status,
                      )}`}
                    >
                      {po.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <Actions
                      actions={["view", "edit", "delete", "resend", "download"]}
                      onView={() =>
                        navigate(`/purchaseorder/polist/view/${po.id}`)
                      }
                      onEdit={() =>
                        navigate(`/purchaseorder/polist/edit/${po.id}`)
                      }
                      onDelete={() => {
                        setSelectedId(po.id);
                        setDeleteOpen(true);
                      }}
                      onResend={() => {
                        setSelectedId(po.id);
                        setResendConfirmOpen(true);
                      }}
                      onDownload={() => {
                        handleDownloadPdf(po.id);
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
      {!loading && filteredPurchaseOrders.length > 0 && (
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
          Purchase order has been successfully removed.
        </p>
      </Modal>
      <Modal
        open={resendConfirmOpen}
        onClose={() => !resendSending && setResendConfirmOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Resend Email</h2>

        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to resend the <br />
          purchase order email to the supplier?
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setResendConfirmOpen(false)}
            disabled={resendSending}
            className="border border-black px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            onClick={handleResendConfirm}
            disabled={resendSending}
            className="bg-yellow-400 px-8 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendSending ? "Sending..." : "Yes, Send"}
          </button>
        </div>
      </Modal>
      <Modal
        open={resendOpen}
        onClose={() => setResendOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">Mail Sent</h2>

        <div className="flex justify-center mb-6">
          <img src={sucesstickImg} alt="Mail Sent" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          Mail successfully sent to supplier registered <br />
          email address.
        </p>
      </Modal>
    </div>
  );
}
