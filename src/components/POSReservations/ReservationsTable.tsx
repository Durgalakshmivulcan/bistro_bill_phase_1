import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ActionsMenu from "../form/ActionButtons";
import Modal from "../../components/ui/Modal";
import Pagination from "../Common/Pagination";

import { Reservation } from "./reservationTypes";
import deleteIcon from "../../assets/deleteConformImg.png";
import UpdateStatusModal from "./UpdateStatusModal";
import deleteSuccessImg from "../../assets/deleteSuccessImg.png";
import { getReservations, deleteReservation, updateReservationStatus, Reservation as ApiReservation, ReservationStatus } from "../../services/reservationService";
import { CRUDToasts } from "../../utils/toast";
import { useBranch } from "../../contexts/BranchContext";

// Map tab labels to API status values
const TAB_STATUS_MAP: Record<string, ReservationStatus | undefined> = {
  'All': undefined,
  'New': 'Pending',
  'Accepted': 'Confirmed',
  'Waiting': 'Pending', // No separate "Waiting" status — maps to Pending
  'Cancelled': 'Cancelled',
};

interface ReservationsTableProps {
  statusFilter?: string;
}

const ReservationsTable: React.FC<ReservationsTableProps> = ({ statusFilter = 'All' }) => {
  const navigate = useNavigate();
  const { currentBranchId } = useBranch();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);

  // Transform API reservation to UI reservation format
  const transformReservation = (apiReservation: ApiReservation): Reservation => {
    // Map backend status to frontend status
    const statusMap: Record<string, Reservation['status']> = {
      'Pending': 'new',
      'Confirmed': 'accepted',
      'Cancelled': 'cancelled',
      'Completed': 'completed',
    };

    // Format date from ISO to DD/MM/YYYY
    const formatDate = (isoDate: string) => {
      const date = new Date(isoDate);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Format time from HH:MM to 12-hour format
    const formatTime = (time24: string) => {
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${String(hour12).padStart(2, '0')}:${minutes} ${ampm}`;
    };

    return {
      id: parseInt(apiReservation.id),
      customerName: apiReservation.customerName,
      date: formatDate(apiReservation.date),
      time: formatTime(apiReservation.startTime),
      phone: apiReservation.customerPhone,
      email: apiReservation.customer?.email || '',
      source: 'POS' as const, // Default to POS, could be enhanced later
      guests: apiReservation.guestCount,
      floor: (apiReservation.table?.floor?.type || 'AC') as 'AC' | 'Non-AC',
      tableNo: apiReservation.table?.label || apiReservation.room?.name || '-',
      status: statusMap[apiReservation.status] || 'new',
    };
  };

  // Load reservations from API
  const loadReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiStatus = TAB_STATUS_MAP[statusFilter];
      const response = await getReservations({
        branchId: currentBranchId,
        status: apiStatus,
        page: 1,
        limit: 10
      });

      if (response.success && response.data) {
        const transformedReservations = response.data.map(transformReservation);
        setReservations(transformedReservations);
      } else {
        setError('Failed to load reservations');
      }
    } catch (err: any) {
      console.error('Error loading reservations:', err);
      setError(err?.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [statusFilter, currentBranchId]);

  const handleDeleteClick = (id: number) => {
    setDeleteId(String(id));
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await deleteReservation(deleteId);
      if (response.success) {
        CRUDToasts.deleted("Reservation");
        setShowConfirm(false);
        setShowSuccess(true);
        // Refresh the list after successful deletion
        loadReservations();
      } else {
        alert('Failed to delete reservation');
      }
    } catch (err: any) {
      console.error('Error deleting reservation:', err);
      alert(err?.message || 'Failed to delete reservation');
      setShowConfirm(false);
    }
  };

  const handleUpdateStatus = (id: number) => {
    setSelectedReservationId(String(id));
    setStatusModalOpen(true);
  };

  const handleStatusUpdated = () => {
    // Refresh the list after status update
    loadReservations();
    setStatusModalOpen(false);
    setSelectedReservationId(null);
  };

  // Quick status update functions
  const handleQuickStatusUpdate = async (reservationId: string, newStatus: 'Confirmed' | 'Completed' | 'Cancelled', reason?: string) => {
    try {
      const response = await updateReservationStatus(reservationId, {
        status: newStatus,
        reason
      });

      if (response.success) {
        // Refresh the list after successful status update
        loadReservations();
      } else {
        alert('Failed to update reservation status');
      }
    } catch (err: any) {
      console.error('Error updating reservation status:', err);
      alert(err?.message || 'Failed to update reservation status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-500">Loading reservations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[1300px] rounded-xl border bg-white overflow-visible">
          {/* HEADER */}
          <div className="grid grid-cols-12 bg-yellow-400 px-4 py-3 text-sm font-medium">
            <span>Sl. No.</span>
            <span className="col-span-2">Customer Name</span>
            <span>Date & Time</span>
            <span>Phone</span>
            <span>Email</span>
            <span>Source</span>
            <span>No. of Guests</span>
            <span>Floor</span>
            <span>Table</span>
            <span>Status</span>
            <span className="text-center">Actions</span>
          </div>

          {/* ROWS */}
          {reservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reservations found
            </div>
          ) : (
            reservations.map((r, index) => (
              <div
                key={r.id}
                className="grid grid-cols-12 px-4 py-4 text-sm border-b items-center even:bg-[#FFF8E7]"
              >
                <span>{index + 1}</span>
                <span className="col-span-2 font-medium">{r.customerName}</span>

                <span>
                  {r.date}
                  <br />
                  <span className="text-xs text-gray-500">{r.time}</span>
                </span>

                <span>{r.phone}</span>
                <span className="truncate max-w-[180px]">{r.email}</span>
                <span>{r.source}</span>
                <span className="text-center">{r.guests}</span>
                <span>{r.floor}</span>
                <span>{r.tableNo}</span>

                <div className="flex flex-col gap-1">
                  <span
                    className={`text-xs px-3 py-1 rounded-full w-fit ${
                      r.status === "new"
                        ? "bg-blue-100 text-blue-600"
                        : r.status === "accepted"
                          ? "bg-green-100 text-green-600"
                          : r.status === "completed"
                            ? "bg-purple-100 text-purple-600"
                            : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {r.status}
                  </span>
                  {/* Quick action buttons based on status */}
                  <div className="flex gap-1">
                    {r.status === "new" && (
                      <button
                        onClick={() => handleQuickStatusUpdate(String(r.id), 'Confirmed')}
                        className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        title="Confirm reservation"
                      >
                        Confirm
                      </button>
                    )}
                    {r.status === "accepted" && (
                      <button
                        onClick={() => handleQuickStatusUpdate(String(r.id), 'Completed')}
                        className="text-xs px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                        title="Mark as completed"
                      >
                        Complete
                      </button>
                    )}
                    {(r.status === "new" || r.status === "accepted") && (
                      <button
                        onClick={() => handleQuickStatusUpdate(String(r.id), 'Cancelled', 'No Show')}
                        className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                        title="Mark as no show"
                      >
                        No Show
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-center">
                  <ActionsMenu
                    actions={["view", "edit", "updateStatus", "delete"]}
                    onView={() => navigate(`/reservations/view/${r.id}`)}
                    onEdit={() => navigate(`/reservations/edit/${r.id}`)}
                    onUpdateStatus={() => handleUpdateStatus(r.id)}
                    onDelete={() => handleDeleteClick(r.id)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* PAGINATION */}
      <div className="flex justify-end mt-6">
        <Pagination />
      </div>

      {/* DELETE CONFIRM MODAL */}
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

      {/* DELETE SUCCESS MODAL */}
      <Modal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Deleted!</h2>

        <div className="flex justify-center mb-4">
          <img src={deleteSuccessImg} alt="success" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          Reservation has been successfully deleted.
        </p>
      </Modal>
      <UpdateStatusModal
        open={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setSelectedReservationId(null);
        }}
        reservationId={selectedReservationId}
        onStatusUpdated={handleStatusUpdated}
      />
    </>
  );
};

export default ReservationsTable;
