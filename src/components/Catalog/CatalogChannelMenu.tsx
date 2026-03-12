import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronRight,
  MoreVertical,
  Eye,
  Pencil,
  Clock3,
  Trash2,
  Star,
} from "lucide-react";
import { getBranches, Branch } from "../../services/branchService";
import {
  getProducts,
  deleteProduct,
  toggleProductStatus,
  Product,
} from "../../services/catalogService";
import {
  getChannels,
  getAggregators,
  Channel,
  Aggregator,
} from "../../services/settingsService";
import { getErrorMessage } from "../../utils/errorHandler";
import { LoadingSpinner } from "../Common";
import ProductQuickViewModal from "./products/ProductQuickViewModal";
import Modal from "../ui/Modal";

type GroupByType =
  | "type"
  | "category"
  | "subCategory"
  | "menu"
  | "tags"
  | "brand";

const GROUP_OPTIONS: Array<{ label: string; value: GroupByType }> = [
  { label: "Product Type", value: "type" },
  { label: "Product Category", value: "category" },
  { label: "Product Sub-Category", value: "subCategory" },
  { label: "Menu", value: "menu" },
  { label: "By Tags", value: "tags" },
  { label: "By Brand", value: "brand" },
];

const GROUP_COLORS = [
  "bg-[#3c98e7]",
  "bg-[#27c2b3]",
  "bg-[#f0619b]",
  "bg-[#9c541f]",
  "bg-[#6f42c1]",
  "bg-[#2f855a]",
];

function getProductImage(item: Product): string {
  const primary = item.images?.find((img) => img.isPrimary);
  return primary?.url || item.images?.[0]?.url || "/placeholder.jpg";
}

function getProductPrice(item: Product): string {
  const price = item.prices?.[0]?.basePrice;
  if (typeof price !== "number") return "0.00";
  return price.toFixed(2);
}

function normalizeChannelName(value: string): string {
  return value.replace(/[\s_-]+/g, "").toLowerCase();
}

function groupKey(item: Product, type: GroupByType): string {
  if (type === "type") {
    if (item.type === "Regular") return "Regular Items";
    if (item.type === "Combo") return "Combo Items";
    if (item.type === "Retail") return "Retail Items";
    return "Other Items";
  }

  if (type === "category") return item.category?.name || "Uncategorized";
  if (type === "subCategory") return item.subCategory?.name || "No Sub-Category";
  if (type === "menu") return item.menu?.name || "Unassigned Menu";
  if (type === "brand") return item.brand?.name || "No Brand";

  if (item.tags && item.tags.length > 0) {
    return item.tags[0].name;
  }
  return "No Tags";
}

