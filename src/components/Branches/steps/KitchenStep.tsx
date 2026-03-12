import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Modal from "../../../components/ui/Modal";
import deleteIcon from "../../../assets/deleteConformImg.png";
import successIcon from "../../../assets/deleteSuccessImg.png";
import { BranchFormData } from "../CreateBranchModal";
import CreateKitchenModal, { Kitchen } from "./CreateKitchenModal";
import { getStaff } from "../../../services/staffService";
import { getCategories } from "../../../services/catalogService";

type Props = {
  data: BranchFormData;
  onChange: (data: Partial<BranchFormData>) => void;
};

const initialKitchens: Kitchen[] = [
  {
    id: 1,
    name: "Kitchen-1",
    staff: "Salman Khan",
    printers: "Printer 1, Printer 2",
    category: "South Indian",
    status: "inactive",
  },
  {
    id: 2,
    name: "Kitchen-2",
    staff: "Aman",
    printers: "Printer 3",
    category: "North Indian",
    status: "active",
  },
];

export default function KitchenStep({ data, onChange }: Props) {
  const [kitchens, setKitchens] = useState<Kitchen[]>(
    (data.kitchens as Kitchen[] | undefined)?.length ? (data.kitchens as Kitchen[]) : initialKitchens
  );

  const syncKitchens = (updated: Kitchen[]) => {
    setKitchens(updated);
    onChange({ kitchens: updated });
  };

  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const [openModal, setOpenModal] = useState(false);

  const [editKitchen, setEditKitchen] = useState<Kitchen | null>(null);

  const [deleteKitchen, setDeleteKitchen] = useState<Kitchen | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [staffOptions, setStaffOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [staffResponse, categoriesResponse] = await Promise.all([
          getStaff({ page: 1, limit: 100 }),
          getCategories({ status: "active" }),
        ]);

        if (staffResponse.success && staffResponse.data) {
          const options = staffResponse.data.staff
            .map((staff) => `${staff.firstName} ${staff.lastName}`.trim())
            .filter(Boolean);
          setStaffOptions(Array.from(new Set(options)));
        }

        if (categoriesResponse.success && categoriesResponse.data) {
          const options = categoriesResponse.data.categories.map((category) => category.name);
          setCategoryOptions(Array.from(new Set(options)));
        }
      } catch {
        setStaffOptions([]);
        setCategoryOptions([]);
      }
    };

    loadDropdowns();
  }, []);

  const printerOptions = useMemo(() => {
    const printers = kitchens
      .flatMap((kitchen) => kitchen.printers.split(","))
      .map((printer) => printer.trim())
      .filter(Boolean);

    return Array.from(new Set(printers.length ? printers : ["Printer 1", "Printer 2", "Printer 3"]));
  }, [kitchens]);

  const toggleStatus = (id: number) => {
    const updated = kitchens.map((k) =>
      k.id === id
        ? {
            ...k,
            status: (k.status === "active" ? "inactive" : "active") as "active" | "inactive",
          }
        : k
    );
    syncKitchens(updated);
  };

  const handleEdit = (kitchen: Kitchen) => {
    setEditKitchen(kitchen);
    setOpenModal(true);
    setOpenMenu(null);
  };

  const handleDelete = (kitchen: Kitchen) => {
    setDeleteKitchen(kitchen);
    setShowConfirm(true);
    setOpenMenu(null);
  };

  const confirmDelete = () => {
    const updated = kitchens.filter((k) => k.id !== deleteKitchen?.id);
    syncKitchens(updated);

    setShowConfirm(false);
    setShowSuccess(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Manage Kitchens</h3>

          <button
            onClick={() => {
              setEditKitchen(null);
              setOpenModal(true);
            }}
            className="bg-black text-white px-4 py-2 rounded-md text-sm"
          >
            Add New
          </button>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto border rounded-xl">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-yellow-400">
              <tr>
                <th className="px-4 py-3 text-left">Kitchen Name</th>
                <th className="px-4 py-3 text-left">Staff Assigned</th>
                <th className="px-4 py-3 text-left">Printers</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {kitchens.map((kitchen, index) => (
                <tr
                  key={kitchen.id}
                  className={`border-t ${
                    index % 2 === 1 ? "bg-[#FFF8E7]" : ""
                  }`}
                >
                  <td className="px-4 py-3">{kitchen.name}</td>
                  <td className="px-4 py-3">{kitchen.staff}</td>
                  <td className="px-4 py-3">{kitchen.printers}</td>
                  <td className="px-4 py-3">{kitchen.category}</td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(kitchen.id!)}
                      className={`relative inline-flex h-5 w-10 rounded-full ${
                        kitchen.status === "active" ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`h-4 w-4 bg-white rounded-full transform transition ${
                          kitchen.status === "active" ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>

                  <td className="px-4 py-3 text-right relative">
                    <button
                      onClick={() =>
                        setOpenMenu(
                          openMenu === kitchen.id ? null : kitchen.id!,
                        )
                      }
                      className="p-2 rounded-md hover:bg-gray-100"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openMenu === kitchen.id && (
                      <div className="absolute right-4 top-10 bg-white border rounded-md shadow-md w-32 z-20">
                        <button
                          onClick={() => handleEdit(kitchen)}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(kitchen)}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-red-600"
                        >
                          <Trash2 size={14} />
                          Delete
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

      {/* CREATE / EDIT MODAL */}
      {openModal && (
        <CreateKitchenModal
          defaultValues={editKitchen}
          staffOptions={staffOptions}
          categoryOptions={categoryOptions}
          printerOptions={printerOptions}
          onClose={() => {
            setOpenModal(false);
            setEditKitchen(null);
          }}
          onSave={(kitchen) => {
            if (editKitchen) {
              const updated = kitchens.map((k) =>
                k.id === editKitchen.id ? { ...k, ...kitchen } : k
              );
              syncKitchens(updated);
            } else {
              const updated = [...kitchens, { ...kitchen, id: Date.now() }];
              syncKitchens(updated);
            }
          }}
        />
      )}

      {/* DELETE CONFIRM */}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Delete Kitchen</h2>

        <div className="flex justify-center mb-4">
          <img src={deleteIcon} className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600 mb-6">
          This action cannot be undone.
          <br />
          Do you want to proceed?
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

      {/* SUCCESS */}
      <Modal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Deleted!</h2>

        <div className="flex justify-center mb-4">
          <img src={successIcon} className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          Kitchen has been successfully removed.
        </p>
      </Modal>
    </>
  );
}
