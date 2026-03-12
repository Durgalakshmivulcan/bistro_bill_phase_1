import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Actions from "../form/ActionButtons";
import Pagination from "../Common/Pagination";
import Select from "../form/Select";
import LoadingSpinner from "../Common/LoadingSpinner";
import { useState, useEffect, useRef, useMemo } from "react";
import { getInventoryProducts, deleteInventoryProduct, importInventoryProducts, bulkDeleteInventoryProducts, bulkAdjustStock, InventoryProduct } from "../../services/inventoryService";
import { getBranches, Branch } from "../../services/branchService";
import { getSuppliers, Supplier } from "../../services/supplierService";
import { useFilters } from "../../hooks/useFilters";
import { usePermissions } from "../../hooks/usePermissions";
import { usePagination } from "../../hooks/usePagination";
import { useDebounce } from "../../hooks/useDebounce";

import DeleteModalSuccess from "./deletemodule";
import StockAdjustmentModal from "./StockAdjustmentModal";

export default function InventoryList() {
  const navigate = useNavigate();
  const { canCreate, canUpdate, canDelete } =
    usePermissions('inventory', 'item');
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAdjustStock, setShowAdjustStock] = useState(false);
  const [adjustStockProduct, setAdjustStockProduct] = useState<{ id: string; name: string; stock: number; branchName: string } | null>(null);
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkAdjustStock, setShowBulkAdjustStock] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const [bulkAdjustment, setBulkAdjustment] = useState<number>(0);
  const [bulkAdjustReason, setBulkAdjustReason] = useState<string>("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Pagination state
  const { page, pageSize, setPage, setPageSize, resetPagination } = usePagination({
    defaultPage: 1,
    defaultPageSize: 25,
    persistInUrl: true,
  });
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const actionRef = useRef<HTMLDivElement>(null);

  // Debounced search for API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Setup filters using useFilters hook
  const { filterValues, setFilterValue, filteredItems: filteredByFilters, clearAllFilters } = useFilters({
    items: inventoryProducts,
    filters: [
      {
        key: 'supplier',
        predicate: (product, value) => {
          if (!value || value === 'Filter by Supplier') return true;
          return product.supplier?.name === value;
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
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        setOpenActionId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // Load branches and suppliers on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await getBranches({ status: "active" });
        if (response.success && response.data) {
          setBranches(response.data.branches);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };

    const fetchSuppliers = async () => {
      try {
        const response = await getSuppliers({ status: "active" });
        if (response.success && response.data) {
          setSuppliers(response.data.suppliers);
        }
      } catch (err) {
        console.error("Failed to load suppliers:", err);
      }
    };

    fetchBranches();
    fetchSuppliers();
  }, []);

  // Load inventory products when branch selection, pagination, or search changes
  useEffect(() => {
    const fetchInventoryProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getInventoryProducts({
          branchId: selectedBranchId || undefined,
          search: debouncedSearch.trim() || undefined,
          page,
          limit: pageSize,
        });
        if (response.success && response.data) {
          setInventoryProducts(response.data.inventoryProducts);

          // Update pagination metadata
          if (response.pagination) {
            setTotalItems(response.pagination.total || 0);
            setTotalPages(response.pagination.totalPages || 0);
          } else {
            // Fallback if backend doesn't send pagination metadata
            setTotalItems(response.data.inventoryProducts.length);
            setTotalPages(1);
          }
        } else {
          setError(response.message || "Failed to load inventory products");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryProducts();
  }, [selectedBranchId, debouncedSearch, page, pageSize]);

  const handleDeleteProduct = async (id: string) => {
    try {
      const response = await deleteInventoryProduct(id);
      if (response.success) {
        // Refresh the inventory list after successful deletion
        const refreshResponse = await getInventoryProducts();
        if (refreshResponse.success && refreshResponse.data) {
          setInventoryProducts(refreshResponse.data.inventoryProducts);
        }
        setShowDelete(false);
        setDeleteId(null);
      } else {
        setError(response.message || "Failed to delete product");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleAdjustStockSuccess = async () => {
    // Refresh the inventory list after successful stock adjustment
    const refreshResponse = await getInventoryProducts();
    if (refreshResponse.success && refreshResponse.data) {
      setInventoryProducts(refreshResponse.data.inventoryProducts);
    }
  };

  const handleExportProducts = async () => {
    try {
      setExporting(true);
      setError(null);

      if (inventoryProducts.length === 0) {
        setError("No products to export");
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Generate CSV
      const headers = [
        "ID",
        "Name",
        "Branch",
        "Supplier",
        "Unit",
        "In Stock",
        "Quantity Sold",
        "Restock Alert",
        "Cost Price",
        "Selling Price",
        "Expiry Date",
        "Status",
        "Created At",
      ];

      const rows = inventoryProducts.map((item) => [
        item.id,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.branch.name.replace(/"/g, '""')}"`,
        item.supplier ? `"${item.supplier.name.replace(/"/g, '""')}"` : "N/A",
        item.unit || "N/A",
        item.inStock,
        item.quantitySold,
        item.restockAlert || "N/A",
        item.costPrice?.toFixed(2) || "0.00",
        item.sellingPrice?.toFixed(2) || "0.00",
        item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "N/A",
        item.status,
        new Date(item.createdAt).toLocaleDateString(),
      ]);

      const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

      // Download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inventory-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export");
      setTimeout(() => setError(null), 3000);
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Since search is now handled by API, just use filteredByFilters directly
  const filteredProducts = filteredByFilters;

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedBranchId("");
    clearAllFilters();
    resetPagination(); // Reset to page 1 when clearing filters
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    resetPagination(); // Reset to page 1 when clearing search
  };

  // Toggle individual product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  // Handle bulk action selection
  const handleBulkActionChange = (action: string) => {
    setBulkAction(action);
    if (action === 'delete') {
      setShowBulkDeleteConfirm(true);
    } else if (action === 'adjustStock') {
      setShowBulkAdjustStock(true);
    } else if (action === 'export') {
      handleExportSelected();
      setBulkAction("");
    }
  };

  // Refresh inventory list helper
  const refreshInventoryList = async () => {
    const refreshResponse = await getInventoryProducts({
      branchId: selectedBranchId || undefined,
      search: debouncedSearch.trim() || undefined,
      page,
      limit: pageSize,
    });
    if (refreshResponse.success && refreshResponse.data) {
      setInventoryProducts(refreshResponse.data.inventoryProducts);
      if (refreshResponse.pagination) {
        setTotalItems(refreshResponse.pagination.total || 0);
        setTotalPages(refreshResponse.pagination.totalPages || 0);
      }
    }
  };

  // Execute bulk delete
  const executeBulkDelete = async () => {
    if (selectedProducts.size === 0) return;

    try {
      setBulkActionLoading(true);
      setError(null);
      setShowBulkDeleteConfirm(false);

      const response = await bulkDeleteInventoryProducts(Array.from(selectedProducts));

      if (response.success && response.data) {
        const { deletedCount, failedCount, errors } = response.data;

        let message = `${deletedCount} product${deletedCount !== 1 ? 's' : ''} deleted successfully`;
        if (failedCount > 0) {
          message += `, ${failedCount} failed`;
          if (errors && errors.length > 0) {
            const errorMessages = errors.slice(0, 2).join('; ');
            message += `. Errors: ${errorMessages}`;
            if (errors.length > 2) {
              message += ` (and ${errors.length - 2} more)`;
            }
          }
        }

        setBulkSuccess(message);
        setTimeout(() => setBulkSuccess(null), 5000);

        await refreshInventoryList();
        setSelectedProducts(new Set());
        setBulkAction("");
      } else {
        setError(response.message || 'Failed to delete products');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete products');
      setTimeout(() => setError(null), 3000);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Cancel bulk delete
  const cancelBulkDelete = () => {
    setShowBulkDeleteConfirm(false);
    setBulkAction("");
  };

  // Execute bulk stock adjustment
  const executeBulkAdjustStock = async () => {
    if (selectedProducts.size === 0 || bulkAdjustment === 0) return;

    try {
      setBulkActionLoading(true);
      setError(null);
      setShowBulkAdjustStock(false);

      const response = await bulkAdjustStock({
        productIds: Array.from(selectedProducts),
        adjustment: bulkAdjustment,
        reason: bulkAdjustReason || undefined,
      });

      if (response.success && response.data) {
        const { adjustedCount, failedCount, errors } = response.data;

        let message = `Stock adjusted for ${adjustedCount} product${adjustedCount !== 1 ? 's' : ''}`;
        if (failedCount > 0) {
          message += `, ${failedCount} failed`;
          if (errors && errors.length > 0) {
            const errorMessages = errors.slice(0, 2).join('; ');
            message += `. Errors: ${errorMessages}`;
            if (errors.length > 2) {
              message += ` (and ${errors.length - 2} more)`;
            }
          }
        }

        setBulkSuccess(message);
        setTimeout(() => setBulkSuccess(null), 5000);

        await refreshInventoryList();
        setSelectedProducts(new Set());
        setBulkAction("");
      } else {
        setError(response.message || 'Failed to adjust stock');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust stock');
      setTimeout(() => setError(null), 3000);
    } finally {
      setBulkActionLoading(false);
      setBulkAdjustment(0);
      setBulkAdjustReason("");
    }
  };

  // Cancel bulk stock adjustment
  const cancelBulkAdjustStock = () => {
    setShowBulkAdjustStock(false);
    setBulkAction("");
    setBulkAdjustment(0);
    setBulkAdjustReason("");
  };

  // Export selected products
  const handleExportSelected = () => {
    const productsToExport = filteredProducts.filter(p => selectedProducts.has(p.id));
    if (productsToExport.length === 0) return;

    const headers = [
      "ID", "Name", "Branch", "Supplier", "Unit",
      "In Stock", "Quantity Sold", "Restock Alert",
      "Cost Price", "Selling Price", "Expiry Date", "Status", "Created At",
    ];

    const rows = productsToExport.map((item) => [
      item.id,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.branch.name.replace(/"/g, '""')}"`,
      item.supplier ? `"${item.supplier.name.replace(/"/g, '""')}"` : "N/A",
      item.unit || "N/A",
      item.inStock,
      item.quantitySold,
      item.restockAlert || "N/A",
      item.costPrice?.toFixed(2) || "0.00",
      item.sellingPrice?.toFixed(2) || "0.00",
      item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "N/A",
      item.status,
      new Date(item.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory-selected-export-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setBulkSuccess(`Exported ${productsToExport.length} product${productsToExport.length !== 1 ? 's' : ''}`);
    setTimeout(() => setBulkSuccess(null), 3000);
  };

  // Generate branch filter options
  const branchOptions = useMemo(() => {
    return [
      { label: "All Branches", value: "" },
      ...branches.map(branch => ({ label: branch.name, value: branch.id }))
    ];
  }, [branches]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setError(null);
      setImportSuccess(null);

      const response = await importInventoryProducts(file);

      if (response.success && response.data) {
        const { imported, failed, errors } = response.data;

        let message = `Successfully imported ${imported} product(s).`;
        if (failed > 0) {
          message += ` ${failed} product(s) failed.`;
          if (errors && errors.length > 0) {
            const errorSummary = errors.slice(0, 3).join("; ");
            message += ` Errors: ${errorSummary}`;
            if (errors.length > 3) {
              message += ` (and ${errors.length - 3} more)`;
            }
          }
        }

        setImportSuccess(message);
        setTimeout(() => setImportSuccess(null), 5000);

        // Refresh the inventory list
        const refreshResponse = await getInventoryProducts();
        if (refreshResponse.success && refreshResponse.data) {
          setInventoryProducts(refreshResponse.data.inventoryProducts);
        }
      } else {
        setError(response.message || "Import failed");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setTimeout(() => setError(null), 3000);
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-bb-bg min-h-screen p-6 space-y-4">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h1 className="text-2xl font-bold">Inventory</h1>

        {error && (
          <div className="w-full lg:w-auto bg-red-50 border border-red-200 rounded-md px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {importSuccess && (
          <div className="w-full lg:w-auto bg-green-50 border border-green-200 rounded-md px-4 py-2 text-sm text-green-600">
            {importSuccess}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            />
            <input
              placeholder="Search here..."
              className="w-full border rounded-md px-3 pr-10 py-2 text-sm bg-bb-bg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Bulk Actions Dropdown */}
            {selectedProducts.size > 0 && (
              <select
                className="border rounded-md px-3 py-2 text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                value={bulkAction}
                onChange={(e) => handleBulkActionChange(e.target.value)}
                disabled={bulkActionLoading}
              >
                <option value="">Bulk Actions ({selectedProducts.size} selected)</option>
                {canDelete && <option value="delete">Delete</option>}
                {canUpdate && <option value="adjustStock">Adjust Stock</option>}
                <option value="export">Export Selected</option>
              </select>
            )}
            {/* {canCreate && ( */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {/* )} */}
            {/* {canCreate && ( */}
            <button
              onClick={handleImportClick}
              disabled={importing || loading}
              className="bg-yellow-400 px-4 py-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? "Importing..." : "Import CSV"}
            </button>
            {/* )} */}
            <button
              onClick={handleExportProducts}
              disabled={exporting || loading}
              className="border px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? "Exporting..." : "Export"}
            </button>
            <button
              onClick={() => navigate("/inventory/low-stock")}
              className="border border-red-300 text-red-600 px-4 py-2 rounded hover:bg-red-50"
            >
              Low Stock Alerts
            </button>
            {/* {canCreate && ( */}
            <button
              onClick={() => navigate("/inventory/addproduct")}
              // disabled={!canCreate}
              className="bg-black text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add New
            </button>
            {/* )} */}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3">
        <div className="w-full sm:w-64">
          <Select
            value={selectedBranchId}
            onChange={(value) => setSelectedBranchId(value)}
            options={branchOptions}
          />
        </div>

        <div className="w-full sm:w-64">
          <Select
            value={filterValues.supplier as string}
            onChange={(value) => setFilterValue('supplier', value)}
            options={supplierOptions}
          />
        </div>

        <button
          onClick={handleClearFilters}
          className="bg-yellow-400 px-4 py-2 rounded border border-black w-full sm:w-auto"
        >
          Clear
        </button>
      </div>

      {/* BULK SUCCESS MESSAGE */}
      {bulkSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md px-4 py-2 text-sm text-green-600">
          {bulkSuccess}
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Confirm Bulk Delete</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 border rounded text-sm"
                onClick={cancelBulkDelete}
                disabled={bulkActionLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={executeBulkDelete}
                disabled={bulkActionLoading}
              >
                {bulkActionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK STOCK ADJUSTMENT MODAL */}
      {showBulkAdjustStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-bb-card w-full max-w-md mx-4">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Bulk Stock Adjustment</h2>
              <button
                onClick={cancelBulkAdjustStock}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                &times;
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-sm text-gray-700">
                  Adjusting stock for <span className="font-semibold">{selectedProducts.size}</span> product{selectedProducts.size !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={bulkAdjustment}
                  onChange={(e) => setBulkAdjustment(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-primary"
                  placeholder="Enter adjustment (e.g., 10 or -5)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use positive numbers to increase stock, negative to decrease
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={bulkAdjustReason}
                  onChange={(e) => setBulkAdjustReason(e.target.value)}
                  placeholder="Enter reason for adjustment"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-primary"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={cancelBulkAdjustStock}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={bulkActionLoading}
              >
                Cancel
              </button>
              <button
                onClick={executeBulkAdjustStock}
                className="px-4 py-2 text-sm bg-bb-primary text-black rounded-md hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={bulkActionLoading || bulkAdjustment === 0}
              >
                {bulkActionLoading ? 'Adjusting...' : 'Adjust Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading inventory products..." />
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            {inventoryProducts.length === 0 ? "No inventory products found" : "No products match your search"}
          </p>
          {inventoryProducts.length === 0 && canCreate && (
            <button
              onClick={() => navigate("/inventory/addproduct")}
              className="bg-black text-white px-4 py-2 rounded"
            >
              Add Your First Product
            </button>
          )}
          {inventoryProducts.length > 0 && (
            <button
              onClick={() => setSearchQuery("")}
              className="bg-bb-primary text-black px-4 py-2 rounded"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* TABLE */}
      {!loading && filteredProducts.length > 0 && (
        <div className="bg-bb-bg border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bb-primary">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                    title="Select All"
                  />
                </th>
                <th className="px-4 py-3">Sl No.</th>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Supplier Name</th>
                <th className="px-4 py-3">In Stock</th>
                <th className="px-4 py-3">Quantity Sold</th>
                <th className="px-4 py-3">Restock Alert</th>
                <th className="px-4 py-3">Cost Price</th>
                <th className="px-4 py-3">Selling Price</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((item, i) => (
                <tr key={item.id} className={`${i % 2 === 0 ? "bg-white" : "bg-bb-bg"} ${selectedProducts.has(item.id) ? "bg-yellow-50" : ""}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(item.id)}
                      onChange={() => toggleProductSelection(item.id)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3">
                    <img
                      src={item.image || "/placeholder.jpg"}
                      className="w-10 h-10 rounded object-cover"
                      alt="inventory"
                    />
                  </td>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.branch.name}</td>
                  <td className="px-4 py-3">{item.supplier?.name || "N/A"}</td>
                  <td className="px-4 py-3">{item.inStock}</td>
                  <td className="px-4 py-3">{item.quantitySold}</td>
                  <td className="px-4 py-3">{item.restockAlert}</td>
                  <td className="px-4 py-3">₹ {item.costPrice?.toFixed(2) || "0.00"}</td>
                  <td className="px-4 py-3">₹ {item.sellingPrice?.toFixed(2) || "0.00"}</td>
                  <td className="px-4 py-3">
                    {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <td className="px-4 py-3 text-center relative">
                      <button
                        onClick={() =>
                          setOpenActionId(openActionId === item.id ? null : item.id)
                        }
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        ⋮
                      </button>

                      {openActionId === item.id && (
                        <div
                          ref={actionRef}
                          className="absolute right-8 top-10 z-50 bg-white border rounded-md shadow w-44"
                        >
                          {/* Stock Overview */}
                          <button
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                            onClick={() => {
                              navigate(`/inventory/viewproduct/${item.id}`);
                              setOpenActionId(null);
                            }}
                          >
                            👁 Stock Overview
                          </button>

                          {/* Edit */}
                          {/* {canUpdate && ( */}
                          <button
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                            onClick={() => {
                              navigate(`/inventory/editproduct/${item.id}`);
                              setOpenActionId(null);
                            }}
                          >
                            ✏️ Edit
                          </button>
                          {/* )} */}

                          {/* Delete */}
                          {/* {canDelete && ( */}
                          <button
                            className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                            onClick={() => {
                              setDeleteId(item.id);
                              setShowDelete(true);
                              setOpenActionId(null);
                            }}
                          >
                            🗑 Delete
                          </button>
                          {/* )} */}
                        </div>
                      )}
                    </td>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && filteredProducts.length > 0 && (
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

      <DeleteModalSuccess
        open={showDelete}
        onClose={() => {
          setShowDelete(false);
          setDeleteId(null);
        }}
        onConfirm={() => {
          if (deleteId) {
            handleDeleteProduct(deleteId);
          }
        }}
      />

      {adjustStockProduct && (
        <StockAdjustmentModal
          open={showAdjustStock}
          onClose={() => {
            setShowAdjustStock(false);
            setAdjustStockProduct(null);
          }}
          productId={adjustStockProduct.id}
          productName={adjustStockProduct.name}
          currentStock={adjustStockProduct.stock}
          branchName={adjustStockProduct.branchName}
          onSuccess={handleAdjustStockSuccess}
        />
      )}

    </div>



  );
}
