import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Modal from "../../ui/Modal";
import tickImg from "../../../assets/tick.png";
import deleteIcon from "../../../assets/deleteConformImg.png";
import { BranchFormData } from "../CreateBranchModal";
import { getStaff } from "../../../services/staffService";

type Props = {
  data: BranchFormData;
  onChange: (data: Partial<BranchFormData>) => void;
};

type FloorArea = {
  id: number;
  name: string;
  staff: string;
  status: "active" | "inactive";
  description: string;
};

const initialData: FloorArea[] = [
  { id: 1, name: "Private Dining", staff: "Salman Khan", status: "inactive", description: "Private section" },
  { id: 2, name: "Family Section", staff: "Aman", status: "active", description: "Family tables" },
  { id: 3, name: "Bar", staff: "Salman Khan", status: "inactive", description: "Bar area" },
  { id: 4, name: "Non-AC", staff: "Aman", status: "active", description: "Open seating" },
  { id: 5, name: "Outdoor Seating", staff: "Salman Khan", status: "inactive", description: "Outdoor zone" },
];

export default function FloorAreaStep({ data, onChange }: Props) {
  const [areas, setAreas] = useState<FloorArea[]>(
    (data.floors as FloorArea[] | undefined)?.length ? (data.floors as FloorArea[]) : initialData
  );

  const syncFloors = (updated: FloorArea[]) => {
    setAreas(updated);
    onChange({ floors: updated });
  };

  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editArea, setEditArea] = useState<FloorArea | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [staffOptions, setStaffOptions] = useState<string[]>([]);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const response = await getStaff({ page: 1, limit: 100 });
        if (response.success && response.data) {
          const options = response.data.staff
            .map((staff) => `${staff.firstName} ${staff.lastName}`.trim())
            .filter(Boolean);
          setStaffOptions(Array.from(new Set(options)));
        }
      } catch {
        setStaffOptions([]);
      }
    };

    loadStaff();
  }, []);

  const toggleStatus = (id: number) => {
    const updated = areas.map((a) =>
      a.id === id
        ? {
            ...a,
            status: (a.status === "active" ? "inactive" : "active") as "active" | "inactive",
          }
        : a
    );
    syncFloors(updated);
  };

  const handleEdit = (area: FloorArea) => {
    setEditArea(area);
    setModalOpen(true);
    setOpenMenu(null);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setShowConfirm(true);
    setOpenMenu(null);
  };

  const confirmDelete = () => {
    const updated = areas.filter((a) => a.id !== deleteId);
    syncFloors(updated);
    setShowConfirm(false);
    setSuccessMessage("Floor has been successfully removed.");
    setShowSuccess(true);
  };

  const handleSave = (floorData: Omit<FloorArea, "id">) => {
    let updated: FloorArea[];
    if (editArea) {
      updated = areas.map((a) => (a.id === editArea.id ? { ...a, ...floorData } : a));
      setSuccessMessage("Floor updated successfully.");
    } else {
      updated = [...areas, { id: Date.now(), ...floorData }];
      setSuccessMessage("New floor added successfully.");
    }

    syncFloors(updated);
    setModalOpen(false);
    setEditArea(null);
    setShowSuccess(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold">Manage Floor / Area</h3>

          <button
            onClick={() => {
              setEditArea(null);
              setModalOpen(true);
            }}
            className="bg-black text-white px-4 py-2 rounded-md text-sm"
          >
            Add New
          </button>
        </div>

        <div className="overflow-x-auto border rounded-xl">
          <table className="min-w-[700px] w-full text-sm">
            <thead className="bg-yellow-400">
              <tr>
                <th className="px-4 py-3 text-left">Floor / Area Name</th>
                <th className="px-4 py-3 text-left">Staff Assigned</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {areas.map((area, index) => (
                <tr key={area.id} className={`border-t ${index % 2 === 1 ? "bg-[#FFF8E7]" : ""}`}>
                  <td className="px-4 py-3">{area.name}</td>
                  <td className="px-4 py-3">{area.staff}</td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(area.id)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full ${
                        area.status === "active" ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`h-4 w-4 bg-white rounded-full transition transform ${
                          area.status === "active" ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>

                  <td className="px-4 py-3 text-right relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === area.id ? null : area.id)}
                      className="p-2 rounded-md hover:bg-gray-100"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openMenu === area.id && (
                      <div className="absolute right-4 top-10 bg-white border rounded-md shadow-md w-32 z-10">
                        <button
                          onClick={() => handleEdit(area)}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                        >
                          <Pencil size={14} /> Edit
                        </button>

                        <button
                          onClick={() => handleDeleteClick(area.id)}
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

      {modalOpen && (
        <FloorModal
          staffOptions={staffOptions}
          defaultValues={editArea}
          onClose={() => {
            setModalOpen(false);
            setEditArea(null);
          }}
          onSave={handleSave}
        />
      )}

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
          <button onClick={() => setShowConfirm(false)} className="border px-6 py-2 rounded">
            Cancel
          </button>
          <button onClick={confirmDelete} className="bg-yellow-400 px-6 py-2 rounded font-medium">
            Yes
          </button>
        </div>
      </Modal>

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

function FloorModal({
  onClose,
  onSave,
  defaultValues,
  staffOptions,
}: {
  onClose: () => void;
  onSave: (data: Omit<FloorArea, "id">) => void;
  defaultValues: FloorArea | null;
  staffOptions: string[];
}) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [staff, setStaff] = useState(defaultValues?.staff || "");
  const [status, setStatus] = useState<"active" | "inactive">(defaultValues?.status || "active");
  const [description, setDescription] = useState(defaultValues?.description || "");

  const isEdit = Boolean(defaultValues);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">
          {isEdit ? "Edit Floor / Area" : "Add New Floor / Area"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mt-1"
              placeholder="Enter floor / area name"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Assigned Staff *</label>
            <select
              value={staff}
              onChange={(e) => setStaff(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mt-1"
            >
              <option value="">Select staff</option>
              {staffOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value === "inactive" ? "inactive" : "active")}
              className="w-full border rounded-md px-3 py-2 mt-1"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mt-1"
              placeholder="Description"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="border px-6 py-2 rounded">
            Cancel
          </button>
          <button
            onClick={() => onSave({ name, staff, status, description })}
            className="bg-yellow-400 px-6 py-2 rounded font-medium"
          >
            {isEdit ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
