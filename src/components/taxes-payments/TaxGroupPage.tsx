import { useState, useEffect } from "react";
import TaxGroupTable from "../tax-group/TaxGroupTable";
import AddTaxGroupModal from "../tax-group/AddTaxGroupModal";
import { getTaxGroups, TaxGroup } from "../../services/settingsService";

const TaxGroupPage = () => {
  const [openModal, setOpenModal] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchTaxGroups();
  }, []);

  const handleTaxGroupCreated = () => {
    setShowCreateSuccess(true);
    fetchTaxGroups();
  };

  const refreshTaxGroups = () => {
    fetchTaxGroups();
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <h2 className="text-4xl font-extrabold tracking-tight">
          Tax Group
        </h2>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-black text-white px-6 py-2.5 rounded-md text-sm w-full sm:w-auto"
        >
          Add New
        </button>
      </div>

      {loading && <p className="text-gray-600">Loading tax groups...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* Table */}
      {!loading && !error && (
        <TaxGroupTable
          groups={taxGroups}
          onEditSuccess={refreshTaxGroups}
          onDeleteSuccess={refreshTaxGroups}
        />
      )}

      {/* Add Tax Group Modal */}
      <AddTaxGroupModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={handleTaxGroupCreated}
      />

      {/* ================= SUCCESS MODAL ================= */}
      {showCreateSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 text-center w-full max-w-sm relative">
            <button
              onClick={() => setShowCreateSuccess(false)}
              className="absolute top-3 right-3 text-gray-400"
            >
              ✕
            </button>

            <h3 className="text-lg sm:text-xl font-bold mb-2">
              Tax Group Created
            </h3>

            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl sm:text-3xl">
                ✓
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Tax Group Created Successfully!
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default TaxGroupPage;
