import { useEffect, useState } from "react";
import tickImg from "../../../assets/tick.png";
import Modal from "../../ui/Modal";

export interface Kitchen {
  id?: number;
  name: string;
  staff: string;
  printers: string;
  category: string;
  status: boolean;
}

interface Props {
  onClose: () => void;
  defaultValues?: Kitchen | null;
  onSave?: (kitchen: Kitchen) => void;
}

const emptyForm: Kitchen = {
  name: "",
  staff: "",
  printers: "",
  category: "",
  status: true,
};

const CreateKitchenModal = ({ onClose, defaultValues = null, onSave }: Props) => {
  const [successOpen, setSuccessOpen] = useState(false);
  const [formData, setFormData] = useState<Kitchen>(emptyForm);

  const isEditMode = Boolean(defaultValues);

  // PREFILL
  useEffect(() => {
    if (defaultValues) {
      setFormData(defaultValues);
    } else {
      setFormData(emptyForm);
    }
  }, [defaultValues]);

  const handleChange = (key: keyof Kitchen, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (onSave) {
      onSave(formData);
    }

    setSuccessOpen(true);

    setTimeout(() => {
      setSuccessOpen(false);
      onClose();
    }, 1500);
  };

  return (
    <>
      {/* MAIN MODAL */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
        />

        <div className="relative w-full max-w-xl bg-white rounded-xl p-6 sm:p-8">

          <h2 className="text-2xl font-semibold mb-6">
            {isEditMode ? "Edit Kitchen" : "Add New Kitchen"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label className="text-sm font-medium">
                Name of Kitchen *
              </label>
              <input
                value={formData.name}
                onChange={(e) =>
                  handleChange("name", e.target.value)
                }
                className="w-full border px-3 py-2 rounded-md text-sm"
                placeholder="Kitchen Name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Assigned Staff
              </label>
              <input
                value={formData.staff}
                onChange={(e) =>
                  handleChange("staff", e.target.value)
                }
                className="w-full border px-3 py-2 rounded-md text-sm"
                placeholder="Staff Name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Assigned Printers
              </label>
              <input
                value={formData.printers}
                onChange={(e) =>
                  handleChange("printers", e.target.value)
                }
                className="w-full border px-3 py-2 rounded-md text-sm"
                placeholder="Printer names"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Assigned Categories
              </label>
              <input
                value={formData.category}
                onChange={(e) =>
                  handleChange("category", e.target.value)
                }
                className="w-full border px-3 py-2 rounded-md text-sm"
                placeholder="Categories"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="border px-6 py-2 rounded-md"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              className="bg-yellow-400 px-6 py-2 rounded-md font-medium"
            >
              {isEditMode ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        className="w-[90%] max-w-md p-8 text-center z-[10000]"
      >
        <h2 className="text-2xl font-bold mb-4">
          {isEditMode
            ? "Kitchen Updated"
            : "Kitchen Created"}
        </h2>

        <div className="flex justify-center mb-4">
          <img src={tickImg} className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          {isEditMode
            ? "Kitchen updated successfully."
            : "New kitchen added successfully."}
        </p>
      </Modal>
    </>
  );
};

export default CreateKitchenModal;
