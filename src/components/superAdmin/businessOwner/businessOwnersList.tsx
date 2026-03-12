import { Search } from "lucide-react";
import Select from "../../form/Select";
import { useNavigate } from "react-router-dom";
import Actions from "../../form/ActionButtons";
import { useState, useEffect, useCallback } from "react";
import SuccessModal from "../../ui/SuccessModal";
import Modal from "../../ui/Modal";
import {
  getBusinessOwners,
  deleteBusinessOwnerApi,
  BusinessOwnerListItem,
} from "../../../services/superAdminService";
import { Pagination } from "../../Common";

export interface BusinessOwner {
  id: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string | null;
  businessType: string | null;
  country: string | null;
  plan: string;
  nextBilling: string;
  status: string;
  avatar: string | null;
}

function mapToRow(item: BusinessOwnerListItem): BusinessOwner {
  return {
    id: item.id,
    restaurantName: item.restaurantName,
    ownerName: item.ownerName,
    email: item.email,
    phone: item.phone,
    businessType: item.businessType,
    country: item.country,
    plan: item.plan?.name || "—",
    nextBilling: item.subscriptionEndDate
      ? new Date(item.subscriptionEndDate).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—",
    status: item.status === "active" ? "Active" : "Inactive",
    avatar: item.avatar,
  };
}

