import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
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
  X,
  Check,
} from "lucide-react";
import { getBranches, Branch } from "../../services/branchService";
import {
  getProducts,
  deleteProduct,
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
import Pagination from "../Common/Pagination";
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
  return item.primaryImage || primary?.url || item.images?.[0]?.url || "/placeholder.jpg";
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

function getGroupLabel(type: GroupByType | ""): string {
  const option = GROUP_OPTIONS.find((item) => item.value === type);
  return option ? `By ${option.label}` : "";
}

const CHANNEL_MENU_UNAVAILABLE_STORAGE_KEY = "catalog-channel-menu-unavailable";

type ProductUnavailabilityConfig = {
  channels: string[];
  timeSlots: string[];
};

type ChannelUnavailableMap = Record<string, ProductUnavailabilityConfig>;

export default function CatalogChannelMenu() {
  const navigate = useNavigate();
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const actionPortalRef = useRef<HTMLDivElement>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [aggregators, setAggregators] = useState<Aggregator[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [groupBy, setGroupBy] = useState<GroupByType | "">("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [openActionFor, setOpenActionFor] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [unavailableTarget, setUnavailableTarget] = useState<Product | null>(null);
  const [selectedUnavailableChannels, setSelectedUnavailableChannels] = useState<string[]>([]);
  const [selectedUnavailableTimeSlots, setSelectedUnavailableTimeSlots] = useState<string[]>([]);
  const [unavailableModalStep, setUnavailableModalStep] = useState<"channels" | "slots">("channels");
  const [channelUnavailableMap, setChannelUnavailableMap] = useState<ChannelUnavailableMap>({});
  const [successModalMessage, setSuccessModalMessage] = useState<string | null>(null);
  const groupsPerPage = 4;
  const productsPerPage = 20;

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedValue = window.localStorage.getItem(
        CHANNEL_MENU_UNAVAILABLE_STORAGE_KEY
      );
      if (!storedValue) return;

      const parsed = JSON.parse(storedValue) as ChannelUnavailableMap;
      if (parsed && typeof parsed === "object") {
        setChannelUnavailableMap(parsed);
      }
    } catch (error) {
      console.error("Failed to load channel unavailable state:", error);
    }
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
      const clickedInsideActionTrigger =
        actionMenuRef.current && actionMenuRef.current.contains(target);
      const clickedInsidePortal =
        actionPortalRef.current && actionPortalRef.current.contains(target);

      if (!clickedInsideActionTrigger && !clickedInsidePortal) {
        setOpenActionFor(null);
        setActionMenuPosition(null);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (!openActionFor) return undefined;

    const closeMenu = () => {
      setOpenActionFor(null);
      setActionMenuPosition(null);
    };

    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);

    return () => {
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [openActionFor]);

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
    const channelFiltered = selectedChannel
      ? products.filter((item) =>
          (item.prices || []).some(
            (price) =>
              normalizeChannelName(String(price.channelType || "")) ===
              normalizeChannelName(selectedChannel)
          )
        )
      : products;

    return channelFiltered;
  }, [products, selectedChannel]);

  const hasAppliedFilters = Boolean(groupBy);

  const grouped = useMemo(() => {
    if (!groupBy) return [];

    const map = filteredProducts.reduce((acc, item) => {
      const key = groupKey(item, groupBy);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, Product[]>);

    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredProducts, groupBy]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(start, start + productsPerPage);
  }, [currentPage, filteredProducts]);

  const totalPages = hasAppliedFilters
    ? Math.max(1, Math.ceil(grouped.length / groupsPerPage))
    : Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));

  const paginatedGrouped = useMemo(() => {
    const start = (currentPage - 1) * groupsPerPage;
    return grouped.slice(start, start + groupsPerPage);
  }, [currentPage, grouped, groupsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedChannel, selectedBranch, groupBy]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

  const persistChannelUnavailableMap = (nextMap: ChannelUnavailableMap) => {
    setChannelUnavailableMap(nextMap);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        CHANNEL_MENU_UNAVAILABLE_STORAGE_KEY,
        JSON.stringify(nextMap)
      );
    }
  };

  const isUnavailableForChannel = (item: Product, channelName: string) => {
    if (!channelName) return item.status === "inactive";

    const normalizedChannel = normalizeChannelName(channelName);
    const mappedChannels = channelUnavailableMap[item.id]?.channels || [];
    return (
      item.status === "inactive" ||
      mappedChannels.some(
        (mappedChannel) =>
          normalizeChannelName(mappedChannel) === normalizedChannel
      )
    );
  };

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

  const handleMarkUnavailable = (item: Product) => {
    setOpenActionFor(null);
    setActionMenuPosition(null);
    setError(null);

    const presetChannel =
      selectedChannel && channelOptions.some(
        (option) => normalizeChannelName(option) === normalizeChannelName(selectedChannel)
      )
        ? [selectedChannel]
        : channelUnavailableMap[item.id]?.channels || [];

    setUnavailableTarget(item);
    setSelectedUnavailableChannels(presetChannel);
    setSelectedUnavailableTimeSlots(channelUnavailableMap[item.id]?.timeSlots || []);
    setUnavailableModalStep("channels");
  };

  const handleSaveUnavailableChannels = () => {
    if (!unavailableTarget) return;

    if (selectedUnavailableChannels.length === 0) {
      setError("Select at least one channel to mark as unavailable.");
      return;
    }

    if (unavailableModalStep === "channels") {
      setUnavailableModalStep("slots");
      return;
    }

    if (selectedUnavailableTimeSlots.length === 0) {
      setError("Select at least one time slot to mark as unavailable.");
      return;
    }

    const nextMap: ChannelUnavailableMap = {
      ...channelUnavailableMap,
      [unavailableTarget.id]: {
        channels: selectedUnavailableChannels,
        timeSlots: selectedUnavailableTimeSlots,
      },
    };

    persistChannelUnavailableMap(nextMap);
    setUnavailableTarget(null);
    setUnavailableModalStep("channels");

    setSuccessModalMessage(
      `Product Marked as Unavailable from ${selectedUnavailableTimeSlots[0]} to ${
        selectedUnavailableTimeSlots[selectedUnavailableTimeSlots.length - 1]
      } Successfully!`
    );
  };

  const handleFavorite = (item: Product) => {
    setOpenActionFor(null);
    setActionMenuPosition(null);
    setSuccessNotice(`${item.name} marked as favorite.`);
  };

  const handleActionMenuToggle = (
    event: React.MouseEvent<HTMLButtonElement>,
    itemId: string
  ) => {
    if (openActionFor === itemId) {
      setOpenActionFor(null);
      setActionMenuPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setOpenActionFor(itemId);
    setActionMenuPosition({
      top: Math.min(window.innerHeight - 210, rect.bottom + 6),
      left: Math.max(8, rect.right - 176),
    });
  };

  const selectedGroupLabel = getGroupLabel(groupBy);
  const activeActionItem =
    filteredProducts.find((item) => item.id === openActionFor) ||
    products.find((item) => item.id === openActionFor) ||
    null;
  const availableChannelChoices = channelOptions.length > 0
    ? channelOptions
    : ["Dine In", "Take Away", "Catering", "Subscription", "Swiggy", "Zomato", "Uber Eats"];

  const toggleUnavailableChannel = (channelName: string) => {
    setSelectedUnavailableChannels((prev) =>
      prev.includes(channelName)
        ? prev.filter((item) => item !== channelName)
        : [...prev, channelName]
    );
  };

  const timeSlotChoices = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 9; hour <= 22; hour += 1) {
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      slots.push(`${displayHour.toString().padStart(2, "0")}:00 ${period}`);
      if (hour < 22) {
        slots.push(`${displayHour.toString().padStart(2, "0")}:30 ${period}`);
      }
    }
    return slots;
  }, []);

  const toggleUnavailableTimeSlot = (slot: string) => {
    setSelectedUnavailableTimeSlots((prev) =>
      prev.includes(slot)
        ? prev.filter((item) => item !== slot)
        : [...prev, slot].sort(
            (a, b) => timeSlotChoices.indexOf(a) - timeSlotChoices.indexOf(b)
          )
    );
  };

  return (
    <div className="min-h-screen bg-bb-bg p-6 space-y-4">
      <div>
        <h1 className="text-[42px] font-bold leading-none">Channel Menu</h1>
        <p className="text-[11px] text-[#686868] mt-2 max-w-5xl">
          The Channel Menu shows all the items, grouped by category and sub-category, that are available across the selected branch and channel. Though the channel menu, item description, category, sub category and display order can be modified. Any modification done for a channel will be reflect only on that channel and will not have any impact on the base menu data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3">
        <div className="xl:col-span-2">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full h-9 border border-[#d3d3d3] rounded bg-bb-bg px-3 text-sm text-[#444]"
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
            className="w-full h-9 border border-[#d3d3d3] rounded bg-bb-bg px-3 text-sm text-[#444]"
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
          <button
            type="button"
            onClick={() => setShowSearchDropdown((prev) => !prev)}
            className="w-full h-9 border border-[#d3d3d3] rounded bg-bb-bg px-3 pr-10 text-sm text-left text-[#444]"
          >
            {selectedGroupLabel || "Search here..."}
          </button>
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
              setSelectedBranch("");
              setSelectedChannel("");
              setGroupBy("");
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

      {!loadingMeta &&
        !loadingProducts &&
        ((hasAppliedFilters && grouped.length === 0) ||
          (!hasAppliedFilters && filteredProducts.length === 0)) && (
        <div className="bg-white border border-[#dddddd] rounded p-8 text-center text-sm text-[#666]">
          No products available for selected branch/channel.
        </div>
      )}

      {!loadingMeta && !loadingProducts && !hasAppliedFilters && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" ref={actionMenuRef}>
          {paginatedProducts.map((item) => (
            <div key={item.id} className="relative rounded-lg border border-bb-border bg-white p-3">
              <button
                type="button"
                className="absolute right-2 top-2 p-1 rounded hover:bg-[#f2f2f2]"
                disabled={actionLoadingId === item.id}
                onClick={(event) => handleActionMenuToggle(event, item.id)}
              >
                <MoreVertical size={16} />
              </button>

              <div className="flex min-w-0 gap-3 flex-wrap">
                <img
                  src={getProductImage(item)}
                  alt={item.name}
                  className="h-12 w-16 rounded object-cover bg-gray-100 shrink-0"
                />
                <div className="min-w-0 pr-4">
                  <div className="text-sm font-medium leading-5 text-bb-text line-clamp-2">
                    {item.name}
                  </div>
                  <div className="mt-1 text-xs text-bb-textSoft">Price : Rs. {getProductPrice(item)}</div>
                  {isUnavailableForChannel(item, selectedChannel) && (
                    <div className="text-[10px] mt-1 inline-flex px-2 py-0.5 rounded bg-red-100 text-red-700">
                      Unavailable
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loadingMeta && !loadingProducts && hasAppliedFilters && grouped.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#666]">
            <span>
              Showing groups {(currentPage - 1) * groupsPerPage + 1} -{" "}
              {Math.min(currentPage * groupsPerPage, grouped.length)} of {grouped.length}
            </span>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-max" ref={actionMenuRef}>
            {paginatedGrouped.map(([group, items], idx) => (
              <div key={group} className="w-[335px] rounded-lg border border-bb-border bg-bb-bg p-2">
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
                    <div key={item.id} className="relative rounded-lg border border-bb-border bg-white p-3">
                      <button
                        type="button"
                        className="absolute right-1 top-1 p-1 rounded hover:bg-[#f2f2f2]"
                        disabled={actionLoadingId === item.id}
                        onClick={(event) => handleActionMenuToggle(event, item.id)}
                      >
                        <MoreVertical size={14} />
                      </button>

                      <div className="flex gap-3 flex-wrap">
                        <img
                          src={getProductImage(item)}
                          alt={item.name}
                          className="h-12 w-16 rounded object-cover bg-gray-100"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium leading-5 text-bb-text line-clamp-2">
                            {item.name}
                          </div>
                          <div className="mt-1 text-xs text-bb-textSoft">Price : Rs. {getProductPrice(item)}</div>
                          {isUnavailableForChannel(item, selectedChannel) && (
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
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {!loadingMeta && !loadingProducts && !hasAppliedFilters && filteredProducts.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredProducts.length}
          itemsPerPage={productsPerPage}
          onPageChange={setCurrentPage}
        />
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
      <Modal
        open={!!unavailableTarget}
        onClose={() => {
          setUnavailableTarget(null);
          setSelectedUnavailableChannels([]);
          setSelectedUnavailableTimeSlots([]);
          setUnavailableModalStep("channels");
        }}
        className="w-[92%] max-w-[500px] p-0 overflow-hidden"
      >
        <div className="relative px-8 pt-8 pb-8 text-center">
          <button
            type="button"
            className="absolute right-5 top-5 text-[#555] text-xl leading-none"
            onClick={() => {
              setUnavailableTarget(null);
              setSelectedUnavailableChannels([]);
              setSelectedUnavailableTimeSlots([]);
              setUnavailableModalStep("channels");
            }}
          >
            ×
          </button>

          {unavailableModalStep === "channels" ? (
            <>
              <h2 className="mx-auto max-w-[290px] text-[17px] font-medium leading-6 mb-5 text-[#444]">
                Select the channels where you want this Product Type to be unavailable.
              </h2>

              <div className="mx-auto mt-2 grid grid-cols-2 gap-x-10 gap-y-3 max-w-[285px] text-left">
                {availableChannelChoices.map((channelName) => {
                  const checked = selectedUnavailableChannels.includes(channelName);

                  return (
                    <label key={channelName} className="flex items-center gap-3 text-[14px] text-[#444]">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleUnavailableChannel(channelName)}
                        className="h-[14px] w-[14px] rounded-sm border-[#cfcfcf] text-black"
                      />
                      <span>{channelName}</span>
                    </label>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-[26px] font-bold mb-4">Mark Unavailable</h2>
              <p className="mx-auto mb-5 max-w-[320px] text-[15px] leading-6 text-[#444]">
                Select the Time Slots where you want this Product to be unavailable.
              </p>

              <div className="mx-auto grid grid-cols-4 gap-3 text-sm">
                {timeSlotChoices.map((slot) => {
                  const selected = selectedUnavailableTimeSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleUnavailableTimeSlot(slot)}
                      className={`rounded border py-2 ${
                        selected
                          ? "border-[#d8a100] bg-[#f4c542] text-black"
                          : "border-[#ddd] bg-white text-[#666]"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-7 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (unavailableModalStep === "slots") {
                  setUnavailableModalStep("channels");
                  return;
                }
                setUnavailableTarget(null);
                setSelectedUnavailableChannels([]);
                setSelectedUnavailableTimeSlots([]);
                setUnavailableModalStep("channels");
              }}
              className="min-w-[78px] rounded border border-[#7d7d7d] px-6 py-2 text-[15px] font-medium text-[#333]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveUnavailableChannels}
              className="min-w-[78px] rounded bg-[#f4c542] px-7 py-2 text-[15px] font-medium text-[#222]"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        open={!!successModalMessage}
        onClose={() => setSuccessModalMessage(null)}
        className="w-[92%] max-w-[430px] p-0 overflow-hidden"
      >
        <div className="relative px-8 pt-8 pb-9 text-center">
          <button
            type="button"
            className="absolute right-5 top-5 text-[#555] text-xl leading-none"
            onClick={() => setSuccessModalMessage(null)}
          >
            ×
          </button>
          <h2 className="text-[26px] font-bold mb-5">Saved Changes</h2>
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#2eb872] text-white">
            ✓
          </div>
          <p className="mx-auto max-w-[300px] text-[14px] leading-5 text-[#444]">{successModalMessage}</p>
        </div>
      </Modal>
      {activeActionItem &&
        actionMenuPosition &&
        createPortal(
          <div
            ref={actionPortalRef}
            className="fixed z-[100] w-44 border border-[#ddd] rounded bg-white shadow"
            style={{
              top: actionMenuPosition.top,
              left: actionMenuPosition.left,
            }}
          >
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-xs hover:bg-[#f4f4f4] flex items-center gap-2"
              onClick={() => {
                setQuickViewId(activeActionItem.id);
                setOpenActionFor(null);
                setActionMenuPosition(null);
              }}
            >
              <Eye size={13} /> View
            </button>

            <button
              type="button"
              className="w-full text-left px-3 py-2 text-xs hover:bg-[#f4f4f4] flex items-center gap-2"
              onClick={() => {
                navigate(`/catalog/products/edit/${activeActionItem.id}`);
                setOpenActionFor(null);
                setActionMenuPosition(null);
              }}
            >
              <Pencil size={13} /> Edit
            </button>

            <button
              type="button"
              className="w-full text-left px-3 py-2 text-xs hover:bg-[#f4f4f4] flex items-center gap-2"
              onClick={() => {
                handleMarkUnavailable(activeActionItem);
              }}
            >
              <Clock3 size={13} /> Mark Unavailable
            </button>

            <button
              type="button"
              className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-[#f4f4f4] flex items-center gap-2"
              onClick={() => {
                setDeleteTarget(activeActionItem);
                setOpenActionFor(null);
                setActionMenuPosition(null);
              }}
            >
              <Trash2 size={13} /> Delete
            </button>

            <button
              type="button"
              className="w-full text-left px-3 py-2 text-xs hover:bg-[#f4f4f4] flex items-center gap-2"
              onClick={() => {
                handleFavorite(activeActionItem);
              }}
            >
              <Star size={13} /> Favorite
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
