import { useEffect, useState } from "react";
import Input from "../../form/Input";
import MultiSelect from "../../form/Multiselect";

const chargesList = ["Convenience Fee", "Packing Charges"];
const allergyList = ["Peanut Allergy", "Egg Allergy", "Milk Allergy"];

const AdditionalDetails = ({
  onNext,
  onPrev,
  productData,
  setProductData,
  readOnly,
}: any) => {
  const [charges, setCharges] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  
  useEffect(() => {
    setCharges(Array.isArray(productData?.charges) ? productData.charges : []);
    setAllergies(
      Array.isArray(productData?.allergens)
        ? productData.allergens.map((item: any) => item?.name || item).filter(Boolean)
        : []
    );
  }, [productData]);

  const updateProductField = (field: string, value: any) => {
    setProductData?.((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatTime = (minutes: number | null | undefined) => {
    if (minutes === null || minutes === undefined || minutes <= 0) return "Enter Time";

    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${String(hrs).padStart(2, "0")} : ${String(mins).padStart(
      2,
      "0"
    )} Hrs`;
  };
  const changePrepTime = (delta: number) => {
    const current =
      productData?.preparationTime === null || productData?.preparationTime === undefined
        ? 0
        : Number(productData.preparationTime);
    const nextValue = Math.max(0, current + delta);
    updateProductField("preparationTime", nextValue || null);
  };

  const handleChargesChange = (values: string[]) => {
    setCharges(values);
    updateProductField("charges", values);
  };

  const handleAllergyChange = (values: string[]) => {
    setAllergies(values);
    updateProductField(
      "allergens",
      values.map((name) => ({ name }))
    );
  };

  return (
    <div className="bg-bb-bg border rounded-xl p-6">

      {/* CHARGES */}
      <h2 className="font-semibold mb-4">Charges</h2>
      <div className="sm:w-full lg:w-[50%]">
        <MultiSelect
          label="Select Charges"
          options={chargesList.map(c => ({
            label: c,
            value: c,
          }))}
          value={charges}
          onChange={handleChargesChange}
        />

      </div>


      {/* SERVES & NUTRITION */}
      <h3 className="font-semibold mt-6 mb-3">
        Serves & Nutritional Info Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Input
          label="Serve"
          placeholder="Enter Serves"
          value={productData?.servesCount?.toString?.() ?? ""}
          disabled={readOnly}
          onChange={(value: string) => updateProductField("servesCount", value)}
        />

        <Input
          label="Serve Size Unit"
          placeholder="Enter Serve Size Unit"
          value={productData?.measuringUnit ?? ""}
          disabled={readOnly}
          onChange={(value: string) => updateProductField("measuringUnit", value)}
        />



        {/* PREPARATION TIME – UI UNCHANGED */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold">Preparation Time</label>

          <div className="flex items-center w-full lg:w-[35%] bg-black rounded-full overflow-hidden">

            {/* Minus */}
            <button
              type="button"
              onClick={() => changePrepTime(-30)}
              disabled={readOnly}
              className="w-10 h-10 flex items-center justify-center text-white text-lg shrink-0 disabled:opacity-50"
            >
              −
            </button>

            {/* Time Display */}
            <div className="bg-white text-black text-xs h-10 px-4 flex items-center justify-center flex-1">
              {formatTime(
                productData?.preparationTime === "" ? null : Number(productData?.preparationTime)
              )}
            </div>

            {/* Plus */}
            <button
              type="button"
              onClick={() => changePrepTime(30)}
              disabled={readOnly}
              className="w-10 h-10 flex items-center justify-center text-white text-lg shrink-0 disabled:opacity-50"
            >
              +
            </button>

          </div>

        </div>
        <Input
          label="Portion Size"
          placeholder="Enter Portion Size"
          value={productData?.portionSize ?? ""}
          disabled={readOnly}
          onChange={(value: string) => updateProductField("portionSize", value)}
        />
      </div>

     
      <div className="sm:w-full lg:w-[50%] pt-3">
        <MultiSelect
          label="Allergy Information"
          options={allergyList.map(a => ({
            label: a,
            value: a,
          }))}
          value={allergies}
          onChange={handleAllergyChange}
        />

      </div>


      {/* FOOTER */}
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onPrev} className="border border-black px-4 py-2 rounded">
          Previous
        </button>
        <button onClick={onNext} className="bg-yellow-400 px-4 py-2 rounded">
          Save & Next
        </button>
      </div>
    </div>
  );
};

export default AdditionalDetails;
