import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import AddNewVariantModal from "./models/addNewVariantModal";
import Modal from "../../../components/ui/Modal";
import deleteImg from "../../../assets/deleteConformImg.png";
import conformDeleteImg from "../../../assets/deleteSuccessImg.png";

interface Variant {
  id: string | number;
  name: string;
  quantity: string;
  status: boolean;
}

const VariantsStep = ({ onNext, onPrev, readOnly, productData, setProductData }: any) => {
  const [openVariantModal, setOpenVariantModal] = useState(false);

  const [variants, setVariants] = useState<Variant[]>([]);

  useEffect(() => {
    const incoming = Array.isArray(productData?.variants) ? productData.variants : [];
    if (incoming.length === 0) {
      setVariants([]);
      return;
    }

    setVariants(
      incoming.map((v: any, idx: number) => ({
        id: v.id || `local-${idx}`,
        name: v.name || "",
        quantity: v.quantity || "",
        status:
          typeof v.status === "boolean"
            ? v.status
            : String(v.status || "").toLowerCase() !== "inactive",
      }))
    );
  }, [productData?.variants]);

  const syncVariantsToProductData = (updated: Variant[]) => {
    setProductData?.((prev: any) => ({
      ...prev,
      variants: updated.map((v) => ({
        id: String(v.id),
        name: v.name,
        quantity: v.quantity,
        status: v.status ? "active" : "inactive",
      })),
    }));
  };

  // 🔴 DELETE FLOW STATE
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletedOpen, setDeletedOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  /* CONFIRM DELETE */
  const handleDeleteConfirm = () => {
    if (!selectedId) return;

    setVariants((prev) => {
      const updated = prev.filter((v) => v.id !== selectedId);
      syncVariantsToProductData(updated);
      return updated;
    });

    setDeleteOpen(false);
    setDeletedOpen(true);

    // Auto close success modal
    setTimeout(() => {
      setDeletedOpen(false);
    }, 1500);
  };

  /* CREATE SUCCESS */
  const handleCreateSuccess = () => {
    setOpenVariantModal(false);
    setDeletedOpen(true);

    setTimeout(() => {
      setDeletedOpen(false);
    }, 1500);
  };

  return (
    <div className="bg-bb-bg border rounded-xl p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Variants</h2>

        {!readOnly && (
          <button
            onClick={() => setOpenVariantModal(true)}
            className="bg-black text-white px-4 py-2 rounded text-sm"
          >
            Add New
          </button>
        )}
      </div>

      {/* TABLE */}
      <table className="w-full text-sm border">
        <thead className="bg-yellow-400">
          <tr>
            <th className="p-2 text-left">Variant Name</th>
            <th className="p-2 text-center">Quantity</th>
            <th className="p-2 text-center">Status</th>
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {variants.map((v) => (
            <tr key={v.id} className="border-t odd:bg-white even:bg-[#FFF8E7]">
              <td className="p-2">{v.name}</td>
              <td className="p-2 text-center">{v.quantity}</td>

              {/* STATUS TOGGLE */}
              <td className="p-2 text-center">
                <button
                  disabled={readOnly}
                  onClick={() =>
                    setVariants((prev) => {
                      const updated = prev.map((item) =>
                        item.id === v.id
                          ? {
                              ...item,
                              status: !item.status,
                            }
                          : item,
                      );
                      syncVariantsToProductData(updated);
                      return updated;
                    })
                  }
                  className={`relative inline-flex items-center
                    w-10 h-5 rounded-full transition-colors
                    ${v.status ? "bg-[#75C013]" : "bg-gray-300"}
                    ${readOnly && "opacity-50 cursor-not-allowed"}
                  `}
                >
                  <span
                    className={`absolute left-0.5 top-0.5
                      w-4 h-4 bg-white rounded-full
                      transition-transform
                      ${v.status ? "translate-x-4" : "translate-x-0"}`}
                  />
                </button>
              </td>

              {/* ACTIONS */}
              <td className="p-2 text-center">
                {!readOnly && (
                  <button
                    onClick={() => {
                      setSelectedId(v.id);
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ADD NEW VARIANT MODAL */}
      <AddNewVariantModal
        open={openVariantModal}
        onClose={() => setOpenVariantModal(false)}
        onCreate={({ name, quantity }) => {
          setVariants((prev) => {
            const updated = [
              ...prev,
              {
                id: Date.now(),
                name,
                quantity,
                status: true,
              },
            ];
            syncVariantsToProductData(updated);
            return updated;
          });

          handleCreateSuccess();
        }}
      />

      {/* 🔴 DELETE CONFIRM MODAL */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Delete</h2>
        <div className="flex justify-center mb-4">
          <img src={deleteImg} alt="Delete" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600 mb-6">
          This action cannot be undone. <br />
          Do you want to proceed with deletion?
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setDeleteOpen(false)}
            className="border border-black px-6 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleDeleteConfirm}
            className="bg-yellow-400 px-8 py-2 rounded font-medium"
          >
            Yes
          </button>
        </div>
      </Modal>

      {/* 🔵 SUCCESS MODAL */}
      <Modal
        open={deletedOpen}
        onClose={() => setDeletedOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">Success!</h2>

        <div className="flex justify-center mb-4">
          <img src={conformDeleteImg} alt="Delete" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">Action completed successfully.</p>
      </Modal>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onPrev} className="border px-4 py-2 rounded">
          Previous
        </button>

        {!readOnly && (
          <button onClick={onNext} className="bg-yellow-400 px-4 py-2 rounded">
            Save & Next
          </button>
        )}
      </div>
    </div>
  );
};

export default VariantsStep;
