import { useState, useEffect } from "react";
import PaymentOptionsTable from "../payment-options/PaymentOptionsTable";
import AddPaymentModal from "../Common/AddPaymentModal";
import { getPaymentOptions, PaymentOption } from "../../services/settingsService";
import { showUpdatedSweetAlert } from "../../utils/swalAlerts";

const PaymentOptionsPage = () => {
  const [openModal, setOpenModal] = useState(false);
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [options, setOptions] = useState<PaymentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentOptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPaymentOptions();
      if (response.success) {
        setOptions(response.data || []);
      } else {
        setError("Failed to load payment options");
      }
    } catch (err) {
      console.error("Error fetching payment options:", err);
      setError("Failed to load payment options");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentOptions();
  }, []);

  const handlePaymentAdded = () => {
    setShowAddSuccess(true);
    fetchPaymentOptions(); // Refresh the list
  };

  const handlePaymentUpdated = async () => {
    await showUpdatedSweetAlert({
      title: "Payment Mode Updated",
      message: "Payment Mode Details Updated Successfully!",
    });
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">
          Payment Options
        </h2>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-black text-white px-4 py-2 rounded-md text-sm w-full sm:w-auto"
        >
          Add New
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-md p-8 text-center">
          <p className="text-gray-600">Loading payment options...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <PaymentOptionsTable
          options={options}
          onRefresh={fetchPaymentOptions}
          onUpdatedSuccess={handlePaymentUpdated}
        />
      )}

      {/* Add Payment Modal */}
      <AddPaymentModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={handlePaymentAdded}
      />

      {/* ================= SUCCESS MODAL ================= */}
      {showAddSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 text-center w-full max-w-sm relative">
            <button
              onClick={() => setShowAddSuccess(false)}
              className="absolute top-3 right-3 text-gray-400"
            >
              ✕
            </button>

            <h3 className="text-lg sm:text-xl font-bold mb-2">
              Payment Mode Added
            </h3>

            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl sm:text-3xl">
                ✓
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Payment Mode Added Successfully!
            </p>
          </div>
        </div>
      )}

    </>
  );
};

export default PaymentOptionsPage;
