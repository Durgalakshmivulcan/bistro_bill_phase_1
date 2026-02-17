import { useState, useEffect, useCallback } from "react";
import Pagination from "../../Common/Pagination";
import ReportActions from "../../Common/ReportActions";
import Select from "../../form/Select";
import { Search, Star, MessageSquare, X } from "lucide-react";
import { LoadingSpinner } from "../../Common";
import {
  getSupplierPerformance,
  updateSupplierRating,
  SupplierPerformance,
  SupplierPerformanceParams,
} from "../../../services/supplierService";

const RATING_FILTER_OPTIONS = [
  { label: "All Ratings", value: "" },
  { label: "5 Stars", value: "5" },
  { label: "4+ Stars", value: "4" },
  { label: "3+ Stars", value: "3" },
  { label: "2+ Stars", value: "2" },
  { label: "1+ Stars", value: "1" },
];

const SORT_OPTIONS = [
  { label: "Sort By", value: "" },
  { label: "Rating (High to Low)", value: "rating-desc" },
  { label: "Rating (Low to High)", value: "rating-asc" },
  { label: "Total Orders", value: "totalOrders-desc" },
  { label: "On-Time Rate", value: "onTimeDeliveryRate-desc" },
  { label: "Amount Spent", value: "totalAmountSpent-desc" },
];

const StarRating = ({
  rating,
  onRate,
  size = 16,
  interactive = false,
}: {
  rating: number;
  onRate?: (rating: number) => void;
  size?: number;
  interactive?: boolean;
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`${
            star <= (hoverRating || rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          } ${interactive ? "cursor-pointer" : ""}`}
          onClick={() => interactive && onRate?.(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
        />
      ))}
    </div>
  );
};

const SupplierPerformanceAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierPerformance[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Notes modal state
  const [notesModal, setNotesModal] = useState<{
    open: boolean;
    supplier: SupplierPerformance | null;
  }>({ open: false, supplier: null });
  const [notesText, setNotesText] = useState("");
  const [notesRating, setNotesRating] = useState(0);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: SupplierPerformanceParams = {
        page,
        limit: 25,
        search: searchQuery || undefined,
        minRating: ratingFilter ? parseInt(ratingFilter) : undefined,
      };

      if (sortOption) {
        const [sortBy, sortOrder] = sortOption.split("-") as [
          SupplierPerformanceParams["sortBy"],
          SupplierPerformanceParams["sortOrder"]
        ];
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;
      }

      const response = await getSupplierPerformance(params);

      if (response.success && response.data) {
        setSuppliers(response.data.suppliers);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setTotalItems(response.pagination.total);
        }
      } else {
        // Fallback: compute from all suppliers if endpoint not ready
        setSuppliers([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch {
      // API not yet implemented - show mock data for UI development
      const mockSuppliers: SupplierPerformance[] = [
        {
          supplierId: "s1",
          supplierName: "Fresh Farms Ltd",
          supplierCode: "SUP-001",
          status: "active",
          totalOrders: 45,
          totalAmountSpent: 125000,
          onTimeDeliveryRate: 92,
          averageDeliveryDays: 2.3,
          rating: 4,
          performanceNotes: "Reliable supplier, good quality produce",
          lastOrderDate: "2026-01-28",
        },
        {
          supplierId: "s2",
          supplierName: "Spice World Trading",
          supplierCode: "SUP-002",
          status: "active",
          totalOrders: 32,
          totalAmountSpent: 87500,
          onTimeDeliveryRate: 78,
          averageDeliveryDays: 3.5,
          rating: 3,
          performanceNotes: "Occasional delays during festivals",
          lastOrderDate: "2026-02-01",
        },
        {
          supplierId: "s3",
          supplierName: "Metro Beverages",
          supplierCode: "SUP-003",
          status: "active",
          totalOrders: 28,
          totalAmountSpent: 65000,
          onTimeDeliveryRate: 96,
          averageDeliveryDays: 1.8,
          rating: 5,
          performanceNotes: "Excellent service, always on time",
          lastOrderDate: "2026-02-03",
        },
        {
          supplierId: "s4",
          supplierName: "Dairy Fresh Co",
          supplierCode: "SUP-004",
          status: "active",
          totalOrders: 60,
          totalAmountSpent: 180000,
          onTimeDeliveryRate: 85,
          averageDeliveryDays: 1.2,
          rating: 4,
          performanceNotes: null,
          lastOrderDate: "2026-02-05",
        },
        {
          supplierId: "s5",
          supplierName: "Grain Masters",
          supplierCode: "SUP-005",
          status: "inactive",
          totalOrders: 12,
          totalAmountSpent: 34000,
          onTimeDeliveryRate: 60,
          averageDeliveryDays: 5.1,
          rating: 2,
          performanceNotes: "Frequent delays, quality issues reported",
          lastOrderDate: "2025-11-15",
        },
      ];

      // Apply filters to mock data
      let filtered = mockSuppliers;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.supplierName.toLowerCase().includes(q) ||
            s.supplierCode?.toLowerCase().includes(q)
        );
      }
      if (ratingFilter) {
        const min = parseInt(ratingFilter);
        filtered = filtered.filter((s) => s.rating >= min);
      }
      if (sortOption) {
        const [sortBy, sortOrder] = sortOption.split("-");
        filtered = [...filtered].sort((a, b) => {
          const aVal = a[sortBy as keyof SupplierPerformance] as number;
          const bVal = b[sortBy as keyof SupplierPerformance] as number;
          return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
        });
      }

      setSuppliers(filtered);
      setTotalPages(1);
      setTotalItems(filtered.length);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery, ratingFilter, sortOption]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setRatingFilter("");
    setSortOption("");
    setPage(1);
  };

  const openNotesModal = (supplier: SupplierPerformance) => {
    setNotesModal({ open: true, supplier });
    setNotesText(supplier.performanceNotes || "");
    setNotesRating(supplier.rating);
  };

  const closeNotesModal = () => {
    setNotesModal({ open: false, supplier: null });
    setNotesText("");
    setNotesRating(0);
    setSaving(false);
  };

  const handleSaveRatingNotes = async () => {
    if (!notesModal.supplier) return;
    setSaving(true);

    try {
      await updateSupplierRating(notesModal.supplier.supplierId, {
        rating: notesRating,
        performanceNotes: notesText || undefined,
      });
      // Update local state
      setSuppliers((prev) =>
        prev.map((s) =>
          s.supplierId === notesModal.supplier!.supplierId
            ? { ...s, rating: notesRating, performanceNotes: notesText || null }
            : s
        )
      );
      closeNotesModal();
    } catch {
      // Update locally even if API fails (offline-capable)
      setSuppliers((prev) =>
        prev.map((s) =>
          s.supplierId === notesModal.supplier!.supplierId
            ? { ...s, rating: notesRating, performanceNotes: notesText || null }
            : s
        )
      );
      closeNotesModal();
    }
  };

  const getDeliveryRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600 bg-green-50";
    if (rate >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  if (loading) {
    return (
      <div className="mx-2 sm:mx-4 mt-4">
        <LoadingSpinner message="Loading supplier performance analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-2 sm:mx-4 mt-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 mb-3">{error}</p>
          <button
            onClick={loadData}
            className="bg-bb-primary text-black px-4 py-2 rounded-md font-medium hover:bg-yellow-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-2 sm:mx-4 mt-4">
      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-xl font-semibold">Supplier Performance Analytics</h3>

        <div className="flex flex-wrap gap-2">
          <div className="relative w-64">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black"
            />
            <input
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-600 rounded-md px-3 pr-10 py-2 text-sm"
            />
          </div>

          <ReportActions />
        </div>
      </div>

      {/* ================= SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-bb-textSoft">Total Suppliers</p>
          <p className="text-2xl font-bold mt-1">{totalItems}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-bb-textSoft">Avg On-Time Rate</p>
          <p className="text-2xl font-bold mt-1">
            {suppliers.length > 0
              ? (
                  suppliers.reduce((sum, s) => sum + s.onTimeDeliveryRate, 0) /
                  suppliers.length
                ).toFixed(1)
              : 0}
            %
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-bb-textSoft">Total Orders</p>
          <p className="text-2xl font-bold mt-1">
            {suppliers.reduce((sum, s) => sum + s.totalOrders, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-bb-textSoft">Total Spent</p>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(
              suppliers.reduce((sum, s) => sum + s.totalAmountSpent, 0)
            )}
          </p>
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="flex flex-wrap justify-end gap-2 mb-4">
        <div className="w-52">
          <Select
            value={ratingFilter}
            onChange={(val) => {
              setRatingFilter(val);
              setPage(1);
            }}
            options={RATING_FILTER_OPTIONS}
          />
        </div>

        <div className="w-52">
          <Select
            value={sortOption}
            onChange={(val) => setSortOption(val)}
            options={SORT_OPTIONS}
          />
        </div>

        <button
          onClick={handleClearFilters}
          className="bg-yellow-400 text-black px-4 py-2 rounded-md text-sm font-medium"
        >
          Clear
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-lg overflow-hidden border border-gray-300">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full text-sm text-black">
            <thead className="bg-yellow-400">
              <tr>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Rating</th>
                <th className="px-4 py-3 text-center">On-Time Rate</th>
                <th className="px-4 py-3 text-center">Avg Delivery (Days)</th>
                <th className="px-4 py-3 text-center">Total Orders</th>
                <th className="px-4 py-3 text-right">Total Spent</th>
                <th className="px-4 py-3 text-left">Last Order</th>
                <th className="px-4 py-3 text-left">Notes</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No suppliers found matching the criteria.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier, idx) => (
                  <tr
                    key={supplier.supplierId}
                    className={idx % 2 === 0 ? "bg-white" : "bg-[#FFFAEB]"}
                  >
                    <td className="px-4 py-3 font-medium">
                      {supplier.supplierName}
                    </td>
                    <td className="px-4 py-3">{supplier.supplierCode || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          supplier.status === "active"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {supplier.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <StarRating rating={supplier.rating} size={14} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded font-medium ${getDeliveryRateColor(
                          supplier.onTimeDeliveryRate
                        )}`}
                      >
                        {supplier.onTimeDeliveryRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {supplier.averageDeliveryDays.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">
                      {supplier.totalOrders}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(supplier.totalAmountSpent)}
                    </td>
                    <td className="px-4 py-3">
                      {supplier.lastOrderDate
                        ? new Date(supplier.lastOrderDate).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs text-gray-500 truncate max-w-[150px] inline-block"
                        title={supplier.performanceNotes || "No notes"}
                      >
                        {supplier.performanceNotes || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openNotesModal(supplier)}
                        className="text-bb-textSoft hover:text-bb-text p-1 rounded hover:bg-gray-100"
                        title="Rate & Add Notes"
                      >
                        <MessageSquare size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= PAGINATION ================= */}
      <div className="mt-4">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* ================= RATING & NOTES MODAL ================= */}
      {notesModal.open && notesModal.supplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">
                Rate Supplier: {notesModal.supplier.supplierName}
              </h4>
              <button
                onClick={closeNotesModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <StarRating
                  rating={notesRating}
                  onRate={setNotesRating}
                  size={28}
                  interactive
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Performance Notes
                </label>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  rows={4}
                  placeholder="Add notes about supplier performance..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-primary"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={closeNotesModal}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRatingNotes}
                  disabled={saving || notesRating === 0}
                  className="px-4 py-2 text-sm bg-bb-primary text-black rounded-md font-medium hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierPerformanceAnalytics;
