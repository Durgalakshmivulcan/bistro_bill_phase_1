import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../Cards/ProductCard";
import Select from "../form/Select";
import FilterGroupDropdown from "../Common/FilterGroupDropdown";
import { Search, Plus } from "lucide-react";
import Pagination from "../order-history/Pagination";
import { getBranches, Branch } from "../../services/branchService";
import { getMenus, Menu } from "../../services/catalogService";
import { getProducts, Product } from "../../services/catalogService";
import { LoadingSpinner } from "../Common";

type GroupByType = "none" | "type" | "category";

/* ---------------- GROUP COLOR MAP ---------------- */
const GROUP_COLORS: Record<string, string> = {
  Breakfast: "bg-blue-500",
  "Main Course": "bg-green-500",
  Combo: "bg-emerald-500",
  "Rice Dishes": "bg-pink-500",
  Thalis: "bg-orange-600",
  Snacks: "bg-purple-500",
  Default: "bg-bb-warning",
};

/* ---------------- GROUP HEADER ---------------- */
function GroupHeader({
  title,
  count,
  color,
  enabled,
  onToggle,
  onAdd,
}: {
  title: string;
  count: number;
  color: string;
  enabled: boolean;
  onToggle: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="mb-4">
      {/* HEADER BAR */}
      <div
        className={`flex items-center justify-between px-4 py-2 rounded-lg shadow-sm text-white text-sm font-semibold ${color}`}
      >
        <span className="truncate">{title}</span>

        <div className="flex items-center gap-2">
          {/* TOGGLE */}
          <button
            onClick={onToggle}
            className={`relative w-9 h-5 rounded-full transition ${
              enabled ? "bg-green-500" : "bg-white/40"
            }`}
          >
            <span
              className={`absolute top-[2px] w-4 h-4 bg-white rounded-full transition ${
                enabled ? "left-[18px]" : "left-[2px]"
              }`}
            />
          </button>

          {/* PLUS BUTTON */}
          <button
            onClick={onAdd}
            className="w-7 h-7 flex items-center justify-center border border-white/70 rounded-md hover:bg-white/20 transition"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* ITEM COUNT */}
      <div className="text-right text-xs text-gray-500 mt-1">
        {count} Items
      </div>
    </div>
  );
}

