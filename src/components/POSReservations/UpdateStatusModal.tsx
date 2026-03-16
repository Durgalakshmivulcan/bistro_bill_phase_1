import { useState } from "react";
import Modal from "../ui/Modal";
import Select from "../form/Select";
import tickImg from "../../assets/tick.png";
import { updateReservationStatus, ReservationStatus } from "../../services/reservationService";

interface Props {
  open: boolean;
  onClose: () => void;
  reservationId: string | null;
  onStatusUpdated?: () => void;
}

const UpdateStatusModal: React.FC<Props> = ({ open, onClose, reservationId, onStatusUpdated }) => {
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [waitingTime, setWaitingTime] = useState("");
  const [description, setDescription] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    if (!reservationId || !status) {
      alert('Please select a status');
      return;
    }

    // Map frontend status to backend status
    const statusMap: Record<string, ReservationStatus> = {
      'accepted': 'Confirmed',
      'waiting': 'Pending',
      'cancelled': 'Cancelled',
      'completed': 'Completed',
    };

    const backendStatus = statusMap[status];
    if (!backendStatus) {
      alert('Invalid status selected');
      return;
    }

    try {
      setIsUpdating(true);

      const updateData: any = {
        status: backendStatus,
      };

      // Add status-specific fields
      if (status === 'cancelled' && reason) {
        updateData.reason = reason;
      }

      if (status === 'waiting') {
        if (waitingTime) {
          updateData.waitingTime = parseInt(waitingTime);
        }
        if (description) {
          updateData.description = description;
        }
      }

      const response = await updateReservationStatus(reservationId, updateData);

      if (response.success) {
        setSuccessOpen(true);
        if (onStatusUpdated) {
          onStatusUpdated();
        }
      } else {
        alert('Failed to update reservation status');
      }
    } catch (err: any) {
      console.error('Error updating reservation status:', err);
      alert(err?.message || 'Failed to update reservation status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      {/* UPDATE STATUS MODAL */}
      <Modal open={open} onClose={onClose} className="w-[90%] max-w-2xl p-6">
        <h2 className="text-2xl font-bold mb-6">Update Status</h2>

        {/* STATUS */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">Status</label>
          <Select
            value={status}
            onChange={(v) => {
              setStatus(v);
              setReason("");
              setWaitingTime("");
              setDescription("");
            }}
            options={[
              { label: "Select Status", value: "" },
              { label: "Accepted", value: "accepted" },
              { label: "Waiting", value: "waiting" },
              { label: "Cancelled", value: "cancelled" },
            ]}
          />
        </div>

        {/* CANCELLED → REASON */}
        {status === "cancelled" && (
          <div className="mb-4">
            <label className="text-sm font-medium mb-1 block">Reason</label>
            <Select
              value={reason}
              onChange={(v) => setReason(v)}
              options={[
                { label: "Select Reason", value: "" },
                { label: "Customer Not Responding", value: "no-response" },
                { label: "Table Not Available", value: "table" },
                { label: "Customer Cancelled", value: "customer" },
              ]}
            />
          </div>
        )}

        {/* WAITING → TIME + DESCRIPTION */}
        {status === "waiting" && (
          <>
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">
                Waiting Time (Mins)
              </label>
              <input
                value={waitingTime}
                onChange={(e) => setWaitingTime(e.target.value)}
                placeholder="Enter Time in Mins"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add Note’s if Any."
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="border border-black px-6 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating || !status}
            className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
          >
            {isUpdating ? 'Updating...' : 'Save'}
          </button>
        </div>
      </Modal>

      {/* SUCCESS MODAL */}
      <Modal
        open={successOpen}
        onClose={() => {
          setSuccessOpen(false);
          onClose();
        }}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Status Updated</h2>

        <div className="flex justify-center mb-4">
          <img src={tickImg} alt="success" className="w-20 h-20" />
        </div>

        <p className="text-sm text-gray-600">
          Reservation Status Updated Successfully.
        </p>
      </Modal>
    </>
  );
};

export default UpdateStatusModal;
