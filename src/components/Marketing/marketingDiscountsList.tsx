import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Actions from "../form/ActionButtons";
import Pagination from "../Common/Pagination";
import Select from "../form/Select";
import LoadingSpinner from "../Common/LoadingSpinner";
import { useState, useEffect, useMemo } from "react";
import deleteIcon from "../../assets/deleteConformImg.png";
import deleteSuccessImg from "../../assets/deleteSuccessImg.png";
import Modal from "../ui/Modal";
import { getDiscounts, deleteDiscount, Discount } from "../../services/marketingService";
import { useFilters } from "../../hooks/useFilters";
import { CRUDToasts } from "../../utils/toast";
import { usePermissions } from "../../hooks/usePermissions";

export default function DiscountsList() {
  const navigate = useNavigate();
  const { canCreate, canUpdate, canDelete } = usePermissions('marketing');
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Setup filters using useFilters hook
  const { filterValues, setFilterValue, filteredItems: filteredByFilters, clearAllFilters, hasActiveFilters } = useFilters({
    items: discounts,
    filters: [
      {
        key: 'discountType',
        predicate: (discount, value) => {
          if (!value || value === 'Discount Type') return true;
          return discount.type === value;
        },
        defaultValue: 'Discount Type'
      },
      {
        key: 'endDate',
        predicate: (discount, value) => {
          if (!value || value === 'Filter by End Date' || !discount.endDate) return true;

          const endDate = new Date(discount.endDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (value === 'Today') {
            const discountEndDate = new Date(endDate);
            discountEndDate.setHours(0, 0, 0, 0);
            return discountEndDate.getTime() === today.getTime();
          } else if (value === 'Last 7 days') {
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            return endDate >= sevenDaysAgo && endDate <= today;
          }

          return true;
        },
        defaultValue: 'Filter by End Date'
      },
      {
        key: 'status',
        predicate: (discount, value) => {
          if (!value || value === 'Filter by Status') return true;
          return discount.status.toLowerCase() === (value as string).toLowerCase();
        },
        defaultValue: 'Filter by Status'
      }
    ]
  });

  // Fetch discounts on mount
  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDiscounts();
      if (response.success && response.data) {
        setDiscounts(response.data);
      } else {
        setError(response.message || "Failed to fetch discounts");
      }
    } catch (err) {
      setError("Error loading discounts. Please try again.");
      console.error("Error fetching discounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await deleteDiscount(deleteId);
      if (response.success) {
        CRUDToasts.deleted("Discount");
        setShowConfirm(false);
        setShowSuccess(true);

        // Auto-close success modal and refresh list after 2 seconds
        setTimeout(() => {
          setShowSuccess(false);
          fetchDiscounts();
        }, 2000);
      } else {
        setError(response.message || "Failed to delete discount");
        setShowConfirm(false);
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("Error deleting discount. Please try again.");
      setShowConfirm(false);
      setTimeout(() => setError(null), 3000);
      console.error("Error deleting discount:", err);
    }
  };

  const getStatusClass = (status: string) =>
    status.toLowerCase() === "active"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";

  // Apply search on top of filtered results
  const filteredDiscounts = useMemo(() => {
    if (!searchQuery) return filteredByFilters;

    const query = searchQuery.toLowerCase();
    return filteredByFilters.filter((discount) =>
      discount.code.toLowerCase().includes(query) ||
      discount.name.toLowerCase().includes(query)
    );
  }, [filteredByFilters, searchQuery]);

  const handleClearFilters = () => {
    setSearchQuery("");
    clearAllFilters();
  };

  return (
    <div className="bg-bb-bg min-h-screen p-6 space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Discounts</h1>

        <div className="flex gap-3">
          <div className="relative w-64">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            />
            <input
              placeholder="Search here..."
              className="w-full border rounded-md px-3 pr-10 py-2 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {canCreate && (
            <button
              onClick={() => navigate("add")}
              className="bg-black text-white px-4 py-2 rounded"
            >
              Add New
            </button>
          )}
        </div>
      </div>
      <div className="flex justify-end items-center gap-2">
        <div className="w-[15%]">
          <Select
            value={filterValues.discountType as string}
            onChange={(value) => setFilterValue('discountType', value)}
            options={[
              { label: "Discount Type", value: "Discount Type" },
              { label: "Order Level", value: "OrderLevel" },
              { label: "Product Category", value: "ProductCategory" },
            ]}
          />
        </div>
        <div className="w-[15%]">
          <Select
            value={filterValues.endDate as string}
            onChange={(value) => setFilterValue('endDate', value)}
            options={[
              { label: "Filter by End Date", value: "Filter by End Date" },
              { label: "Today", value: "Today" },
              { label: "Last 7 days", value: "Last 7 days" },
            ]}
          />
        </div>
        <div className="w-[15%]">
          <Select
            value={filterValues.status as string}
            onChange={(value) => setFilterValue('status', value)}
            options={[
              { label: "Filter by Status", value: "Filter by Status" },
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
            ]}
          />
        </div>
        <button
          onClick={handleClearFilters}
          className="bg-yellow-400 px-4 py-2 rounded border border-black"
        >
          Clear
        </button>
      </div>
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading discounts..." />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredDiscounts.length === 0 && !error && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            {discounts.length === 0 ? "No discounts found" : "No discounts match your filters"}
          </p>
          {discounts.length === 0 ? (
            <button
              onClick={() => navigate("add")}
              className="bg-black text-white px-4 py-2 rounded"
            >
              Add Your First Discount
            </button>
          ) : (
            <button
              onClick={handleClearFilters}
              className="bg-bb-primary text-black px-4 py-2 rounded"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* TABLE */}
      {!loading && filteredDiscounts.length > 0 && (
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FFE08A]">
              <tr>
                <th className="px-4 py-3">Discount Code</th>
                <th className="px-4 py-3">Discount Name</th>
                <th className="px-4 py-3">Discount Type</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredDiscounts.map((d, i) => (
                <tr key={d.id} className={i % 2 ? "bg-[#FFF9ED]" : "bg-white"}>
                  <td className="px-4 py-3">{d.code}</td>
                  <td className="px-4 py-3">{d.name}</td>
                  <td className="px-4 py-3">{d.type}</td>
                  <td className="px-4 py-3">
                    {d.valueType === "Percentage" ? `${d.value}%` : `₹${d.value}`}
                  </td>
                  <td className="px-4 py-3">
                    {d.startDate ? new Date(d.startDate).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    {d.endDate ? new Date(d.endDate).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusClass(
                        d.status,
                      )}`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <Actions
                    actions={[
                      ...(canUpdate ? ["edit" as const] : []),
                      ...(canDelete ? ["delete" as const] : []),
                    ]}
                    onEdit={() => navigate(`edit/${d.id}`)}
                    onDelete={() => handleDeleteClick(d.id)}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination />

      {/* DELETE CONFIRM MODAL */}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Delete</h2>

        <div className="flex justify-center mb-4">
          <img src={deleteIcon} alt="delete" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600 mb-6">
          This action cannot be undone. <br />
          Do you want to proceed with deletion?
        </p>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            className="border px-6 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={confirmDelete}
            className="bg-yellow-400 px-6 py-2 rounded font-medium"
          >
            Yes
          </button>
        </div>
      </Modal>

      {/* DELETE SUCCESS MODAL */}
      <Modal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Deleted!</h2>

        <div className="flex justify-center mb-4">
          <img src={deleteSuccessImg} alt="success" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          Discount Offer has been successfully deleted.
        </p>
      </Modal>
    </div>
  );
}
