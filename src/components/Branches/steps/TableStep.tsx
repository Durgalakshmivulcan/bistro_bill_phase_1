import { MoreVertical, Pencil, Trash2, QrCode } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Modal from "../../ui/Modal";
import tickImg from "../../../assets/tick.png";
import deleteIcon from "../../../assets/deleteConformImg.png";
import { BranchFormData, BranchTableFormItem } from "../CreateBranchModal";

type Props = {
  data: BranchFormData;
  onChange: (data: Partial<BranchFormData>) => void;
};

export default function TableStep({ data, onChange }: Props) {
  const [tables, setTables] = useState<BranchTableFormItem[]>(data.tables || []);

  useEffect(() => {
    setTables(data.tables || []);
  }, [data.tables]);

  const syncTables = (updated: BranchTableFormItem[]) => {
    setTables(updated);
    onChange({ tables: updated });
  };

  const [openMenu, setOpenMenu] = useState<string | number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTable, setEditTable] = useState<BranchTableFormItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const floorOptions = useMemo(() => {
    const floors = (data.floors || []) as Array<{ name?: string }>;
    const names = floors.map((floor) => floor.name || "").filter(Boolean);
    return Array.from(new Set(names));
  }, [data.floors]);

  const toggleStatus = (id: string | number) => {
    const updated = tables.map((t) =>
      t.id === id
        ? {
            ...t,
            status: (t.status === "active" ? "inactive" : "active") as "active" | "inactive",
          }
        : t
    );
    syncTables(updated);
  };

  const handleEdit = (table: BranchTableFormItem) => {
    setEditTable(table);
    setModalOpen(true);
    setOpenMenu(null);
  };

  const handleDeleteClick = (id: string | number) => {
    setDeleteId(id);
    setShowConfirm(true);
    setOpenMenu(null);
  };

  const confirmDelete = () => {
    const updated = tables.filter((t) => t.id !== deleteId);
    syncTables(updated);
    setShowConfirm(false);
    setSuccessMessage("Table has been successfully removed.");
    setShowSuccess(true);
  };

  const handleSave = (tableData: Omit<BranchTableFormItem, "id">) => {
    let updated: BranchTableFormItem[];
    if (editTable) {
      updated = tables.map((t) => (t.id === editTable.id ? { ...t, ...tableData } : t));
      setSuccessMessage("Table updated successfully.");
    } else {
      updated = [...tables, { id: Date.now(), ...tableData }];
      setSuccessMessage("New table added successfully.");
    }

    syncTables(updated);
    setModalOpen(false);
    setEditTable(null);
    setShowSuccess(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold">Manage Table</h3>
          <button
            onClick={() => {
              setEditTable(null);
              setModalOpen(true);
            }}
            className="bg-black text-white px-4 py-2 rounded-md text-sm"
          >
            Add New
          </button>
        </div>

        <div className="overflow-x-auto border rounded-xl">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-yellow-400">
              <tr>
                <th className="px-4 py-3 text-left">Sl. No.</th>
                <th className="px-4 py-3 text-left">Table Name</th>
                <th className="px-4 py-3 text-left">Capacity</th>
                <th className="px-4 py-3 text-left">QR Code</th>
                <th className="px-4 py-3 text-left">Floor / Area</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {tables.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No tables added yet.
                  </td>
                </tr>
              )}
              {tables.map((table, index) => (
                <tr key={table.id} className={`border-t ${index % 2 === 1 ? "bg-[#FFF8E7]" : ""}`}>
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">{table.name}</td>
                  <td className="px-4 py-3">{table.capacity}</td>
                  <td className="px-4 py-3">
                    <QrCode size={18} />
                  </td>
                  <td className="px-4 py-3">{table.floor}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(table.id)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full ${
                        table.status === "active" ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`h-4 w-4 bg-white rounded-full transition transform ${
                          table.status === "active" ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === table.id ? null : table.id)}
                      className="p-2 rounded-md hover:bg-gray-100"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openMenu === table.id && (
                      <div className="absolute right-4 top-10 bg-white border rounded-md shadow-md w-32 z-10">
                        <button
                          onClick={() => handleEdit(table)}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(table.id)}
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
        <TableModal
          floorOptions={floorOptions}
          defaultValues={editTable}
          onClose={() => {
            setModalOpen(false);
            setEditTable(null);
          }}
          onSave={handleSave}
        />
      )}

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} className="w-[90%] max-w-md p-6 text-center">
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

      <Modal open={showSuccess} onClose={() => setShowSuccess(false)} className="w-[90%] max-w-md p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Success</h2>
        <div className="flex justify-center mb-4">
          <img src={tickImg} alt="success" className="w-16 h-16" />
        </div>
        <p className="text-sm text-gray-600">{successMessage}</p>
      </Modal>
    </>
  );
}

function TableModal({
  onClose,
  onSave,
  defaultValues,
  floorOptions,
}: {
  onClose: () => void;
  onSave: (data: Omit<BranchTableFormItem, "id">) => void;
  defaultValues: BranchTableFormItem | null;
  floorOptions: string[];
}) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [capacity, setCapacity] = useState(defaultValues?.capacity || 1);
  const [floor, setFloor] = useState(defaultValues?.floor || "");
  const [status, setStatus] = useState<"active" | "inactive">(defaultValues?.status || "active");

  const isEdit = Boolean(defaultValues);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{isEdit ? "Edit Table" : "Add New Table"}</h2>
          <button className="bg-black text-white px-3 py-1 rounded text-xs">Generate QR</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Table Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mt-1"
              placeholder="Table Name"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Capacity *</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full border rounded-md px-3 py-2 mt-1"
              placeholder="Capacity"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Assign Floor / Area *</label>
            <select
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mt-1"
            >
              <option value="">Select floor / area</option>
              {floorOptions.map((option) => (
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

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="border px-6 py-2 rounded">
            Cancel
          </button>
          <button
            onClick={() =>
              onSave({
                name,
                capacity,
                floor,
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
