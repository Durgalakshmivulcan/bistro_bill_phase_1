import { useState } from "react";
import MultiSelect from "../../form/Multiselect";

const addonsList = ["Extra Cheese", "Sauce", "Mayo", "Spicy Dip"];

const addonOptions = addonsList.map(addon => ({
  label: addon,
  value: addon,
}));

const AddonsStep = ({ onNext, onPrev }: any) => {
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  return (
    <div className="bg-bb-bg border rounded-xl p-6">

      {/* HEADER */}
      <h2 className="font-semibold mb-4">Addons</h2>

      <div className="sm:w-full lg:w-[50%]">
        <MultiSelect
          label="Choose Addons"
          required
          options={addonOptions}
          value={selectedAddons}
          onChange={setSelectedAddons}
        />
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onPrev} className="border px-4 py-2 rounded">
          Previous
        </button>
        <button onClick={onNext} className="bg-yellow-400 px-4 py-2 rounded">
          Save & Next
        </button>
      </div>
    </div>
  );
};

export default AddonsStep;
