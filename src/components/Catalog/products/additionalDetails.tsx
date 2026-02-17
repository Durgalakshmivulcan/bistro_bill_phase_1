import { useState } from "react";
import Select from "../../form/Select";
import Input from "../../form/Input";
import MultiSelect from "../../form/Multiselect";

const chargesList = ["Convenience Fee", "Packing Charges"];
const allergyList = ["Peanut Allergy", "Egg Allergy", "Milk Allergy"];

const AdditionalDetails = ({ onNext, onPrev }: any) => {
  const [charges, setCharges] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);

  const [serves, setServes] = useState("");
  const [serveUnit, setServeUnit] = useState("");
  const [portionSize, setPortionSize] = useState("");
  const [prepTime] = useState("02:00 Hrs");
  const [prepMinutes, setPrepMinutes] = useState<number | null>(null);

  const formatTime = (minutes: number | null) => {
    if (minutes === null || minutes <= 0) return "Enter Time";

    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${String(hrs).padStart(2, "0")} : ${String(mins).padStart(
      2,
      "0"
    )} Hrs`;
  };
  const increaseTime = () => {
    setPrepMinutes(prev => (prev === null ? 30 : prev + 30));
  };

  const decreaseTime = () => {
    setPrepMinutes(prev => {
      if (prev === null || prev <= 30) return null;
      return prev - 30;
    });
  };

  /* MULTI SELECT HANDLER */
  const handleMultiSelect = (
    value: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (!value) return;
    if (!list.includes(value)) {
      setList([...list, value]);
    }
  };

  const removeItem = (
    value: string,
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(prev => prev.filter(item => item !== value));
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
          onChange={setCharges}
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
          value={serves}
          onChange={(value: string) => setServes(value)}
        />

        <Input
          label="Serve Size Unit"
          placeholder="Enter Serve Size Unit"
          value={serveUnit}
          onChange={(value: string) => setServeUnit(value)}
        />



        {/* PREPARATION TIME – UI UNCHANGED */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold">Preparation Time</label>

          <div className="flex items-center w-full lg:w-[35%] bg-black rounded-full overflow-hidden">

            {/* Minus */}
            <button
              onClick={decreaseTime}
              className="w-10 h-10 flex items-center justify-center text-white text-lg shrink-0"
            >
              −
            </button>

            {/* Time Display */}
            <div className="bg-white text-black text-xs h-10 px-4 flex items-center justify-center flex-1">
              {formatTime(prepMinutes)}
            </div>

            {/* Plus */}
            <button
              onClick={increaseTime}
              className="w-10 h-10 flex items-center justify-center text-white text-lg shrink-0"
            >
              +
            </button>

          </div>

        </div>
        <Input
          label="Portion Size"
          placeholder="Enter Portion Size"
          value={portionSize}
          onChange={(value: string) => setPortionSize(value)}
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
          onChange={setAllergies}
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
