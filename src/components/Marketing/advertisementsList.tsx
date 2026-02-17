import { Search } from "lucide-react";
import Actions from "../form/ActionButtons";
import Pagination from "../Common/Pagination";
import LoadingSpinner from "../Common/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import Select from "../form/Select";
import { useState, useEffect, useMemo } from "react";
import deleteIcon from "../../assets/deleteConformImg.png";
import deleteSuccessImg from "../../assets/deleteSuccessImg.png";
import Modal from "../ui/Modal";
import { getAdvertisements, deleteAdvertisement, Advertisement } from "../../services/marketingService";
import { useFilters } from "../../hooks/useFilters";
import { usePermissions } from "../../hooks/usePermissions";

export default function AdvertisementsList() {
  const navigate = useNavigate();
  const { canCreate, canUpdate, canDelete } = usePermissions('marketing');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Setup filters using useFilters hook
  const { filterValues, setFilterValue, filteredItems: filteredByFilters, clearAllFilters } = useFilters({
    items: advertisements,
    filters: [
      {
        key: 'expiryDate',
        predicate: (ad, value) => {
          if (!value || value === 'Filter by Expiry Date' || !ad.endDate) return true;

          const endDate = new Date(ad.endDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (value === 'Today') {
            const adEndDate = new Date(endDate);
            adEndDate.setHours(0, 0, 0, 0);
            return adEndDate.getTime() === today.getTime();
          } else if (value === 'Last 7 days') {
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            return endDate >= sevenDaysAgo && endDate <= today;
          }

          return true;
        },
        defaultValue: 'Filter by Expiry Date'
      },
      {
        key: 'status',
        predicate: (ad, value) => {
          if (!value || value === 'Filter by Status') return true;
          return ad.status.toLowerCase() === (value as string).toLowerCase();
        },
        defaultValue: 'Filter by Status'
      },
      {
        key: 'performance',
        predicate: (ad, value) => {
          if (!value || value === 'Filter by Performance') return true;
          if (value === 'Top Performing') return ad.ctr >= 5;
          if (value === 'High CTR') return ad.ctr >= 2;
          if (value === 'Low CTR') return ad.ctr < 2;
          return true;
        },
        defaultValue: 'Filter by Performance'
      }
    ]
  });

  useEffect(() => {
    loadAdvertisements();
  }, []);

  const loadAdvertisements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdvertisements();
      setAdvertisements(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load advertisements');
      console.error('Error loading advertisements:', err);
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
      await deleteAdvertisement(deleteId);
      setShowConfirm(false);
      setShowSuccess(true);
      // Reload advertisements after successful deletion
      loadAdvertisements();
    } catch (err: any) {
      console.error('Error deleting advertisement:', err);
      alert(err.message || 'Failed to delete advertisement');
      setShowConfirm(false);
    }
  };

  const getStatusClass = (status: string) =>
    status === "active"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  // Apply search on top of filtered results
  const filteredAdvertisements = useMemo(() => {
    if (!searchQuery) return filteredByFilters;

    const query = searchQuery.toLowerCase();
    return filteredByFilters.filter((ad) =>
      ad.title.toLowerCase().includes(query)
    );
  }, [filteredByFilters, searchQuery]);

  const handleClearFilters = () => {
    setSearchQuery("");
    clearAllFilters();
  };

  if (loading) {
    return (
      <div className="bg-bb-bg min-h-screen p-6 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading advertisements..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-bb-bg min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadAdvertisements}
            className="bg-bb-primary px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bb-bg min-h-screen p-6 space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Advertisements</h1>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search
              className="absolute right-3 top-1/2 -translate-y-1/2"
              size={16}
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
              onClick={() => navigate("/marketing/advertisements/add")}
              className="bg-black text-white px-4 py-2 rounded"
            >
              Add New
            </button>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex justify-end gap-2">
        <div className="w-[15%]">
          <Select
            value={filterValues.expiryDate as string}
            onChange={(value) => setFilterValue('expiryDate', value)}
            options={[
              {
                label: "Filter by Expiry Date",
                value: "Filter by Expiry Date",
              },
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
        <div className="w-[15%]">
          <Select
            value={filterValues.performance as string}
            onChange={(value) => setFilterValue('performance', value)}
            options={[
              { label: "Filter by Performance", value: "Filter by Performance" },
              { label: "Top Performing", value: "Top Performing" },
              { label: "High CTR", value: "High CTR" },
              { label: "Low CTR", value: "Low CTR" },
            ]}
          />
        </div>
        <button
          onClick={handleClearFilters}
          className="bg-yellow-400 px-4 py-2 rounded border"
        >
          Clear
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: '1100px' }}>
          <thead className="bg-[#FFE08A]">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Discounts</th>
              <th className="px-4 py-3 text-right">Impressions</th>
              <th className="px-4 py-3 text-right">Clicks</th>
              <th className="px-4 py-3 text-right">CTR</th>
              <th className="px-4 py-3 text-right">Conversions</th>
              <th className="px-4 py-3 text-right">Conv. Rate</th>
              <th className="px-4 py-3">Validity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredAdvertisements.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  {advertisements.length === 0
                    ? "No advertisements found"
                    : "No advertisements match your filters"}
                </td>
              </tr>
            ) : (
              filteredAdvertisements.map((ad, index) => (
                <tr
                  key={ad.id}
                  className={`cursor-pointer hover:bg-yellow-50 ${index % 2 === 0 ? "bg-white" : "bg-[#FFF9ED]"}`}
                  onClick={() => navigate(`/marketing/advertisements/view/${ad.id}`)}
                >
                  <td className="px-4 py-3 font-medium">{ad.title}</td>
                  <td className="px-4 py-3">
                    {ad.linkedDiscounts.length > 0
                      ? ad.linkedDiscounts.map(d => d.code).join(", ")
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{formatNumber(ad.impressions)}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatNumber(ad.clicks)}</td>
                  <td className="px-4 py-3 text-right font-mono">{ad.ctr}%</td>
                  <td className="px-4 py-3 text-right font-mono">{formatNumber(ad.conversions)}</td>
                  <td className="px-4 py-3 text-right font-mono">{ad.conversionRate}%</td>
                  <td className="px-4 py-3">{formatDate(ad.endDate)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(
                        ad.status,
                      )}`}
                    >
                      {ad.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <Actions
                      actions={[
                        "view",
                        ...(canUpdate ? ["edit" as const] : []),
                        ...(canDelete ? ["delete" as const] : []),
                      ]}
                      onView={() => navigate(`/marketing/advertisements/view/${ad.id}`)}
                      onEdit={() =>
                        navigate(`/marketing/advertisements/edit/${ad.id}`)
                      }
                      onDelete={() => handleDeleteClick(ad.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination />
      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl w-[420px] p-6 relative text-center">
            {/* Close */}
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute right-4 top-4 text-gray-500 text-xl"
            >
              ✕
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <div className="flex justify-center mb-4">
                  <img src={deleteIcon} alt="delete" className="w-16 h-16" />
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-2">Delete</h2>

            <p className="text-sm text-gray-600 mb-6">
              This action cannot be undone. Do you want to proceed with
              deletion?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="border px-6 py-2 rounded border-black"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setShowDeletedModal(true);
                }}
                className="bg-yellow-400 px-6 py-2 rounded"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

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
          Advertisement has been successfully deleted.
        </p>
      </Modal>
    </div>
  );
}
