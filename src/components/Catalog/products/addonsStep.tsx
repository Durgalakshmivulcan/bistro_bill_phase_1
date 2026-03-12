import { useEffect, useState } from "react";
import MultiSelect from "../../form/Multiselect";

const addonsList = ["Extra Cheese", "Sauce", "Mayo", "Spicy Dip"];

const addonOptions = addonsList.map(addon => ({
  label: addon,
  value: addon,
}));

const AddonsStep = ({ onNext, onPrev, productData, setProductData }: any) => {
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  useEffect(() => {
    const existing = Array.isArray(productData?.addons) ? productData.addons : [];
    setSelectedAddons(existing.map((addon: any) => addon.name).filter(Boolean));
  }, [productData?.addons]);

  const handleAddonsChange = (nextValues: string[]) => {
    setSelectedAddons(nextValues);

    const existingByName = new Map(
      (Array.isArray(productData?.addons) ? productData.addons : []).map((addon: any) => [
        String(addon.name),
        addon,
      ])
    );

    const normalizedAddons = nextValues.map((name) => {
      const existing = existingByName.get(name);
      if (existing) return existing;
      return {
        id: `draft-addon-${name.toLowerCase().replace(/\s+/g, "-")}`,
        name,
        price: 0,
        status: "active",
      };
    });

    setProductData?.((prev: any) => ({
      ...prev,
      addons: normalizedAddons,
    }));
  };

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
          onChange={handleAddonsChange}
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
