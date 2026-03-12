import { MoreVertical, Pencil, Trash2, Eye, LogIn } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Modal from "../../../components/ui/Modal";
import CreateBranchModal from "../../../components/Branches/CreateBranchModal";
import tickImg from "../../../assets/tick.png";
import deleteIcon from "../../../assets/deleteConformImg.png";
import { getBranches, deleteBranch, updateBranch, BranchResponse } from "../../../services/branchService";
import { SearchInput } from "../../../components/Common";

const BranchesPage = () => {
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [editBranch, setEditBranch] = useState<BranchResponse | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Status toggle state
  const [toggleId, setToggleId] = useState<string | null>(null);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ================= LOAD BRANCHES =================
  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBranches();
      if (response.success && response.data) {
        setBranches(response.data.branches);
      } else {
        setError(response.error?.message || "Failed to load branches");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load branches");
      console.error("Error loading branches:", err);
    } finally {
      setLoading(false);
    }
  };

  // ================= ACTIONS =================

  const handleEdit = (branch: BranchResponse) => {
    setEditBranch(branch);
    setOpenModal(true);
    setOpenMenu(null);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowConfirm(true);
    setOpenMenu(null);
  };

  const handleView = (branch: BranchResponse) => {
    // Reuse modal for now; dedicated view page can be wired later.
    setEditBranch(branch);
    setOpenModal(true);
    setOpenMenu(null);
  };

  const handleLogin = (branch: BranchResponse) => {
    setOpenMenu(null);
    setSuccessMessage(`Login to branch "${branch.name}" is not configured yet.`);
    setShowSuccess(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteBranch(deleteId);
      await loadBranches(); // Refresh list
      setShowConfirm(false);
      setSuccessMessage("Branch has been successfully removed.");
      setShowSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to delete branch");
      setShowConfirm(false);
    }
  };

  const handleBranchSaved = () => {
    setOpenModal(false);
    setEditBranch(null);
    loadBranches(); // Refresh list
    setSuccessMessage(editBranch ? "Branch updated successfully." : "New branch added successfully.");
    setShowSuccess(true);
  };

  const toggleStatus = (id: string) => {
    const branch = branches.find((b) => b.id === id);
    if (!branch) return;

    // If deactivating, show confirmation modal
    if (branch.status === "active") {
      setToggleId(id);
      setShowToggleConfirm(true);
    } else {
      // Activating doesn't need confirmation
      confirmToggle(id);
    }
  };

  const confirmToggle = async (id?: string) => {
    const branchId = id || toggleId;
    if (!branchId) return;

    const branch = branches.find((b) => b.id === branchId);
    if (!branch) return;

    const newStatus = branch.status === "active" ? "inactive" : "active";

    try {
      setToggling(true);
      setError(null);
      const response = await updateBranch(branchId, { status: newStatus });
      if (response.success) {
        setBranches((prev) =>
          prev.map((b) => (b.id === branchId ? { ...b, status: newStatus } : b))
        );
        setSuccessMessage(
          `Branch has been ${newStatus === "active" ? "activated" : "deactivated"} successfully.`
        );
        setShowSuccess(true);
      } else {
        setError(response.error?.message || "Failed to update branch status");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update branch status");
      console.error("Error toggling branch status:", err);
    } finally {
      setToggling(false);
      setShowToggleConfirm(false);
      setToggleId(null);
    }
  };

  // Filtered branches based on search and status
  const filteredBranches = useMemo(() => {
    return branches.filter((branch) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.phone?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "" || branch.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [branches, searchQuery, statusFilter]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
  };

  return (
    <>
      <div className="rounded-xl border bg-white p-4 sm:p-6 space-y-5">
        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="text-center py-8 text-gray-500">
            Loading branches...
          </div>
        )}

        {/* HEADER */}
        {!loading && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Branch Listing
            </h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              placeholder="Search branches..."
              onSearch={setSearchQuery}
              className="w-full sm:w-64"
            />

            <button
              onClick={() => {
                setEditBranch(null);
                setOpenModal(true);
              }}
              className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add New
            </button>
          </div>
          </div>
        )}

        {/* FILTERS */}
        {!loading && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end lg:items-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border px-3 py-2 rounded-md text-sm w-full sm:w-auto"
          >
            <option value="">Filter by Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={handleClearFilters}
            className="bg-yellow-400 px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
          >
            Clear
          </button>
          </div>
        )}

        {/* TABLE */}
        {!loading && (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[900px] rounded-xl border overflow-x-hidden bg-white">
              <table className="w-full text-sm">
                <thead className="bg-yellow-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Sl. No.</th>
                    <th className="px-4 py-3 text-left font-medium">Branch</th>
                    <th className="px-4 py-3 text-left font-medium">Branch Address</th>
                    <th className="px-4 py-3 text-left font-medium">Contact Details</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBranches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        No branches found. {(searchQuery || statusFilter) && "Try adjusting your filters."}
                      </td>
                    </tr>
                  ) : (
                    filteredBranches.map((branch, index) => (
                      <tr
                        key={branch.id}
                        className="border-b last:border-b-0 even:bg-[#FFF8E7]"
                      >
                        <td className="px-4 py-4 align-middle">{index + 1}</td>

                        <td className="px-4 py-4 align-middle font-medium">{branch.name}</td>

                        <td className="px-4 py-4 align-middle">{branch.address || "N/A"}</td>

                        <td className="px-4 py-4 align-middle text-xs">
                          <p>{branch.email}</p>
                          <p className="text-gray-500">{branch.phone || "N/A"}</p>
                        </td>

                        {/* STATUS */}
                        <td className="px-4 py-4 align-middle">
                          <button
                            onClick={() => toggleStatus(branch.id)}
                            className={`relative inline-flex h-5 w-10 items-center rounded-full ${
                              branch.status === "active" ? "bg-green-500" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`h-4 w-4 bg-white rounded-full transition transform ${
                                branch.status === "active" ? "translate-x-5" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-4 py-4 align-middle">
                          <div className="flex justify-end relative">
                            <button
                              onClick={() =>
                                setOpenMenu(openMenu === branch.id ? null : branch.id)
                              }
                              className="p-2 rounded-md hover:bg-gray-100"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {openMenu === branch.id && (
                              <div className="absolute right-4 top-10 bg-white border rounded-md shadow-md w-32 z-10">
                                <button
                                  onClick={() => handleView(branch)}
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                                >
                                  <Eye size={14} />
                                  View
                                </button>

                                <button
                                  onClick={() => handleLogin(branch)}
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                                >
                                  <LogIn size={14} />
                                  Login
                                </button>

                                <button
                                  onClick={() => handleEdit(branch)}
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                                >
                                  <Pencil size={14} />
                                  Edit
                                </button>

                                <button
                                  onClick={() => handleDeleteClick(branch.id)}
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left text-red-600"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ================= CREATE / EDIT MODAL ================= */}
      {openModal && (
        <CreateBranchModal
          defaultValues={editBranch}
          onClose={() => {
            setOpenModal(false);
            setEditBranch(null);
          }}
          onSave={handleBranchSaved}
        />
      )}

      {/* ================= DELETE CONFIRM ================= */}
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

      {/* ================= DEACTIVATE CONFIRM ================= */}
      <Modal
        open={showToggleConfirm}
        onClose={() => {
          setShowToggleConfirm(false);
          setToggleId(null);
        }}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Deactivate Branch</h2>

        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to deactivate this branch?
          <br />
          Deactivated branches will not be available for operations.
        </p>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              setShowToggleConfirm(false);
              setToggleId(null);
            }}
            className="border px-6 py-2 rounded"
            disabled={toggling}
          >
            Cancel
          </button>

          <button
            onClick={() => confirmToggle()}
            className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={toggling}
          >
            {toggling ? "Deactivating..." : "Yes, Deactivate"}
          </button>
        </div>
      </Modal>

      {/* ================= SUCCESS ================= */}
      <Modal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Success</h2>

        <div className="flex justify-center mb-4">
          <img src={tickImg} alt="success" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">{successMessage}</p>
      </Modal>
    </>
  );
};

export default BranchesPage;
