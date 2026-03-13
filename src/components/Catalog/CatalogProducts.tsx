import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import ProductCard from "../Cards/ProductCard";
import FilterGroupDropdown, {
  FilterByValue,
  GroupByValue,
} from "../Common/FilterGroupDropdown";
import Pagination from "../Common/Pagination";
import LoadingSpinner from "../Common/LoadingSpinner";
import {
  deleteProduct,
  exportAllProducts,
  getCategories,
  getProducts,
  importProducts,
  Category,
  Product,
} from "../../services/catalogService";
import { PaginationMeta } from "../../types/api";
import { useDebounce } from "../../hooks/useDebounce";
import { getBranches, getKitchens, Kitchen } from "../../services/branchService";

const TYPE_FILTERS: FilterByValue[] = ["regular", "combo", "retail"];

const CatalogProductsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedFilterBy, setSelectedFilterBy] = useState<FilterByValue | null>(null);
  const [selectedGroupBy, setSelectedGroupBy] = useState<GroupByValue>("type");
  const [categories, setCategories] = useState<Category[]>([]);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedKitchenId, setSelectedKitchenId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const isChildRoute =
    location.pathname.includes("/add") ||
    location.pathname.includes("/edit/") ||
    location.pathname.includes("/view/");

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(target)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  useEffect(() => {
    if (!isChildRoute) {
      void fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isChildRoute,
    debouncedSearch,
    currentPage,
    selectedFilterBy,
    selectedCategoryId,
    selectedType,
    selectedStatus,
    selectedKitchenId,
    minPrice,
    maxPrice,
  ]);

  useEffect(() => {
    if (isChildRoute) return;

    const loadFilterOptions = async () => {
      try {
        const [categoriesResponse, branchesResponse] = await Promise.all([
          getCategories(),
          getBranches({ status: "Active" }),
        ]);

        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data.categories || []);
        }

        if (branchesResponse.success && branchesResponse.data) {
          const kitchenResponses = await Promise.all(
            branchesResponse.data.branches.map((branch) =>
              getKitchens(branch.id, "active")
            )
          );

          const merged = kitchenResponses.flatMap((response) =>
            response.success && response.data ? response.data.kitchens : []
          );

          const unique = merged.filter(
            (kitchen, index, arr) =>
              arr.findIndex((item) => item.id === kitchen.id) === index
          );

          setKitchens(unique);
        }
      } catch {
        // If filter metadata fails, keep page functional with available controls.
      }
    };

    void loadFilterOptions();
  }, [isChildRoute]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: {
        page: number;
        limit: number;
        search?: string;
        categoryId?: string;
        kitchenId?: string;
        status?: "active" | "inactive";
        minPrice?: number;
        maxPrice?: number;
        type?: "Regular" | "Combo" | "Retail";
        sortBy?: "name" | "createdAt" | "price";
        sortOrder?: "asc" | "desc";
      } = {
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch.trim() || undefined,
      };

      if (selectedCategoryId) {
        params.categoryId = selectedCategoryId;
      }

      if (selectedKitchenId) {
        params.kitchenId = selectedKitchenId;
      }

      if (selectedStatus) {
        params.status = selectedStatus as "active" | "inactive";
      }

      if (minPrice.trim() !== "") {
        const parsedMin = Number(minPrice);
        if (!Number.isNaN(parsedMin) && parsedMin >= 0) {
          params.minPrice = parsedMin;
        }
      }

      if (maxPrice.trim() !== "") {
        const parsedMax = Number(maxPrice);
        if (!Number.isNaN(parsedMax) && parsedMax >= 0) {
          params.maxPrice = parsedMax;
        }
      }

      if (selectedType) {
        params.type = selectedType as "Regular" | "Combo" | "Retail";
      } else if (selectedFilterBy && TYPE_FILTERS.includes(selectedFilterBy)) {
        params.type =
          selectedFilterBy === "regular"
            ? "Regular"
            : selectedFilterBy === "combo"
              ? "Combo"
              : "Retail";
      }

      if (selectedFilterBy === "recent") {
        params.sortBy = "createdAt";
        params.sortOrder = "desc";
      }

      if (selectedFilterBy === "az") {
        params.sortBy = "name";
        params.sortOrder = "asc";
      }

      if (selectedFilterBy === "za") {
        params.sortBy = "name";
        params.sortOrder = "desc";
      }

      const response = await getProducts(params);

      if (response.success && response.data) {
        setProducts(response.data.products || []);
        const paginationMeta =
          response.pagination ||
          (response as any).meta ||
          (response as any).data?.pagination ||
          null;
        setPagination(paginationMeta);
      } else {
        setError(response.message || "Failed to fetch products");
        setProducts([]);
        setPagination(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch products");
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const displayProducts = useMemo(() => {
    let list = [...products];

    if (selectedFilterBy === "addons") {
      list = list.filter((product) => (product.addons?.length || 0) > 0);
    }

    if (selectedFilterBy === "favorites") {
      const favoriteIds = new Set<string>();
      list = list.filter((product) => favoriteIds.has(product.id));
    }

    if (selectedFilterBy === "lowStock") {
      list = list.filter(() => false);
    }

    const sorter = (a: Product, b: Product, aValue: string, bValue: string) =>
      aValue.localeCompare(bValue, undefined, { sensitivity: "base" });

    if (selectedGroupBy === "type") {
      list.sort((a, b) => sorter(a, b, a.type || "", b.type || ""));
    } else if (selectedGroupBy === "category") {
      list.sort((a, b) => sorter(a, b, a.category?.name || "", b.category?.name || ""));
    } else if (selectedGroupBy === "subCategory") {
      list.sort((a, b) =>
        sorter(a, b, a.subCategory?.name || "", b.subCategory?.name || "")
      );
    } else if (selectedGroupBy === "menu") {
      list.sort((a, b) => sorter(a, b, a.menu?.name || "", b.menu?.name || ""));
    } else if (selectedGroupBy === "tags") {
      list.sort((a, b) =>
        sorter(a, b, a.tags?.[0]?.name || "", b.tags?.[0]?.name || "")
      );
    } else if (selectedGroupBy === "brand") {
      list.sort((a, b) => sorter(a, b, a.brand?.name || "", b.brand?.name || ""));
    }

    return list;
  }, [products, selectedFilterBy, selectedGroupBy]);

  const handleDeleteProduct = async (id: string | number): Promise<boolean> => {
    try {
      const response = await deleteProduct(String(id));
      if (response.success) {
        await fetchProducts();
        return true;
      } else {
        setError(response.message || "Failed to delete product");
        setTimeout(() => setError(null), 3000);
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
      setTimeout(() => setError(null), 3000);
      return false;
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Please select a CSV file");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setImporting(true);
      setError(null);
      setImportSuccess(null);

      const response = await importProducts(file);
      if (response.success && response.data) {
        setImportSuccess(`Import completed: ${response.data.imported} products imported`);
        setTimeout(() => setImportSuccess(null), 5000);
        setCurrentPage(1);
        await fetchProducts();
      } else {
        setError(response.message || "Failed to import products");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import products");
      setTimeout(() => setError(null), 3000);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);
      await exportAllProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export products");
      setTimeout(() => setError(null), 3000);
    } finally {
      setExporting(false);
    }
  };

  const isAnyAdvancedFilterApplied =
    Boolean(selectedFilterBy) ||
    Boolean(selectedCategoryId) ||
    Boolean(selectedType) ||
    Boolean(selectedStatus) ||
    Boolean(selectedKitchenId) ||
    minPrice.trim() !== "" ||
    maxPrice.trim() !== "";

  const handleClearFilters = () => {
    setSelectedFilterBy(null);
    setSelectedCategoryId("");
    setSelectedType("");
    setSelectedStatus("");
    setSelectedKitchenId("");
    setMinPrice("");
    setMaxPrice("");
    setCurrentPage(1);
  };

  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="bg-bb-bg min-h-screen p-6 space-y-4">
      <div className="flex flex-col gap-3">
        <h1 className="text-[36px] font-semibold leading-none">Products</h1>

        {!isChildRoute && (
          <div className="space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="relative w-full max-w-[420px]" ref={searchDropdownRef}>
                <input
                  placeholder="Search here..."
                  className="w-full h-10 border border-[#d0d0d0] rounded-md px-3 pr-9 text-sm"
                  value={searchQuery}
                  onFocus={() => setShowSearchDropdown(true)}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setSearchQuery(e.target.value);
                  }}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600"
                  onClick={() => setShowSearchDropdown((prev) => !prev)}
                >
                  <Search size={16} />
                </button>

                {showSearchDropdown && (
                  <div className="absolute left-0 top-[42px] z-30">
                    <FilterGroupDropdown
                      selectedFilter={selectedFilterBy}
                      selectedGroup={selectedGroupBy}
                      onFilterBySelect={(value) => {
                        setCurrentPage(1);
                        setSelectedFilterBy(value);
                      }}
                      onGroupBySelect={(value) => setSelectedGroupBy(value)}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  className="h-9 px-4 rounded bg-yellow-400 border border-[#b38900] text-sm font-medium disabled:opacity-60"
                  onClick={handleImportClick}
                  disabled={importing || loading}
                >
                  {importing ? "Uploading..." : "Upload Menu"}
                </button>

                <button
                  className="h-9 px-4 rounded border border-gray-300 bg-white text-sm disabled:opacity-60"
                  onClick={handleExport}
                  disabled={exporting || loading}
                >
                  {exporting ? "Exporting..." : "Export"}
                </button>

                <button
                  className="h-9 px-4 rounded bg-black text-white text-sm"
                  onClick={() => navigate("add")}
                >
                  Add New
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategoryId}
                onChange={(event) => {
                  setCurrentPage(1);
                  setSelectedCategoryId(event.target.value);
                }}
                className="h-9 min-w-[160px] px-3 rounded border border-gray-300 bg-white text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(event) => {
                  setCurrentPage(1);
                  setSelectedType(event.target.value);
                }}
                className="h-9 min-w-[140px] px-3 rounded border border-gray-300 bg-white text-sm"
              >
                <option value="">All Types</option>
                <option value="Regular">Regular</option>
                <option value="Combo">Combo</option>
                <option value="Retail">Retail</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(event) => {
                  setCurrentPage(1);
                  setSelectedStatus(event.target.value);
                }}
                className="h-9 min-w-[140px] px-3 rounded border border-gray-300 bg-white text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={selectedKitchenId}
                onChange={(event) => {
                  setCurrentPage(1);
                  setSelectedKitchenId(event.target.value);
                }}
                className="h-9 min-w-[150px] px-3 rounded border border-gray-300 bg-white text-sm"
              >
                <option value="">All Kitchens</option>
                {kitchens.map((kitchen) => (
                  <option key={kitchen.id} value={kitchen.id}>
                    {kitchen.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(event) => {
                  setCurrentPage(1);
                  setMinPrice(event.target.value);
                }}
                placeholder="Min Price"
                className="h-9 w-[110px] px-3 rounded border border-gray-300 bg-white text-sm"
              />

              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(event) => {
                  setCurrentPage(1);
                  setMaxPrice(event.target.value);
                }}
                placeholder="Max Price"
                className="h-9 w-[110px] px-3 rounded border border-gray-300 bg-white text-sm"
              />

              {isAnyAdvancedFilterApplied && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="h-9 px-4 rounded border border-gray-300 bg-white text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <Outlet />

      {!isChildRoute && (
        <>
          {loading && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" message="Loading products..." />
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600 font-medium">Error</p>
              <p className="text-sm text-red-500 mt-1">{error}</p>
            </div>
          )}

          {importSuccess && !loading && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-600 font-medium">Import Successful</p>
              <p className="text-sm text-green-600 mt-1">{importSuccess}</p>
            </div>
          )}

          {!loading && !error && displayProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayProducts.map((product) => {
                const priceData = product.prices?.[0];
                const price =
                  priceData?.discountPrice ??
                  priceData?.basePrice ??
                  product.basePrice ??
                  0;
                const imageUrl = product.primaryImage || product.images?.[0]?.url || "/placeholder.jpg";

                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={price}
                    image={imageUrl}
                    onDelete={handleDeleteProduct}
                  />
                );
              })}
            </div>
          )}

          {!loading && !error && displayProducts.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600">No products found</p>
            </div>
          )}

          {!loading && !error && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={pagination?.total || 0}
              itemsPerPage={itemsPerPage}
              showPageSize={false}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CatalogProductsPage;
