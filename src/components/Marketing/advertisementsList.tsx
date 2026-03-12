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

export default function AdvertisementsList() {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { filterValues, setFilterValue, filteredItems: filteredByFilters, clearAllFilters } = useFilters({
    items: advertisements,
    filters: [
      {
        key: "expiryDate",
        predicate: (ad, value) => {
          if (!value || value === "Filter by Expiry Date" || !ad.endDate) return true;

          const endDate = new Date(ad.endDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (value === "Today") {
            const adEndDate = new Date(endDate);
            adEndDate.setHours(0, 0, 0, 0);
            return adEndDate.getTime() === today.getTime();
          } else if (value === "Last 7 days") {
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            return endDate >= sevenDaysAgo && endDate <= today;
          }

          return true;
        },
        defaultValue: "Filter by Expiry Date",
      },
      {
        key: "status",
        predicate: (ad, value) => {
          if (!value || value === "Filter by Status") return true;
          return ad.status.toLowerCase() === (value as string).toLowerCase();
        },
        defaultValue: "Filter by Status",
      },
    ],
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
      setError(err.message || "Failed to load advertisements");
      console.error("Error loading advertisements:", err);
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
      loadAdvertisements();
    } catch (err: any) {
      console.error("Error deleting advertisement:", err);
      alert(err.message || "Failed to delete advertisement");
      setShowConfirm(false);
    }
  };

  const getStatusClass = (status: string) =>
    status === "active"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const filteredAdvertisements = useMemo(() => {
    if (!searchQuery) return filteredByFilters;

    const query = searchQuery.toLowerCase();
    return filteredByFilters.filter((ad) => ad.title.toLowerCase().includes(query));
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

          <button
            onClick={() => navigate("/marketing/advertisements/add")}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Add New
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <div className="w-[15%]">
          <Select
            value={filterValues.expiryDate as string}
            onChange={(value) => setFilterValue("expiryDate", value)}
            options={[
              { label: "Filter by Expiry Date", value: "Filter by Expiry Date" },
              { label: "Today", value: "Today" },
              { label: "Last 7 days", value: "Last 7 days" },
            ]}
          />
        </div>
        <div className="w-[15%]">
          <Select
            value={filterValues.status as string}
            onChange={(value) => setFilterValue("status", value)}
            options={[
              { label: "Filter by Status", value: "Filter by Status" },
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
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

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: "1200px" }}>
          <thead className="bg-[#FFE08A]">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Applied Discount Codes</th>
              <th className="px-4 py-3 text-left">Created on</th>
              <th className="px-4 py-3">Validity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredAdvertisements.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  {advertisements.length === 0
                    ? "No advertisements found"
                    : "No advertisements match your filters"}
                </td>
              </tr>
            ) : (
              filteredAdvertisements.map((ad, index) => (
                <tr
                  key={ad.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-[#FFF9ED]"}
                >
                  <td className="px-4 py-3 font-medium">{ad.title}</td>
                  <td className="px-4 py-3">{ad.description || "N/A"}</td>
                  <td className="px-4 py-3">
                    {ad.linkedDiscounts.length > 0
                      ? ad.linkedDiscounts.map((d) => d.code).join(", ")
                      : "N/A"}
                  </td>
                  <td className="px-4 py-3">{formatDate(ad.createdAt)}</td>
                  <td className="px-4 py-3">{`${formatDate(ad.startDate)} To ${formatDate(ad.endDate)}`}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(ad.status)}`}>
                      {ad.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Actions
                      actions={["edit", "delete"]}
                      onEdit={() => navigate(`/marketing/advertisements/edit/${ad.id}`)}
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