export default function CatalogChannelMenu() {
  const navigate = useNavigate();
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [aggregators, setAggregators] = useState<Aggregator[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [groupBy, setGroupBy] = useState<GroupByType>("category");
  const [search, setSearch] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [openActionFor, setOpenActionFor] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [selectedChannel, selectedBranch]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(target)
      ) {
        setShowSearchDropdown(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(target)) {
        setOpenActionFor(null);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const loadInitialData = async () => {
    setLoadingMeta(true);
    setError(null);

    const [branchRes, channelRes, aggregatorRes] = await Promise.allSettled([
      getBranches({ status: "active" }),
      getChannels(),
      getAggregators(),
    ]);

    let nextBranches: Branch[] = [];
    let nextChannels: Channel[] = [];
    let nextAggregators: Aggregator[] = [];

    if (branchRes.status === "fulfilled" && branchRes.value.success && branchRes.value.data) {
      nextBranches = branchRes.value.data.branches || [];
    }
    if (channelRes.status === "fulfilled" && channelRes.value.success && channelRes.value.data) {
      nextChannels = channelRes.value.data.filter((item) => item.status === "active") || [];
    }
    if (
      aggregatorRes.status === "fulfilled" &&
      aggregatorRes.value.success &&
      aggregatorRes.value.data
    ) {
      nextAggregators = aggregatorRes.value.data || [];
    }

    setBranches(nextBranches);
    setChannels(nextChannels);
    setAggregators(nextAggregators);

    const combinedNames = Array.from(
      new Set([
        ...nextChannels.map((item) => item.name),
        ...nextAggregators.map((item) => item.name),
      ])
    );

    setSelectedBranch(nextBranches[0]?.id || "");
    setSelectedChannel(combinedNames[0] || "");

    if (
      branchRes.status === "rejected" &&
      channelRes.status === "rejected" &&
      aggregatorRes.status === "rejected"
    ) {
      setError("Failed to load branches/channels/aggregators. Please try again.");
    }

    setLoadingMeta(false);
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    setError(null);
    try {
      const response = await getProducts({
        page: 1,
        limit: 500,
      });

      if (response.success && response.data) {
        setProducts(response.data.products || []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load products. Please try again."));
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const channelFiltered = selectedChannel
      ? products.filter((item) =>
          (item.prices || []).some(
            (price) =>
              normalizeChannelName(String(price.channelType || "")) ===
              normalizeChannelName(selectedChannel)
          )
        )
      : products;

    if (!query) return channelFiltered;

    return channelFiltered.filter((item) => {
      const name = item.name.toLowerCase();
      const category = (item.category?.name || "").toLowerCase();
      const type = (item.type || "").toLowerCase();
      const menu = (item.menu?.name || "").toLowerCase();
      const subCategory = (item.subCategory?.name || "").toLowerCase();
      const brand = (item.brand?.name || "").toLowerCase();
      const tags = (item.tags || []).map((tag) => tag.name.toLowerCase()).join(" ");

      return (
        name.includes(query) ||
        category.includes(query) ||
        type.includes(query) ||
        menu.includes(query) ||
        subCategory.includes(query) ||
        brand.includes(query) ||
        tags.includes(query)
      );
    });
  }, [products, search, selectedChannel]);

  const grouped = useMemo(() => {
    const map = filteredProducts.reduce((acc, item) => {
      const key = groupKey(item, groupBy);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, Product[]>);

    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredProducts, groupBy]);

  const channelOptions = useMemo(() => {
    const combinedNames = Array.from(
      new Set([
        ...channels
          .filter((item) => item.status === "active")
          .map((item) => item.name.trim())
          .filter(Boolean),
        ...aggregators
          .map((item) => item.name.trim())
          .filter(Boolean),
      ])
    );

    return combinedNames.sort((a, b) => a.localeCompare(b));
  }, [channels, aggregators]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      const res = await deleteProduct(deleteTarget.id);
      if (res.success) {
        setDeleteTarget(null);
        setSuccessNotice("Product deleted successfully.");
        await loadProducts();
      } else {
        setError(res.error?.message || res.message || "Failed to delete product");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete product"));
    } finally {
      setDeleting(false);
    }
  };

  const handleMarkUnavailable = async (item: Product) => {
    if (item.status === "inactive") {
      setSuccessNotice(`${item.name} is already unavailable.`);
      setOpenActionFor(null);
      return;
    }

    try {
      setActionLoadingId(item.id);
      setOpenActionFor(null);

      const res = await toggleProductStatus(item.id, "inactive");
      if (res.success) {
        setSuccessNotice(`${item.name} marked as unavailable.`);
        await loadProducts();
      } else {
        setError(res.error?.message || res.message || "Failed to mark unavailable");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to mark unavailable"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleFavorite = (item: Product) => {
    setOpenActionFor(null);
    setSuccessNotice(`${item.name} marked as favorite.`);
  };

  return (
    <div className="min-h-screen bg-[#f3f3ef] p-6 space-y-4">
      <div>
        <h1 className="text-[42px] font-bold leading-none">Channel Menu</h1>
        <p className="text-[11px] text-[#686868] mt-2 max-w-5xl">
          The Channel Menu shows all the items, grouped by category and sub-category, that are
          available across the selected branch and channel. Through the channel menu, item
          description, category, sub category and display order can be modified.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3">
        <div className="xl:col-span-2">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full h-9 border border-[#d3d3d3] rounded bg-[#f8f8f8] px-2 text-xs"
            disabled={loadingMeta || branches.length === 0}
          >
            <option value="">{branches.length ? "Select Branch" : "No Branches"}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="xl:col-span-2">
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="w-full h-9 border border-[#d3d3d3] rounded bg-[#f8f8f8] px-2 text-xs"
            disabled={loadingMeta || channelOptions.length === 0}
          >
            <option value="">
              {channelOptions.length ? "Select Channel" : "No Channels"}
            </option>
            {channelOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative xl:col-span-4" ref={searchDropdownRef}>
          <input
            value={search}
            onFocus={() => setShowSearchDropdown(true)}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search here..."
            className="w-full h-9 border border-[#d3d3d3] rounded bg-[#f8f8f8] px-3 pr-8 text-xs"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#666]"
            onClick={() => setShowSearchDropdown((prev) => !prev)}
          >
            <Search size={14} />
          </button>

          {showSearchDropdown && (
            <div className="absolute z-20 mt-1 w-full border border-[#d3d3d3] rounded bg-white shadow-sm">
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-[#efefef] border-b border-[#dedede]">
                <ChevronRight size={12} />
                <span>Group By</span>
              </div>

              {GROUP_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setGroupBy(opt.value);
                    setShowSearchDropdown(false);
                  }}
                  className={`block w-full text-left px-3 py-2 text-xs hover:bg-[#f2f2f2] ${
                    groupBy === opt.value ? "bg-[#f2deb0]" : ""
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="xl:col-span-1">
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setGroupBy("category");
              setShowSearchDropdown(false);
            }}
            className="w-full h-9 rounded border border-[#c79d2a] bg-[#f4c542] text-xs font-semibold"
          >
            Clear
          </button>
        </div>

        <div className="xl:col-span-1">
          <button
            type="button"
            onClick={() => {
              const headers = ["Name", "Category", "Type", "Menu", "Price"];
              const rows = filteredProducts.map((p) => [
                p.name,
                p.category?.name || "",
                p.type || "",
                p.menu?.name || "",
                getProductPrice(p),
              ]);
              const csv = [headers, ...rows]
                .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
                .join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "channel-menu.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="w-full h-9 rounded border border-[#bfbfbf] bg-white text-xs font-semibold"
          >
            Export
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {successNotice && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
          {successNotice}
        </div>
      )}

      {(loadingMeta || loadingProducts) && (
        <div className="py-12">
          <LoadingSpinner size="lg" message="Loading channel menu..." />
        </div>
      )}

      {!loadingMeta && !loadingProducts && grouped.length === 0 && (
        <div className="bg-white border border-[#dddddd] rounded p-8 text-center text-sm text-[#666]">
          No products available for selected branch/channel.
        </div>
      )}

      {!loadingMeta && !loadingProducts && grouped.length > 0 && (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-max" ref={actionMenuRef}>
            {grouped.map(([group, items], idx) => (
              <div key={group} className="w-[335px] border border-[#d9d9d9] rounded-lg bg-[#f6f6f6] p-2">
                <div
                  className={`h-8 rounded px-3 text-white flex items-center justify-between ${
                    GROUP_COLORS[idx % GROUP_COLORS.length]
                  }`}
                >
                  <span className="text-sm font-semibold truncate">{group}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" className="w-4 h-4 rounded-full bg-[#8bc34a]" />
                    <button
                      type="button"
                      className="w-4 h-4 rounded border border-white text-[10px] leading-3"
                          onClick={() =>
                            navigate("/catalog/products/add", {
                              state: { groupBy, group, channel: selectedChannel },
                            })
                          }
                    >
                      <Plus size={10} className="mx-auto" />
                    </button>
                  </div>
                </div>

                <div className="text-right text-[11px] text-[#666] mt-1 mb-2">{items.length} Items</div>

                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="bg-white border border-[#e0e0e0] rounded p-2 relative">
                      <button
                        type="button"
                        className="absolute right-1 top-1 p-1 rounded hover:bg-[#f2f2f2]"
                        disabled={actionLoadingId === item.id}
                        onClick={() => setOpenActionFor((prev) => (prev === item.id ? null : item.id))}
                      >
                        <MoreVertical size={14} />
                      </button>

                      {openActionFor === item.id && (
                        <div className="absolute right-2 top-7 z-30 w-44 border border-[#ddd] rounded bg-white shadow">
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-xs hover:bg-[#f4f4f4] flex items-center gap-2"
                            onClick={() => {
                              setQuickViewId(item.id);
                              setOpenActionFor(null);
                            }}
                          >
                            <Eye size={13} /> View
                          </button>

                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-xs hover:bg-[#f4f4f4] flex items-center gap-2"
                            onClick={() => {
                              navigate(`/catalog/products/edit/${item.id}`);
                              setOpenActionFor(null);
                            }}
                          >
                            <Pencil size={13} /> Edit
                          </button>

                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-xs hover:bg-[#f4f4f4] flex items-center gap-2"
                            onClick={() => {
                              void handleMarkUnavailable(item);
                            }}
                          >
                            <Clock3 size={13} /> Mark Unavailable
                          </button>

                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-[#f4f4f4] flex items-center gap-2"
                            onClick={() => {
                              setDeleteTarget(item);
                              setOpenActionFor(null);
                            }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>

                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-xs hover:bg-[#f4f4f4] flex items-center gap-2"
                            onClick={() => {
                              handleFavorite(item);
                            }}
                          >
                            <Star size={13} /> Favorite
                          </button>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <img
                          src={getProductImage(item)}
                          alt={item.name}
                          className="w-14 h-12 rounded object-cover border border-[#ddd]"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold leading-4 text-[#222] line-clamp-2">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-[#666] mt-1">Price : Rs. {getProductPrice(item)}</div>
                          {item.status === "inactive" && (
                            <div className="text-[10px] mt-1 inline-flex px-2 py-0.5 rounded bg-red-100 text-red-700">
                              Unavailable
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ProductQuickViewModal
        open={!!quickViewId}
        productId={quickViewId || ""}
        onClose={() => setQuickViewId(null)}
      />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="w-[90%] max-w-[420px] p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Delete Product</h2>
          <p className="text-sm text-gray-600 mb-6">
            This action cannot be undone.
            <br />
            Do you want to proceed with deletion?
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="border px-6 py-2 rounded"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="bg-yellow-400 px-6 py-2 rounded"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Yes"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

