import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Actions from "../form/ActionButtons";
import Pagination from "../Common/Pagination";
import MasterDataNavTabs from "../NavTabs/MasterDataNavTabs";
import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import { getTaxes, deleteTax, Tax } from "../../services/settingsService";

// Images
import deleteConfirmImg from "../../assets/deleteConformImg.png";
import deleteSuccessImg from "../../assets/deleteSuccessImg.png";

const MasterTaxPage = () => {
  const navigate = useNavigate();

  // Data state
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [deleteItem, setDeleteItem] = useState<Tax | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch taxes from API
  useEffect(() => {
    fetchTaxes();
  }, []);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTaxes();
      if (response.success && response.data) {
        setTaxes(response.data);
      } else {
        setError(response.message || 'Failed to fetch taxes');
      }
    } catch (err) {
      setError('An error occurred while fetching taxes');
      console.error('Error fetching taxes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      setDeleting(true);
      const response = await deleteTax(deleteItem.id);
      if (response.success) {
        setShowConfirm(false);
        setShowSuccess(true);
        // Refresh list after successful deletion
        fetchTaxes();
      } else {
        setError(response.message || 'Failed to delete tax');
        setShowConfirm(false);
      }
    } catch (err) {
      setError('An error occurred while deleting tax');
      console.error('Error deleting tax:', err);
      setShowConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  // Filter taxes based on search term
  const filteredTaxes = taxes.filter((tax) =>
    tax.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tax.symbol && tax.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 bg-bb-bg min-h-screen p-4 sm:p-6">
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
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:justify-end">
          <button
            className="bg-yellow-400 px-5 py-2 rounded-md border border-black text-sm font-medium w-full sm:w-auto"
            onClick={() => setSearchTerm("")}
          >
            Clear
          </button>

          <button
            className="bg-black text-white px-5 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
            onClick={() => navigate("/master-data/taxes/create")}
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
          <p className="text-gray-600">Loading taxes...</p>
        </div>
      )}

      {/* TABLE */}
      {!loading && !error && (
        <div className="overflow-x-auto bg-white rounded-lg border">
          {filteredTaxes.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              {searchTerm ? `No taxes found matching "${searchTerm}"` : 'No taxes found. Click "Add New" to create one.'}
            </div>
          ) : (
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead className="bg-yellow-400">
                <tr>
                  <th className="px-4 py-3 text-left">Tax Name</th>
                  <th className="px-4 py-3 text-left">Symbol</th>
                  <th className="px-4 py-3 text-left">Percentage</th>
                  <th className="px-4 py-3 text-left">Country</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTaxes.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b odd:bg-white even:bg-[#FFF8E7]"
                  >
                    <td className="px-4 py-3 font-medium">{item.name}</td>

                    <td className="px-4 py-3 font-medium">{item.symbol || '-'}</td>

                    <td className="px-4 py-3 font-medium">{item.percentage}%</td>

                    <td className="px-4 py-3 font-medium">{item.country || '-'}</td>

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
          <h2 className="text-2xl font-bold mb-4">Delete Tax</h2>

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
            Tax record has been successfully removed.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default MasterTaxPage;
