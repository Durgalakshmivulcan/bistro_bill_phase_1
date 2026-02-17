import { useState } from "react";
import Checkbox from "../../form/Checkbox";
import { BranchFormData } from "../CreateBranchModal";

type Props = {
  data: BranchFormData;
  onChange: (data: Partial<BranchFormData>) => void;
};

type Day = {
  name: string;
  open: boolean;
  from: string;
  to: string;
};

const defaultDays: Day[] = [
  { name: "Sunday", open: false, from: "13:00", to: "23:00" },
  { name: "Monday", open: true, from: "13:00", to: "23:00" },
  { name: "Tuesday", open: true, from: "13:00", to: "23:00" },
  { name: "Wednesday", open: true, from: "13:00", to: "23:00" },
  { name: "Thursday", open: true, from: "13:00", to: "23:00" },
  { name: "Friday", open: true, from: "13:00", to: "23:00" },
  { name: "Saturday", open: true, from: "13:00", to: "23:00" },
];

export default function ReservationStep({ data, onChange }: Props) {
  const [days, setDays] = useState<Day[]>(defaultDays);

  const [noReservationsToday, setNoReservationsToday] = useState(false);
  const [allTablesReserved, setAllTablesReserved] = useState(false);

  const toggleDay = (index: number) => {
    const updated = [...days];
    updated[index].open = !updated[index].open;
    setDays(updated);
  };

  const updateTime = (
    index: number,
    field: "from" | "to",
    value: string
  ) => {
    const updated = [...days];
    updated[index][field] = value;
    setDays(updated);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h3 className="text-lg font-semibold">Booking Working Days</h3>
      </div>

      {/* DAYS */}
      <div className="space-y-4">
        {days.map((day, index) => (
          <div
            key={day.name}
            className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
          >
            {/* DAY NAME */}
            <div className="md:col-span-2 font-medium">
              {day.name}
            </div>

            {/* TOGGLE */}
            <div className="md:col-span-2 flex items-center gap-3">
              <button
                onClick={() => toggleDay(index)}
                className={`relative inline-flex h-6 w-12 items-center rounded-full transition ${
                  day.open ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    day.open ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>

              <span className="text-sm">
                {day.open ? "Open" : "Closed"}
              </span>
            </div>

            {/* TIME INPUTS */}
            {day.open && (
              <>
                <div className="md:col-span-3">
                  <input
                    type="time"
                    value={day.from}
                    onChange={(e) =>
                      updateTime(index, "from", e.target.value)
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div className="md:col-span-1 text-center text-sm">
                  To
                </div>

                <div className="md:col-span-3">
                  <input
                    type="time"
                    value={day.to}
                    onChange={(e) =>
                      updateTime(index, "to", e.target.value)
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* CHECKBOX OPTIONS */}
      <div className="space-y-3 pt-4">
        <Checkbox
          label="Mark Today No Reservations Available"
          checked={noReservationsToday}
          onChange={setNoReservationsToday}
        />

        <Checkbox
          label="Mark All Tables are Reserved"
          checked={allTablesReserved}
          onChange={setAllTablesReserved}
        />
      </div>
    </div>
  );
}
