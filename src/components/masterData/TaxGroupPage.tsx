import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Actions from "../form/ActionButtons";
import Pagination from "../Common/Pagination";
import MasterDataNavTabs from "../NavTabs/MasterDataNavTabs";
import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import { getTaxGroups, deleteTaxGroup, TaxGroup } from "../../services/settingsService";

// Images
import deleteConfirmImg from "../../assets/deleteConformImg.png";
import deleteSuccessImg from "../../assets/deleteSuccessImg.png";

const MasterTaxGroupPage = () => {
  const navigate = useNavigate();

  // Data state
  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("");

  // Modal state
  const [deleteItem, setDeleteItem] = useState<TaxGroup | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch tax groups from API
  useEffect(() => {
    fetchTaxGroups();
  }, []);

  const fetchTaxGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTaxGroups();
      if (response.success && response.data) {
        setTaxGroups(response.data);
      } else {
        setError(response.message || 'Failed to fetch tax groups');
      }
    } catch (err) {
      setError('An error occurred while fetching tax groups');
      console.error('Error fetching tax groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      setDeleting(true);
      const response = await deleteTaxGroup(deleteItem.id);
      if (response.success) {
        setShowConfirm(false);
        setShowSuccess(true);
        // Refresh list after successful deletion
        fetchTaxGroups();
      } else {
        setError(response.message || 'Failed to delete tax group');
        setShowConfirm(false);
      }
    } catch (err) {
      setError('An error occurred while deleting tax group');
      console.error('Error deleting tax group:', err);
      setShowConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  // Filter tax groups based on search term
  const filteredTaxGroups = taxGroups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (countryFilter ? group.taxGroupItems?.some(i => (i.tax.country || "").toLowerCase() === countryFilter.toLowerCase()) : true)
  );

  const countryOptions = Array.from(
    new Set(
      taxGroups.flatMap(g =>
        g.taxGroupItems?.map(i => i.tax.country || "").filter(Boolean) || []
      )
    )
  );

  return (
    <div className="space-y-6 min-h-screen p-4 sm:p-6">
      {/* TABS */}
      <MasterDataNavTabs />

      {/* SEARCH + ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* SEARCH */}
        <div className="relative w-full md:w-80">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            placeholder="Search here..."
            className="w-full border rounded-md px-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:justify-end items-stretch sm:items-center">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 text-sm bg-white min-w-[180px]"
          >
            <option value="">Filter by Country</option>
            {countryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            className="bg-yellow-400 px-5 py-2 rounded-md border border-black text-sm font-medium w-full sm:w-auto"
            onClick={() => { setSearchTerm(""); setCountryFilter(""); }}
          >
            Clear
          </button>

          <button
            className="bg-black text-white px-5 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
            onClick={() => navigate("/master-data/taxgroup/create")}
          >
            Add New
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-gray-600">Loading tax groups...</p>
        </div>
      )}

      {/* TABLE */}
      {!loading && !error && (
        <div className="overflow-x-auto bg-white rounded-lg border shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
          {filteredTaxGroups.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              {searchTerm ? `No tax groups found matching "${searchTerm}"` : 'No tax groups found. Click "Add New" to create one.'}
            </div>
          ) : (
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead className="bg-yellow-400">
                <tr>
                  <th className="px-4 py-3 text-left">Tax Group Name</th>
                  <th className="px-4 py-3 text-left">Symbol</th>
                  <th className="px-4 py-3 text-left">Percentage</th>
                  <th className="px-4 py-3 text-left">Country</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTaxGroups.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b odd:bg-white even:bg-[#FFF8E7]"
                  >
                    <td className="px-4 py-3 font-medium">{item.name}</td>

                    <td className="px-4 py-3 font-medium">
                      {item.symbol || (item.taxGroupItems?.map(i => i.tax.symbol || i.tax.name).join(' + ') || '-')}
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {(item.percentage ?? item.taxGroupItems?.reduce((sum, i) => sum + i.tax.percentage, 0) ?? 0)}%
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {item.country || item.taxGroupItems?.[0]?.tax.country || "-"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Actions
                        actions={["edit", "delete"]}
                        onEdit={() => navigate(`edit/${item.id}`)}
                        onDelete={() => {
                          setDeleteItem(item);
                          setShowConfirm(true);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* PAGINATION */}
      <Pagination />

      {/* DELETE CONFIRM MODAL */}
      {showConfirm && deleteItem && (
        <Modal
          open={showConfirm}
          onClose={() => {
            setShowConfirm(false);
            setDeleteItem(null);
          }}
          className="w-[90%] max-w-md p-6 text-center z-[9999]"
        >
          <h2 className="text-2xl font-bold mb-4">Delete Tax Group</h2>

          <div className="flex justify-center mb-4">
            <img src={deleteConfirmImg} alt="delete" className="w-16 h-16" />
          </div>

          <p className="text-sm text-gray-600 mb-6">
            This action cannot be undone. <br />
            Are you sure you want to delete{" "}
            <span className="font-medium">{deleteItem.name}</span>?
          </p>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setShowConfirm(false);
                setDeleteItem(null);
              }}
              className="border px-6 py-2 rounded"
              disabled={deleting}
            >
              Cancel
            </button>

            <button
              onClick={handleDelete}
              className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Yes'}
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
            setDeleteItem(null);
          }}
          className="w-[90%] max-w-md p-6 text-center z-[9999]"
        >
          <h2 className="text-2xl font-bold mb-4">Deleted!</h2>

          <div className="flex justify-center mb-4">
            <img src={deleteSuccessImg} alt="success" className="w-16 h-16" />
          </div>

          <p className="text-sm text-gray-600">
            Tax group has been successfully removed.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default MasterTaxGroupPage;
