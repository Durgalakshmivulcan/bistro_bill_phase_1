import { useRef, useState } from "react";
import Select from "../../../form/Select";
import Input from "../../../form/Input";
import Swal from "sweetalert2";

interface CategoryData {
    image: File | null;
    name: string;
    status: string;
    description: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onSave: (data: CategoryData) => void;
}

const AddCategoryModal = ({ open, onClose, onSave }: Props) => {
    // 🔑 hooks always at top
    const fileRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<CategoryData>({
        image: null,
        name: "",
        status: "",
        description: "",
    });

    if (!open) return null;

    const handleSave = () => {
        if (!form.image || !form.name || !form.status) {
            Swal.fire({
                title: "Category Created",
                html: `
    <div class="flex flex-col items-center">
      <div class="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center mb-3">
        <svg width="28" height="28" fill="none" stroke="white" stroke-width="3"
          viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <p class="text-sm text-gray-600">
        New Category added Successfully!
      </p>
    </div>
  `,
                showConfirmButton: false,   // no OK button
                showCloseButton: true,     // ✖ close icon
                allowOutsideClick: false,  // block outside click
                allowEscapeKey: false,     // block ESC
                customClass: {
                    popup: "rounded-lg px-6 py-5",
                    title: "text-xl font-bold",
                    closeButton: "text-black hover:text-black",
                },
            });


            return;
        }
        onSave(form);
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-[700px] p-6">

                {/* HEADER */}
                <h2 className="font-semibold text-lg mb-4">Add Category</h2>

                <div className="grid grid-cols-3 gap-6">

                    {/* IMAGE UPLOAD */}
                    <div>
                        <label className="text-sm font-medium">
                            Category Image<span className="text-red-500">*</span>
                        </label>

                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={e =>
                                setForm({ ...form, image: e.target.files?.[0] || null })
                            }
                        />

                        <div className="mt-2 border-2 border-dashed rounded-lg p-4 text-center">
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="bg-yellow-400 px-4 py-2 rounded text-sm"
                            >
                                Upload Image
                            </button>

                            <p className="text-xs text-gray-500 mt-2">
                                (Recommended size: 400×260 to 600×300 px.
                                JPG or PNG)
                            </p>
                        </div>
                    </div>

                    {/* RIGHT FORM */}
                    <div className="col-span-2 space-y-4">

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Input
                                label="Category Name"
                                required
                                placeholder="Enter Category Name"
                                value={form.name}
                                onChange={(value: string) =>
                                    setForm({ ...form, name: value })
                                }
                            />

                            <Select
                                label="Status"
                                options={[
                                    { label: "Select Status", value: "" },
                                    { label: "Active", value: "Active" },
                                    { label: "Inactive", value: "Inactive" },
                                ]}
                                value={form.status}
                                onChange={(value: string) =>
                                    setForm({ ...form, status: value })
                                }
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium block mb-1">
                                Description
                            </label>
                            <textarea
                                className="w-full border rounded-md p-3"
                                rows={4}
                                placeholder="Add Description"
                                value={form.description}
                                onChange={e =>
                                    setForm({ ...form, description: e.target.value })
                                }
                            />
                        </div>

                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="border px-4 py-2 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-yellow-400 px-6 py-2 rounded"
                    >
                        Save
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AddCategoryModal;
