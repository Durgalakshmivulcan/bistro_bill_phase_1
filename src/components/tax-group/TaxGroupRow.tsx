import { useState, useEffect } from "react";
import ActionMenu from "../Common/ActionMenu";
import Modal from "../ui/Modal";
import { deleteTaxGroup, updateTaxGroup, getTaxes, Tax, TaxGroup } from "../../services/settingsService";
import { CRUDToasts } from "../../utils/toast";

type Props = {
  group: TaxGroup;
  onEditSuccess: () => void;
  onDeleteSuccess: () => void;
};

const TaxGroupRow: React.FC<Props> = ({
  group,
  onEditSuccess,
  onDeleteSuccess,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);

  const [groupName, setGroupName] = useState("");
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>([]);
  const [availableTaxes, setAvailableTaxes] = useState<Tax[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingTaxes, setLoadingTaxes] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showEditModal) {
      setGroupName(group.name);
      // Extract tax IDs from taxGroupItems
      const taxIds = group.taxGroupItems?.map(item => item.taxId) || [];
      setSelectedTaxIds(taxIds);
      fetchTaxes();
    }
  }, [showEditModal, group]);

  const fetchTaxes = async () => {
    try {
      setLoadingTaxes(true);
      const response = await getTaxes({ status: 'active' });
      if (response.success && response.data) {
        setAvailableTaxes(response.data);
      }
    } catch (err) {
      console.error('Error fetching taxes:', err);
    } finally {
      setLoadingTaxes(false);
    }
  };

  const handleTaxToggle = (taxId: string) => {
    setSelectedTaxIds(prev =>
      prev.includes(taxId)
        ? prev.filter(id => id !== taxId)
        : [...prev, taxId]
    );
  };

  const handleEdit = async () => {
    if (!groupName.trim()) {
      setError("Please enter a group name");
      return;
    }

    if (selectedTaxIds.length === 0) {
      setError("Please select at least one tax");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await updateTaxGroup(group.id, {
        name: groupName,
        taxIds: selectedTaxIds,
      });

      if (response.success) {
        CRUDToasts.updated("Tax Group");
        setShowEditModal(false);
        setShowEditSuccess(true);
        onEditSuccess();
      } else {
        setError(response.message || 'Failed to update tax group');
      }
    } catch (err) {
      setError('An error occurred while updating the tax group');
      console.error('Error updating tax group:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      const response = await deleteTaxGroup(group.id);

      if (response.success) {
        CRUDToasts.deleted("Tax Group");
        setShowDeleteConfirm(false);
        setShowDeleteSuccess(true);
        onDeleteSuccess();
      } else {
        setError(response.message || 'Failed to delete tax group');
      }
    } catch (err) {
      setError('An error occurred while deleting the tax group');
      console.error('Error deleting tax group:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseEditModal = () => {
    setGroupName("");
    setSelectedTaxIds([]);
    setError(null);
    setShowEditModal(false);
  };

  // Get tax names for display
  const getTaxNames = () => {
    if (!group.taxGroupItems || group.taxGroupItems.length === 0) {
      return "No taxes";
    }
    return group.taxGroupItems.map(item => item.tax.name).join(", ");
  };

  return (
    <>
      <tr className="border-b last:border-none">
        <td className="px-4 py-3">{group.name}</td>
        <td className="px-4 py-3">{getTaxNames()}</td>
        <td className="px-4 py-3">
          <ActionMenu
            onEdit={() => setShowEditModal(true)}
            onDelete={() => setShowDeleteConfirm(true)}
          />
        </td>
      </tr>

      {/* ================= EDIT TAX GROUP MODAL ================= */}
      <Modal open={showEditModal} onClose={handleCloseEditModal}>
        <h2 className="text-2xl font-bold mb-6">
          Edit Tax Group
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Tax Group Name <span className="text-red-500">*</span>
            </label>
            <input
              placeholder="Cascading Tax"
              className="w-full border rounded-md px-3 py-2"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Select Taxes <span className="text-red-500">*</span>
            </label>
            {loadingTaxes ? (
              <p className="text-sm text-gray-600">Loading taxes...</p>
            ) : (
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                {availableTaxes.length === 0 ? (
                  <p className="text-sm text-gray-600">No taxes available. Please create taxes first.</p>
                ) : (
                  availableTaxes.map((tax) => (
                    <label key={tax.id} className="flex items-center gap-2 mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTaxIds.includes(tax.id)}
                        onChange={() => handleTaxToggle(tax.id)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{tax.name} ({tax.percentage}%)</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={handleCloseEditModal}
            className="border px-6 py-2 rounded-md"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={handleEdit}
            className="bg-yellow-400 px-6 py-2 rounded-md font-medium disabled:opacity-50"
            disabled={loading || loadingTaxes}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Modal>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 w-full max-w-sm relative">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-3 right-3 text-gray-400"
              disabled={deleting}
            >
              ✕
            </button>

            <h3 className="text-lg sm:text-xl font-bold mb-2">
              Delete Tax Group
            </h3>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "{group.name}"? This action cannot be undone.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE SUCCESS MODAL ================= */}
      {showDeleteSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 text-center w-full max-w-sm relative">
            <button
              onClick={() => setShowDeleteSuccess(false)}
              className="absolute top-3 right-3 text-gray-400"
            >
              ✕
            </button>

            <h3 className="text-lg sm:text-xl font-bold mb-2">
              Tax Group Deleted
            </h3>

            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl sm:text-3xl">
                ✓
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Tax Group Deleted Successfully!
            </p>
          </div>
        </div>
      )}

      {/* ================= EDIT SUCCESS MODAL ================= */}
      {showEditSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 text-center w-full max-w-sm relative">
            <button
              onClick={() => setShowEditSuccess(false)}
              className="absolute top-3 right-3 text-gray-400"
            >
              ✕
            </button>

            <h3 className="text-lg sm:text-xl font-bold mb-2">
              Tax Group Updated
            </h3>

            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl sm:text-3xl">
                ✓
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Tax Group Updated Successfully!
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default TaxGroupRow;
