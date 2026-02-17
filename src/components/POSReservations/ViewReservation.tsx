import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import { getReservation, Reservation } from "../../services/reservationService";

const ViewReservation = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReservation = async () => {
      if (!id) {
        setError("Reservation ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getReservation(id);

        if (response.success && response.data) {
          setReservation(response.data);
        } else {
          setError("Reservation not found");
        }
      } catch (err) {
        setError("Failed to load reservation");
        console.error("Error fetching reservation:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [id]);

  // Helper functions for formatting
  const formatTimeTo12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${period}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="bg-bb-bg min-h-screen p-4 sm:p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bb-primary"></div>
            <p className="mt-4 text-bb-textSoft">Loading reservation...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !reservation) {
    return (
      <DashboardLayout>
        <div className="bg-bb-bg min-h-screen p-4 sm:p-6">
          <div className="bg-red-50 border border-red-300 rounded-lg p-4">
            <p className="text-red-700">{error || "Reservation not found"}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 bg-bb-text text-white px-4 py-2 rounded"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-bb-bg min-h-screen p-4 sm:p-6 space-y-6">

        {/* TITLE */}
        <h1 className="text-2xl sm:text-3xl font-bold">
          View Reservation
        </h1>

        {/* CARD */}
        <div className="bg-bb-bg rounded-xl border p-4 sm:p-6 space-y-6">

          {/* DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="text-sm font-medium">Customer Name *</label>
              <div className="mt-1 bg-gray-200 rounded-lg px-4 py-3">
                {reservation.customerName}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Email Address</label>
              <div className="mt-1 bg-gray-200 rounded-lg px-4 py-3">
                {reservation.customer?.email || "N/A"}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Phone Number *</label>
              <div className="mt-1 bg-gray-200 rounded-lg px-4 py-3">
                {reservation.customerPhone}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Reservation Date *</label>
              <div className="mt-1 bg-gray-200 rounded-lg px-4 py-3">
                {formatDate(reservation.date)}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">
                Reservation Time Slot *
              </label>
              <div className="mt-1 bg-gray-200 rounded-lg px-4 py-3">
                {formatTimeTo12Hour(reservation.startTime)} - {formatTimeTo12Hour(reservation.endTime)}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Floor / Area</label>
              <div className="mt-1 bg-gray-200 rounded-lg px-4 py-3">
                {reservation.table?.floor?.name || "N/A"}
              </div>
            </div>
          </div>

          {/* GUEST + TABLE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="text-sm font-medium">
                Guest Count *
              </label>

              <div className="mt-2 inline-flex items-center rounded-full overflow-hidden border">
                <span className="px-6 py-2 bg-black text-white">-</span>
                <span className="px-6 bg-white">{reservation.guestCount}</span>
                <span className="px-6 py-2 bg-black text-white">+</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Table</label>

              <div className="mt-2 flex gap-2 flex-wrap">
                {reservation.table ? (
                  <span className="px-3 py-1 rounded-full bg-[#E8D9A8] text-sm">
                    {reservation.table.label}
                  </span>
                ) : (
                  <span className="text-bb-textSoft">No table assigned</span>
                )}
              </div>
            </div>
          </div>

          {/* NOTES */}
          <div>
            <label className="text-sm font-medium">Notes</label>
            <div className="mt-2 bg-gray-200 rounded-lg px-4 py-3 min-h-[120px]">
              {reservation.notes || "No notes"}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => navigate(-1)}
              className="border border-black px-6 py-2 rounded"
            >
              Cancel
            </button>

            <button
              onClick={() => navigate(`/reservations/edit/${id}`)}
              className="bg-yellow-400 px-6 py-2 rounded font-medium"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ViewReservation;
