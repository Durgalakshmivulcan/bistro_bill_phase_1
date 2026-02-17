import { MoreVertical, Pencil, Trash2, QrCode } from "lucide-react";
import { useState } from "react";
import Modal from "../../ui/Modal";
import tickImg from "../../../assets/tick.png";
import deleteIcon from "../../../assets/deleteConformImg.png";
import { BranchFormData } from "../CreateBranchModal";

type Props = {
  data: BranchFormData;
  onChange: (data: Partial<BranchFormData>) => void;
};

type Room = {
  id: number;
  name: string;
  staff: string;
  status: boolean;
};

const initialRooms: Room[] = [
  { id: 1, name: "Room-1", staff: "Salman Khan", status: false },
  { id: 2, name: "Room-2", staff: "Aman", status: true },
  { id: 3, name: "Room-3", staff: "Anthony", status: false },
  { id: 4, name: "Room-4", staff: "Davis", status: true },
];

export default function RoomStep({ data, onChange }: Props) {
  const [rooms, setRooms] = useState<Room[]>(
    (data.rooms as Room[] | undefined)?.length ? (data.rooms as Room[]) : initialRooms
  );

  const syncRooms = (updated: Room[]) => {
    setRooms(updated);
    onChange({ rooms: updated });
  };
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const toggleStatus = (id: number) => {
    const updated = rooms.map((r) => (r.id === id ? { ...r, status: !r.status } : r));
    syncRooms(updated);
  };

  const handleEdit = (room: Room) => {
    setEditRoom(room);
    setModalOpen(true);
    setOpenMenu(null);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setShowConfirm(true);
    setOpenMenu(null);
  };

  const confirmDelete = () => {
    const updated = rooms.filter((r) => r.id !== deleteId);
    syncRooms(updated);
    setShowConfirm(false);

    setSuccessMessage("Room has been successfully removed.");
    setShowSuccess(true);
  };

  const handleSave = (roomData: Omit<Room, "id">) => {
    let updated: Room[];
    if (editRoom) {
      updated = rooms.map((r) => (r.id === editRoom.id ? { ...r, ...roomData } : r));
      setSuccessMessage("Room updated successfully.");
    } else {
      updated = [...rooms, { id: Date.now(), ...roomData }];
      setSuccessMessage("New room added successfully.");
    }

    syncRooms(updated);
    setModalOpen(false);
    setEditRoom(null);
    setShowSuccess(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold">Manage Rooms</h3>

          <button
            onClick={() => {
              setEditRoom(null);
              setModalOpen(true);
            }}
            className="bg-black text-white px-4 py-2 rounded-md text-sm"
          >
            Add New
          </button>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto border rounded-xl">
          <table className="min-w-[800px] w-full text-sm">
            <thead className="bg-yellow-400">
              <tr>
                <th className="px-4 py-3 text-left">Sl. No.</th>
                <th className="px-4 py-3 text-left">Room Name</th>
                <th className="px-4 py-3 text-left">Staff Assigned</th>
                <th className="px-4 py-3 text-left">QR Code</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rooms.map((room, index) => (
                <tr
                  key={room.id}
                  className={`border-t ${
                    index % 2 === 1 ? "bg-[#FFF8E7]" : ""
                  }`}
                >
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">{room.name}</td>
                  <td className="px-4 py-3">{room.staff}</td>

                  {/* QR */}
                  <td className="px-4 py-3">
                    <QrCode size={18} />
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(room.id)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full ${
                        room.status ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`h-4 w-4 bg-white rounded-full transition transform ${
                          room.status ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-3 text-right relative">
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === room.id ? null : room.id)
                      }
                      className="p-2 rounded-md hover:bg-gray-100"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openMenu === room.id && (
                      <div className="absolute right-4 top-10 bg-white border rounded-md shadow-md w-32 z-10">
                        <button
                          onClick={() => handleEdit(room)}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                        >
                          <Pencil size={14} /> Edit
                        </button>

                        <button
                          onClick={() => handleDeleteClick(room.id)}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left text-red-600"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= CREATE / EDIT MODAL ================= */}
      {modalOpen && (
        <RoomModal
          defaultValues={editRoom}
          onClose={() => {
            setModalOpen(false);
            setEditRoom(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* ================= DELETE CONFIRM ================= */}
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

      {/* ================= SUCCESS ================= */}
      <Modal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Success</h2>

        <div className="flex justify-center mb-4">
          <img src={tickImg} alt="success" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">{successMessage}</p>
      </Modal>
    </>
  );
}

//////////////////////// MODAL COMPONENT ////////////////////////

function RoomModal({
  onClose,
  onSave,
  defaultValues,
}: {
  onClose: () => void;
  onSave: (data: Omit<Room, "id">) => void;
  defaultValues: Room | null;
}) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [staff, setStaff] = useState(defaultValues?.staff || "");
  const [status, setStatus] = useState(defaultValues?.status || false);

  const isEdit = Boolean(defaultValues);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {isEdit ? "Edit Room" : "Add New Room"}
          </h2>

          <button className="bg-black text-white px-3 py-1 rounded text-xs">
            Generate QR
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Room Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mt-1"
              placeholder="Room Name"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Assign Staff *</label>
            <input
              value={staff}
              onChange={(e) => setStaff(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mt-1"
              placeholder="Staff Name"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={status}
              onChange={(e) => setStatus(e.target.checked)}
            />
            <span className="text-sm">Active</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="border px-6 py-2 rounded">
            Cancel
          </button>

          <button
            onClick={() =>
              onSave({
                name,
                staff,
                status,
              })
            }
            className="bg-yellow-400 px-6 py-2 rounded font-medium"
          >
            {isEdit ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