export default function ChannelMenuPage() {
  const navigate = useNavigate();
  const [groupBy, setGroupBy] = useState<GroupByType>("category");
  const [groupLabel, setGroupLabel] = useState("By Product Category");
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");

  /* ---------------- API STATE ---------------- */
  const [branches, setBranches] = useState<Branch[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedMenu, setSelectedMenu] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- ENABLED GROUPS STATE ---------------- */
  const [enabledGroups, setEnabledGroups] = useState<
    Record<string, boolean>
  >({});

  /* ---------------- LOAD DATA ON MOUNT ---------------- */
  useEffect(() => {
    loadInitialData();
  }, []);

  /* ---------------- LOAD PRODUCTS WHEN MENU CHANGES ---------------- */
  useEffect(() => {
    if (selectedMenu) {
      loadProducts();
    }
  }, [selectedMenu]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load branches and menus in parallel
      const [branchesRes, menusRes] = await Promise.all([
        getBranches({ status: "Active" }),
        getMenus({ status: "active" }),
      ]);

      if (branchesRes.success && branchesRes.data) {
        const branchList = branchesRes.data.branches || [];
        setBranches(branchList);
        // Auto-select first branch if available
        if (branchList.length > 0) {
          setSelectedBranch(branchList[0].id);
        }
      }

      if (menusRes.success && menusRes.data) {
        const menuList = menusRes.data.menus || [];
        setMenus(menuList);
        // Auto-select first menu if available
        if (menuList.length > 0) {
          setSelectedMenu(menuList[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
      setError("Failed to load branches and menus. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load products filtered by selected menu
      const response = await getProducts({
        menuId: selectedMenu,
        status: "active",
        page: 1,
        limit: 100, // Load enough products for display
      });

      if (response.success && response.data) {
        setProducts(response.data.products || []);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FILTER PIPELINE ---------------- */
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesSearch;
    });
  }, [products, search]);

  /* ---------------- GROUPED DATA ---------------- */
  const groupedProducts = useMemo(() => {
    return filteredProducts.reduce((acc, item) => {
      const key =
        groupBy === "type"
          ? item.type
          : groupBy === "category"
          ? item.category?.name || "Uncategorized"
          : "All Items";

      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [filteredProducts, groupBy]);

  /* ---------------- TOGGLE HANDLER ---------------- */
  const toggleGroup = (group: string) => {
    setEnabledGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  return (
    <div className="bg-bb-bg min-h-screen p-4 sm:p-6 space-y-4">
      {/* ================= TITLE ================= */}
      <div>
        <h1 className="text-2xl sm:text-[35px] font-bold">
          Channel Menu
        </h1>
        <p className="text-xs text-gray-500 max-w-4xl">
          The Channel Menu shows all the items, grouped by category and
          sub-category, available across the selected branch and channel.
        </p>
      </div>

      {/* ================= FILTER ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-center">
        {/* Branch */}
        <Select
          value={selectedBranch}
          onChange={(value) => setSelectedBranch(value)}
          options={branches.map((b) => ({ label: b.name, value: b.id }))}
          disabled={loading || branches.length === 0}
        />

        {/* Menu (Channel) */}
        <Select
          value={selectedMenu}
          onChange={(value) => {
            setSelectedMenu(value);
            setEnabledGroups({}); // Reset enabled groups when menu changes
          }}
          options={menus.map((m) => ({ label: m.name, value: m.id }))}
          disabled={loading || menus.length === 0}
        />

        {/* SEARCH + GROUP */}
        <div className="relative w-full sm:col-span-2">
          <input
            value={search || (groupBy !== "none" ? groupLabel : "")}
            placeholder="Search items or filter by group..."
            onFocus={() => setShowFilters(true)}
            onChange={(e) => {
              setSearch(e.target.value);
              setGroupBy("none");
              setGroupLabel("By Product Category");
            }}
            className="w-full border rounded-md px-3 pr-10 py-2 text-sm bg-white focus:outline-none"
          />

          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />

          {showFilters && (
            <div className="absolute left-0 mt-2 z-50 w-full sm:w-auto">
              <FilterGroupDropdown
                showFilterBy={false}
                onGroupBySelect={(value, label) => {
                  setGroupBy(value as GroupByType);
                  setGroupLabel(label);
                  setSearch("");
                  setShowFilters(false);
                }}
              />
            </div>
          )}
        </div>

        {/* CLEAR */}
        <button
          onClick={() => {
            setGroupBy("category");
            setGroupLabel("By Product Category");
            setSearch("");
            setEnabledGroups({});
          }}
          className="w-full bg-yellow-400 px-4 py-2 rounded-md text-sm border border-black font-medium"
        >
          Clear
        </button>

        {/* EXPORT */}
        <button
          className="w-full bg-white px-4 py-2 rounded-md text-sm border border-black font-medium"
          onClick={() => {
            const headers = ['Name', 'Category', 'Price', 'Status'];
            const rows = filteredProducts.map((p) => [p.name, p.category?.name || '', String(p.prices?.[0]?.basePrice || ''), p.status]);
            const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'channel-menu.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export
        </button>
      </div>

      {/* ================= ERROR STATE ================= */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="text-sm">{error}</p>
          <button
            onClick={loadInitialData}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ================= LOADING STATE ================= */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" message="Loading channel menu..." />
        </div>
      )}

      {/* ================= EMPTY STATE ================= */}
      {!loading && !error && products.length === 0 && (
        <div className="bg-white rounded-xl border p-8 text-center">
          <p className="text-gray-500 mb-4">
            No products found for the selected menu.
          </p>
          <p className="text-sm text-gray-400">
            Products need to be assigned to this menu in the Catalog section.
          </p>
        </div>
      )}

      {/* ================= GROUPED VIEW ================= */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(groupedProducts).map(([group, items]) => {
            const isEnabled = enabledGroups[group] ?? true;

            return (
              <div
                key={group}
                className={`bg-white rounded-xl border p-4 flex flex-col transition ${
                  isEnabled
                    ? "opacity-100"
                    : "opacity-40 grayscale pointer-events-none"
                }`}
              >
                <GroupHeader
                  title={group}
                  count={items.length}
                  color={GROUP_COLORS[group] || GROUP_COLORS.Default}
                  enabled={isEnabled}
                  onToggle={() => toggleGroup(group)}
                  onAdd={() =>
                    navigate("/catalog/products/add", {
                      state: { menuId: selectedMenu, category: group },
                    })
                  }
                />

                {/* PRODUCTS */}
                <div className="space-y-4 flex-1">
                  {items.map((product) => {
                    // Get primary image or first image
                    const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
                    // Get base price from prices array or fallback to 0
                    const basePrice = product.prices?.[0]?.basePrice || 0;

                    return (
                      <ProductCard
                        key={product.id}
                        id={parseInt(product.id) || 0}
                        name={product.name}
                        price={basePrice}
                        image={primaryImage?.url}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination />
    </div>
  );
}