export default function BusinessOwnersList() {
  const navigate = useNavigate();

  // Data state
  const [owners, setOwners] = useState<BusinessOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Delete flow
  const [deleteOwner, setDeleteOwner] = useState<BusinessOwner | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [success, setSuccess] = useState({
    open: false,
    title: "",
    message: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusMap: Record<string, string> = {
        Active: "active",
        Inactive: "inactive",
      };
      const response = await getBusinessOwners({
        search: searchTerm || undefined,
        status: statusFilter ? statusMap[statusFilter] : undefined,
        page,
        limit: 10,
      });
      if (response.success && response.data) {
        setOwners(response.data.businessOwners.map(mapToRow));
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError(response.message || "Failed to load business owners");
      }
    } catch {
      setError("Failed to load business owners");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteOwner) return;
    setDeleting(true);
    try {
      const response = await deleteBusinessOwnerApi(deleteOwner.id);
      if (response.success) {
        setShowConfirm(false);
        setShowSuccess(true);
        loadData();
      } else {
        setError(response.message || "Failed to delete");
        setShowConfirm(false);
      }
    } catch {
      setError("Failed to delete business owner");
      setShowConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setBusinessTypeFilter("");
    setPlanFilter("");
    setStatusFilter("");
    setCountryFilter("");
    setPage(1);
  };

  // Client-side extra filters (businessType, plan, country not supported as backend query params yet)
  const filteredOwners = owners.filter((o) => {
    if (businessTypeFilter && o.businessType !== businessTypeFilter) return false;
    if (planFilter && o.plan !== planFilter) return false;
    if (countryFilter && o.country !== countryFilter) return false;
    return true;
  });

  return (
    <div className="bg-bb-bg min-h-screen p-6 space-y-4">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-xl font-bold">Business Owners List</h1>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full lg:w-64">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            />
            <input
              placeholder="Search here..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full border rounded-md bg-bb-bg px-3 pr-10 py-2 text-sm"
            />
          </div>

          <button className="border px-4 py-2 rounded text-sm">Export</button>

          <button
            className="bg-black text-white px-4 py-2 rounded text-sm"
            onClick={() => navigate("/businessowners/create")}
          >
            Add New
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap gap-3 justify-end">
        <div className="w-full sm:w-[48%] md:w-[30%] lg:w-[15%]">
          <Select
            value={businessTypeFilter || "Filter by Business Type"}
            onChange={(v) => {
              setBusinessTypeFilter(v === "Filter by Business Type" ? "" : v);
            }}
            options={[
              { label: "Filter by Business Type", value: "Filter by Business Type" },
              { label: "Casual Dining", value: "Casual Dining" },
              { label: "Take Away", value: "Take Away" },
            ]}
          />
        </div>

        <div className="w-full sm:w-[48%] md:w-[30%] lg:w-[15%]">
          <Select
            value={planFilter || "Filter by Plan"}
            onChange={(v) => {
              setPlanFilter(v === "Filter by Plan" ? "" : v);
            }}
            options={[
              { label: "Filter by Plan", value: "Filter by Plan" },
              { label: "Free", value: "Free" },
              { label: "Gold", value: "Gold" },
              { label: "Platinum", value: "Platinum" },
            ]}
          />
        </div>

        <div className="w-full sm:w-[48%] md:w-[30%] lg:w-[15%]">
          <Select
            value={statusFilter || "Filter by Status"}
            onChange={(v) => {
              setStatusFilter(v === "Filter by Status" ? "" : v);
              setPage(1);
            }}
            options={[
              { label: "Filter by Status", value: "Filter by Status" },
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
            ]}
          />
        </div>

        <div className="w-full sm:w-[48%] md:w-[30%] lg:w-[15%]">
          <Select
            value={countryFilter || "Filter by Country"}
            onChange={(v) => {
              setCountryFilter(v === "Filter by Country" ? "" : v);
            }}
            options={[
              { label: "Filter by Country", value: "Filter by Country" },
              { label: "India", value: "India" },
            ]}
          />
        </div>

        <button
          className="bg-yellow-400 px-4 py-2 rounded text-sm"
          onClick={clearFilters}
        >
          Clear
        </button>
      </div>

      {/* LOADING / ERROR / EMPTY */}
      {loading && (
        <div className="text-center py-8 text-bb-textSoft">
          Loading business owners...
        </div>
      )}
      {error && (
        <div className="text-center py-8 text-red-500">{error}</div>
      )}
      {!loading && !error && filteredOwners.length === 0 && (
        <div className="text-center py-8 text-bb-textSoft">
          No business owners found
        </div>
      )}

      {/* TABLE */}
      {!loading && !error && filteredOwners.length > 0 && (
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-yellow-400">
              <tr>
                <th className="px-4 py-3 text-left">Restaurant Name</th>
                <th className="px-4 py-3 text-left">Owner's Name</th>
                <th className="px-4 py-3 text-left">Contact Details</th>
                <th className="px-4 py-3">Business Type</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Next Billing</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredOwners.map((o) => (
                <tr key={o.id} className="border-t odd:bg-white even:bg-bb-bg">
                  <td className="px-4 py-3 font-medium">{o.restaurantName}</td>

                  <td className="px-4 py-3 flex items-center gap-2">
                    {o.avatar ? (
                      <img src={o.avatar} className="w-8 h-8 rounded-full" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                        {o.ownerName.charAt(0)}
                      </div>
                    )}
                    {o.ownerName}
                  </td>

                  <td className="px-4 py-3 text-xs">
                    <div>{o.email}</div>
                    <div>{o.phone}</div>
                  </td>

                  <td className="px-4 py-3">{o.businessType}</td>

                  <td className="px-4 py-3">{o.country}</td>

                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">
                      {o.plan}
                    </span>
                  </td>

                  <td className="px-4 py-3">{o.nextBilling}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        o.status === "Active"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <Actions
                      actions={["view", "edit", "delete"]}
                      onView={() => navigate(`/businessowners/view/${o.id}`)}
                      onEdit={() => navigate(`/businessowners/edit/${o.id}`)}
                      onDelete={() => {
                        setDeleteOwner(o);
                        setShowConfirm(true);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-end gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="border px-3 py-1 rounded text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border px-3 py-1 rounded text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {showConfirm && (
        <Modal
          open={showConfirm}
          onClose={() => {
            setShowConfirm(false);
            setDeleteOwner(null);
          }}
          className="w-[90%] max-w-md p-6 text-center z-[9999]"
        >
          <h2 className="text-2xl font-bold mb-4">Delete</h2>

          <div className="flex justify-center mb-4">
            <img
              src={require("../../../assets/deleteConformImg.png")}
              alt="delete"
              className="w-16 h-16"
            />
          </div>

          <p className="text-sm text-gray-600 mb-6">
            This action cannot be undone. <br />
            Do you want to proceed with deletion?
          </p>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setShowConfirm(false);
                setDeleteOwner(null);
              }}
              className="border px-6 py-2 rounded"
            >
              Cancel
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Yes"}
            </button>
          </div>
        </Modal>
      )}

      {/* DELETE SUCCESS MODAL */}
      {showSuccess && (
        <Modal
          open={showSuccess}
          onClose={() => {
            setShowSuccess(false);
            setDeleteOwner(null);
          }}
          className="w-[90%] max-w-md p-6 text-center z-[9999]"
        >
          <h2 className="text-2xl font-bold mb-4">Deleted!</h2>

          <div className="flex justify-center mb-4">
            <img
              src={require("../../../assets/deleteSuccessImg.png")}
              alt="success"
              className="w-16 h-16"
            />
          </div>

          <p className="text-sm text-gray-600">
            Business owner has been successfully removed.
          </p>
        </Modal>
      )}

      {/* SUCCESS MODAL (For Create / Edit if used elsewhere) */}
      <SuccessModal
        open={success.open}
        title={success.title}
        message={success.message}
        onClose={() =>
          setSuccess({
            open: false,
            title: "",
            message: "",
          })
        }
      />
      <div className="flex justify-end mt-6">
          <Pagination />
        </div>
    </div>
  );
}
