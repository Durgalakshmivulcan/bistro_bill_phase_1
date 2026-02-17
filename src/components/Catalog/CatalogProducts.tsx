import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import ProductCard from "../Cards/ProductCard";
import FilterGroupDropdown from "../Common/FilterGroupDropdown";
import Pagination from "../Common/Pagination";
import LoadingSpinner from "../Common/LoadingSpinner";
import { getProducts, deleteProduct, importProducts, exportAllProducts, Product, bulkUpdateProductStatus, bulkDeleteProducts, getCategories, Category } from "../../services/catalogService";
import { getKitchens, getBranches, Kitchen } from "../../services/branchService";
import { PaginationMeta } from "../../types/api";
import { usePermissions } from "../../hooks/usePermissions";
import { CRUDToasts, showErrorToast } from "../../utils/toast";
import { useDebounce } from "../../hooks/useDebounce";
import { withOptimisticUpdate } from "../../utils/optimisticUpdate";

const CatalogProductsPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter states
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [kitchenList, setKitchenList] = useState<Kitchen[]>([]);
  const [kitchenFilter, setKitchenFilter] = useState<string>("");

  // ================= PERMISSIONS =================
  const { canCreate, canDelete } = usePermissions('catalog');

  // 🔥 Detect Add / Edit / View child routes
  const isChildRoute =
    location.pathname.includes("/add") ||
    location.pathname.includes("/edit/") ||
    location.pathname.includes("/view/");

  // Debounce search query to avoid excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Initialize filters from URL params on mount
  useEffect(() => {
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const min = searchParams.get('minPrice');
    const max = searchParams.get('maxPrice');
    const kitchen = searchParams.get('kitchen');

    if (category) setCategoryFilter(category);
    if (type) setTypeFilter(type);
    if (status) setStatusFilter(status);
    if (min) setMinPrice(min);
    if (max) setMaxPrice(max);
    if (kitchen) setKitchenFilter(kitchen);
  }, []);

  // Fetch categories for filter dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories({ status: 'active' });
        if (response.success && response.data) {
          setCategories(response.data.categories || []);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch kitchens for filter dropdown
  useEffect(() => {
    const fetchKitchens = async () => {
      try {
        const branchesRes = await getBranches({ status: "Active" });
        if (branchesRes.success && branchesRes.data && branchesRes.data.branches.length > 0) {
          const kitchenRes = await getKitchens(branchesRes.data.branches[0].id, "active");
          if (kitchenRes.success && kitchenRes.data) {
            setKitchenList(kitchenRes.data.kitchens || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch kitchens:", err);
      }
    };
    fetchKitchens();
  }, []);

  // Fetch products with search query and filters
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query params
        const params: any = {
          page: 1,
          limit: 20,
          search: debouncedSearch.trim() || undefined,
          categoryId: categoryFilter || undefined,
          type: typeFilter || undefined,
          status: statusFilter || undefined,
          kitchenId: kitchenFilter || undefined,
        };

        // Add price filters if both min and max are provided
        // Note: Backend may not support minPrice/maxPrice yet - will need backend update
        if (minPrice && maxPrice) {
          params.minPrice = parseFloat(minPrice);
          params.maxPrice = parseFloat(maxPrice);
        }

        const response = await getProducts(params);

        if (response.success && response.data) {
          setProducts(response.data.products || []);
          setPagination(response.pagination || null);
        } else {
          setError(response.message || 'Failed to fetch products');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    if (!isChildRoute) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChildRoute, debouncedSearch, categoryFilter, typeFilter, statusFilter, minPrice, maxPrice, kitchenFilter]);

  const handleDeleteProduct = async (id: number) => {
    try {
      // Convert number ID to string UUID (product IDs from backend are strings)
      const productId = String(id);
      const response = await deleteProduct(productId);

      if (response.success) {
        CRUDToasts.deleted("Product");
        // Refresh product list after successful deletion
        const refreshResponse = await getProducts({ page: 1, limit: 20 });
        if (refreshResponse.success && refreshResponse.data) {
          setProducts(refreshResponse.data.products || []);
          setPagination(refreshResponse.pagination || null);
        }
      } else {
        // Show error message if deletion fails
        setError(response.message || 'Failed to delete product');
        // Clear error after 3 seconds
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleExportProducts = async () => {
    try {
      setExporting(true);
      setError(null);

      // Fetch all products (or use current products if you want to export only visible ones)
      // For now, we'll export the currently loaded products
      if (products.length === 0) {
        setError('No products to export');
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Generate CSV content
      const headers = ['ID', 'Name', 'SKU', 'Type', 'Category', 'Brand', 'Base Price', 'Discount Price', 'Status', 'Is Veg', 'Created At'];
      const csvRows = [headers.join(',')];

      products.forEach((product) => {
        const priceData = product.prices?.[0];
        const basePrice = priceData?.basePrice || 0;
        const discountPrice = priceData?.discountPrice || '';
        const categoryName = product.category?.name || '';
        const brandName = product.brand?.name || '';

        const row = [
          product.id,
          `"${product.name.replace(/"/g, '""')}"`, // Escape quotes in product name
          product.sku || '',
          product.type,
          `"${categoryName.replace(/"/g, '""')}"`,
          `"${brandName.replace(/"/g, '""')}"`,
          basePrice,
          discountPrice,
          product.status,
          product.isVeg ? 'Yes' : 'No',
          new Date(product.createdAt).toLocaleDateString()
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');

      // Create blob and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `products-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export products');
      setTimeout(() => setError(null), 3000);
    } finally {
      setExporting(false);
    }
  };

  const handleExportAll = async () => {
    try {
      setExportingAll(true);
      setExportProgress(0);
      setError(null);

      await exportAllProducts((progress) => {
        setExportProgress(progress);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export all products');
      setTimeout(() => setError(null), 3000);
    } finally {
      setExportingAll(false);
      setExportProgress(0);
    }
  };

  const handleImportClick = () => {
    // Trigger file input click
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setImporting(true);
      setError(null);
      setImportSuccess(null);

      const response = await importProducts(file);

      if (response.success && response.data) {
        const { imported, failed, errors } = response.data;

        // Show success message
        let message = `Import completed: ${imported} products imported`;
        if (failed > 0) {
          message += `, ${failed} failed`;
          if (errors.length > 0) {
            // Show first few errors
            const errorMessages = errors.slice(0, 3).map(e => `Row ${e.row}: ${e.error}`).join('; ');
            message += `. Errors: ${errorMessages}`;
            if (errors.length > 3) {
              message += ` (and ${errors.length - 3} more)`;
            }
          }
        }

        setImportSuccess(message);
        setTimeout(() => setImportSuccess(null), 5000);

        // Refresh product list if any products were imported
        if (imported > 0) {
          const refreshResponse = await getProducts({ page: 1, limit: 20 });
          if (refreshResponse.success && refreshResponse.data) {
            setProducts(refreshResponse.data.products || []);
            setPagination(refreshResponse.pagination || null);
          }
        }
      } else {
        setError(response.message || 'Failed to import products');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import products');
      setTimeout(() => setError(null), 3000);
    } finally {
      setImporting(false);
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Update URL params when filters change
  useEffect(() => {
    const params: any = {};
    if (categoryFilter) params.category = categoryFilter;
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (kitchenFilter) params.kitchen = kitchenFilter;

    setSearchParams(params, { replace: true });
  }, [categoryFilter, typeFilter, statusFilter, minPrice, maxPrice, kitchenFilter, setSearchParams]);

  // Clear all filters
  const handleClearAllFilters = () => {
    setCategoryFilter("");
    setTypeFilter("");
    setStatusFilter("");
    setMinPrice("");
    setMaxPrice("");
    setKitchenFilter("");
    setSearchQuery("");
    setSearchParams({}, { replace: true });
  };

  // Count active filters
  const activeFiltersCount = [categoryFilter, typeFilter, statusFilter, minPrice, maxPrice, kitchenFilter].filter(Boolean).length;

  // Toggle product selection
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
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  // Handle bulk action selection
  const handleBulkActionChange = (action: string) => {
    setBulkAction(action);
    if (action === 'delete') {
      setShowBulkDeleteConfirm(true);
    } else if (action === 'activate' || action === 'deactivate') {
      executeBulkStatusUpdate(action);
    }
  };

  // Execute bulk status update with optimistic UI
  const executeBulkStatusUpdate = async (action: string) => {
    if (selectedProducts.size === 0) return;

    const originalProducts = [...products];
    const status = action === 'activate' ? 'active' : 'inactive';
    const selectedIds = Array.from(selectedProducts);

    setBulkActionLoading(true);
    setError(null);

    try {
      await withOptimisticUpdate({
        operation: async () => {
          const response = await bulkUpdateProductStatus(selectedIds, status);
          if (!response.success) {
            throw new Error(response.message || 'Failed to update products');
          }
          return response;
        },
        onOptimisticUpdate: () => {
          // Immediately update product statuses in UI
          setProducts(prev =>
            prev.map(p =>
              selectedIds.includes(p.id) ? { ...p, status } : p
            )
          );
        },
        onRollback: () => {
          setProducts(originalProducts);
        },
        successMessage: `${selectedIds.length} product${selectedIds.length !== 1 ? 's' : ''} ${action === 'activate' ? 'activated' : 'deactivated'} successfully`,
        errorMessage: `Failed to ${action} products. Reverting change.`,
        onSuccess: () => {
          setSelectedProducts(new Set());
          setBulkAction("");
        },
      });
    } catch {
      // withOptimisticUpdate already handled rollback and toast
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Execute bulk delete
  const executeBulkDelete = async () => {
    if (selectedProducts.size === 0) return;

    try {
      setBulkActionLoading(true);
      setError(null);
      setShowBulkDeleteConfirm(false);

      const response = await bulkDeleteProducts(Array.from(selectedProducts));

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

        // Refresh product list
        const refreshResponse = await getProducts({ page: 1, limit: 20 });
        if (refreshResponse.success && refreshResponse.data) {
          setProducts(refreshResponse.data.products || []);
          setPagination(refreshResponse.pagination || null);
        }

        // Clear selections
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

  return (
    <div className="bg-bb-bg min-h-screen p-6 space-y-4">
      {/* PAGE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-xl font-semibold">Products</h1>

        {/* 🔥 HIDE HEADER ACTIONS ON ADD / EDIT / VIEW */}
        {!isChildRoute && (
          <div
            className="relative"
            onMouseEnter={() => setShowFilters(true)}
            onMouseLeave={() => setShowFilters(false)}
          >
            <div className="flex flex-col gap-3">
              {/* Search and Action Buttons Row */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  placeholder="Search here..."
                  className="border rounded-md px-3 py-2 text-sm bg-white w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="flex gap-2 flex-wrap">
                {/* Bulk Actions Dropdown */}
                {selectedProducts.size > 0 && (
                  <select
                    className="border rounded-md px-3 py-2 text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    value={bulkAction}
                    onChange={(e) => handleBulkActionChange(e.target.value)}
                    disabled={bulkActionLoading}
                  >
                    <option value="">Bulk Actions ({selectedProducts.size} selected)</option>
                    <option value="activate">Activate</option>
                    <option value="deactivate">Deactivate</option>
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                )}
                {/* Hidden file input for CSV import */}
                {canCreate && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                )}

                {canCreate && (
                  <button
                    className="bg-yellow-400 px-3 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleImportClick}
                    disabled={importing || loading}
                  >
                    {importing ? 'Importing...' : 'Import CSV'}
                  </button>
                )}

                <button
                  className="border px-3 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleExportProducts}
                  disabled={exporting || loading}
                >
                  {exporting ? 'Exporting...' : 'Export Current Page'}
                </button>

                <button
                  className="border px-3 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed relative"
                  onClick={handleExportAll}
                  disabled={exportingAll || loading}
                >
                  {exportingAll ? (
                    <span className="flex items-center gap-1">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      {exportProgress > 0 ? `${exportProgress}%` : 'Exporting...'}
                    </span>
                  ) : 'Export All'}
                </button>

                {canCreate && (
                  <button
                    className="bg-black text-white px-3 py-2 rounded"
                    onClick={() => navigate("add")}
                  >
                    Add New
                  </button>
                )}
                </div>
              </div>

              {/* Advanced Filters Row */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Category Filter */}
                <select
                  className="border rounded-md px-3 py-2 text-sm bg-white"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {/* Type Filter */}
                <select
                  className="border rounded-md px-3 py-2 text-sm bg-white"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="Regular">Regular</option>
                  <option value="Combo">Combo</option>
                  <option value="Retail">Retail</option>
                </select>

                {/* Status Filter */}
                <select
                  className="border rounded-md px-3 py-2 text-sm bg-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                {/* Kitchen Filter */}
                <select
                  className="border rounded-md px-3 py-2 text-sm bg-white"
                  value={kitchenFilter}
                  onChange={(e) => setKitchenFilter(e.target.value)}
                >
                  <option value="">All Kitchens</option>
                  {kitchenList.map((kitchen) => (
                    <option key={kitchen.id} value={kitchen.id}>
                      {kitchen.name}
                    </option>
                  ))}
                </select>

                {/* Price Range Filters */}
                <input
                  type="number"
                  placeholder="Min Price"
                  className="border rounded-md px-3 py-2 text-sm bg-white w-32"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <span className="text-sm text-gray-500">to</span>
                <input
                  type="number"
                  placeholder="Max Price"
                  className="border rounded-md px-3 py-2 text-sm bg-white w-32"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />

                {/* Clear Filters Button */}
                {activeFiltersCount > 0 && (
                  <button
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white hover:bg-gray-50"
                    onClick={handleClearAllFilters}
                  >
                    Clear All Filters ({activeFiltersCount})
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="absolute z-30 mt-2 left-0">
                <FilterGroupDropdown />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🔽 CHILD ROUTES RENDER HERE (Add / Edit / View) */}
      <Outlet />

      {/* 🔥 PRODUCT GRID ONLY FOR LIST PAGE */}
      {!isChildRoute && (
        <>
          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" message="Loading products..." />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600 font-medium">Error</p>
              <p className="text-sm text-red-500 mt-1">{error}</p>
            </div>
          )}

          {/* Import Success Message */}
          {importSuccess && !loading && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-600 font-medium">Import Successful</p>
              <p className="text-sm text-green-600 mt-1">{importSuccess}</p>
            </div>
          )}

          {/* Bulk Action Success Message */}
          {bulkSuccess && !loading && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-600 font-medium">Success</p>
              <p className="text-sm text-green-600 mt-1">{bulkSuccess}</p>
            </div>
          )}

          {/* Bulk Delete Confirmation Modal */}
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

          {/* Select All Checkbox */}
          {!loading && !error && products.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="select-all"
                checked={selectedProducts.size === products.length && products.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 cursor-pointer"
              />
              <label htmlFor="select-all" className="text-sm text-gray-600 cursor-pointer">
                Select All ({selectedProducts.size} of {products.length} selected)
              </label>
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => {
                // Get the first price from prices array, use discountPrice if available, otherwise basePrice
                const priceData = product.prices?.[0];
                const price = priceData?.discountPrice || priceData?.basePrice || 0;
                // Get the first image URL, or use placeholder
                const imageUrl = product.images?.[0]?.url || '/placeholder.jpg';
                const isSelected = selectedProducts.has(product.id);

                return (
                  <div key={product.id} className="relative">
                    {/* Checkbox overlay */}
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProductSelection(product.id)}
                        className="w-5 h-5 cursor-pointer bg-white rounded border-2 border-gray-300"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <ProductCard
                      id={Number(product.id)}
                      name={product.name}
                      price={price}
                      image={imageUrl}
                      onDelete={handleDeleteProduct}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Product Count */}
          {!loading && !error && products.length > 0 && (
            <div className="text-sm text-gray-600 mb-2">
              Showing {products.length} {pagination?.total ? `of ${pagination.total}` : ''} product{products.length !== 1 ? 's' : ''}
              {activeFiltersCount > 0 && ` (${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} active)`}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && products.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600">
                {searchQuery.trim() || activeFiltersCount > 0 ? "No products match your search or filters" : "No products found"}
              </p>
              {searchQuery.trim() || activeFiltersCount > 0 ? (
                <button
                  onClick={handleClearAllFilters}
                  className="mt-4 bg-bb-primary text-black px-4 py-2 rounded"
                >
                  Clear All Filters
                </button>
              ) : canCreate ? (
                <button
                  onClick={() => navigate('add')}
                  className="mt-4 bg-black text-white px-4 py-2 rounded"
                >
                  Add Your First Product
                </button>
              ) : null}
            </div>
          )}

          <Pagination />
        </>
      )}
    </div>
  );
};

export default CatalogProductsPage;
