import { useRef, useState } from "react";
import Input from "../../form/Input";
import Select from "../../form/Select";
import Textarea from "../../form/Textarea";
import { BranchFormData } from "../CreateBranchModal";

type Props = {
  data: BranchFormData;
  onChange: (data: Partial<BranchFormData>) => void;
};

export default function BranchDetailsStep({ data, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onChange({ image: file });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-base sm:text-lg font-semibold">
        Branch Detail’s
      </h3>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IMAGE UPLOAD */}
        <div className="border-2 border-dashed rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center text-center">
          {preview ? (
            <img
              src={preview}
              alt="Branch Preview"
              className="w-full h-40 sm:h-48 object-cover rounded-md mb-3"
            />
          ) : (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-yellow-400 px-4 py-2 rounded-md font-medium mb-3 text-sm sm:text-base"
              >
                Upload Image
              </button>

              <p className="text-xs sm:text-sm text-gray-500">
                Recommended size 400×260 to 600×300
                <br />
                JPG or PNG
              </p>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg"
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>

        {/* FORM */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Branch Name"
              required
              value={data.name}
              onChange={(value) => onChange({ name: value })}
            />
            <Input
              label="Branch Code"
              disabled
              value={data.code || ""}
              placeholder="Auto-generated"
            />

            <Input
              label="Email Address"
              required
              value={data.email}
              onChange={(value) => onChange({ email: value })}
            />
            <Select
              label="Order Types"
              required
              options={[
                { label: "Dine In", value: "Dine In" },
                { label: "Take Away", value: "Take Away" },
                { label: "Online", value: "Online" },
              ]}
              onChange={(value) => onChange({ orderTypes: [value] })}
            />

            <Input
              label="Phone Number"
              value={data.phone}
              onChange={(value) => onChange({ phone: value })}
            />
            <Input
              label="Branch Address"
              value={data.address}
              onChange={(value) => onChange({ address: value })}
            />
          </div>
        </div>
      </div>

      <Textarea
        label="Description"
        placeholder="Type here..."
        value={data.description || ""}
        onChange={(e) => onChange({ description: e.target.value })}
      />
    </div>
  );
}
