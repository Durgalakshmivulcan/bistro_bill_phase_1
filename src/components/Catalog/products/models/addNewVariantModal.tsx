import { useState } from "react";
import Input from "../../../form/Input";
import Swal from "sweetalert2";

interface Props {
    open: boolean;
    onClose: () => void;
    onCreate: (data: { name: string; quantity: string }) => void;
}

const AddNewVariantModal = ({ open, onClose, onCreate }: Props) => {
    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState("");

    if (!open) return null;

    const handleCreate = () => {
        if (!name || !quantity) {
            Swal.fire({
                title: "Varient Created",
                html: `
          <div class="flex flex-col items-center">
            <div class="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center mb-3">
              <svg width="28" height="28" fill="none" stroke="white" stroke-width="5"
                viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p class="text-sm text-gray-600">
              New Varient added Successfully!
            </p>
          </div>
        `,
                showConfirmButton: false,   // no OK button
                showCloseButton: true,     // ✖ close icon
                allowOutsideClick: false,  // block outside click
                allowEscapeKey: false,     // block ESC
                customClass: {
                    popup: "rounded-lg px-6 py-5",
                    title: "text-3xl font-bold",
                    closeButton: "text-black hover:text-black",
                },
            });

            return;
        }

        onCreate({ name, quantity });
        setName("");
        setQuantity("");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[700px] p-6">

                {/* TITLE */}
                <h2 className="text-2xl font-bold mb-6">
                    Add New Variant
                </h2>

                {/* INPUTS */}
                <div className="grid grid-cols-2 gap-6">
                    <Input
                        label="Variant Name"
                        placeholder="Small"
                        value={name}
                        onChange={(value: string) => setName(value)}
                    />

                    <Input
                        label="Quantity"
                        placeholder="500 grms"
                        value={quantity}
                        onChange={(value: string) => setQuantity(value)}
                    />
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="border px-6 py-2 rounded border border-black"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleCreate}
                        className="bg-yellow-400 px-6 py-2 rounded"
                    >
                        Create
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AddNewVariantModal;
