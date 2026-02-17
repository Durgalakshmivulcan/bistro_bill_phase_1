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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Tax </h2>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-black text-white px-4 py-2 rounded-md text-sm"
        >
          Add New
        </button>
      </div>

      {loading && <p className="text-gray-600">Loading taxes...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && <TaxTable taxes={taxes} onTaxDeleted={handleTaxDeleted} onTaxUpdated={handleTaxUpdated} />}
      <AddTaxModal open={openModal} onClose={() => setOpenModal(false)} onSuccess={handleTaxAdded} />
    </>
  );
}
