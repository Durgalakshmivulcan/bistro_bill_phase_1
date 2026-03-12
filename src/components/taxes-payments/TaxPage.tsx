import TaxTable from "../tax/TaxTable";
import { useState, useEffect } from "react";
import AddTaxModal from "../tax/AddTaxModal";
import { getTaxes, Tax } from "../../services/settingsService";

export default function TaxPage() {
  const [openModal, setOpenModal] = useState(false);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchTaxes();
  }, []);

  const handleTaxAdded = () => {
    fetchTaxes(); // Refresh the list after adding a tax
  };

  const handleTaxDeleted = () => {
    fetchTaxes(); // Refresh the list after deleting a tax
  };

  const handleTaxUpdated = () => {
    fetchTaxes(); // Refresh the list after updating a tax
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <h2 className="text-4xl font-extrabold tracking-tight">
          Tax
        </h2>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-black text-white px-6 py-2.5 rounded-md text-sm w-full sm:w-auto"
        >
          Add New
        </button>
      </div>

      {loading && <p className="text-gray-600">Loading taxes...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <TaxTable
          taxes={taxes}
          onTaxDeleted={handleTaxDeleted}
          onTaxUpdated={handleTaxUpdated}
        />
      )}
      <AddTaxModal open={openModal} onClose={() => setOpenModal(false)} onSuccess={handleTaxAdded} />
    </>
  );
}
