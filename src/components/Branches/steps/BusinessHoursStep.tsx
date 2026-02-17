import { useState, useEffect } from "react";
import { BranchFormData } from "../CreateBranchModal";

type Day = {
  name: string;
  open: boolean;
  from: string;
  to: string;
};

const defaultDays: Day[] = [
  { name: "Sunday", open: false, from: "09:00", to: "17:00" },
  { name: "Monday", open: true, from: "09:00", to: "17:00" },
  { name: "Tuesday", open: true, from: "09:00", to: "17:00" },
  { name: "Wednesday", open: true, from: "09:00", to: "17:00" },
  { name: "Thursday", open: true, from: "09:00", to: "17:00" },
  { name: "Friday", open: true, from: "09:00", to: "17:00" },
  { name: "Saturday", open: false, from: "09:00", to: "17:00" },
];

type Props = {
  data: BranchFormData;
  onChange: (data: Partial<BranchFormData>) => void;
};

export default function BusinessHoursStep({ data, onChange }: Props) {
  const [days, setDays] = useState<Day[]>(
    (data.businessHours as Day[] | undefined)?.length ? (data.businessHours as Day[]) : defaultDays
  );

  const syncToParent = (updated: Day[]) => {
    setDays(updated);
    onChange({ businessHours: updated });
  };

  const toggleDay = (index: number) => {
    const updated = [...days];
    updated[index] = { ...updated[index], open: !updated[index].open };
    syncToParent(updated);
  };

  const updateTime = (
    index: number,
    field: "from" | "to",
    value: string
  ) => {
    const updated = [...days];
    updated[index] = { ...updated[index], [field]: value };
    syncToParent(updated);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold">
          Set Standard Hours
        </h3>
        <p className="text-sm text-gray-500">
          Configure the standard hours of operation for this location.
        </p>
      </div>

      {/* DAYS */}
      <div className="space-y-4">
        {days.map((day, index) => (
          <div
            key={day.name}
            className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:items-center"
          >
            {/* DAY NAME */}
            <div className="lg:col-span-2 font-medium">
              {day.name}
            </div>

            {/* TOGGLE */}
            <div className="lg:col-span-2 flex items-center gap-2">
              <button
                onClick={() => toggleDay(index)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  day.open ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    day.open ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm">
                {day.open ? "Open" : "Closed"}
              </span>
            </div>

            {/* TIME INPUTS */}
            {day.open && (
              <div className="lg:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <input
                  type="time"
                  value={day.from}
                  onChange={(e) =>
                    updateTime(index, "from", e.target.value)
                  }
                  className="w-full sm:w-40 border rounded-md px-3 py-2 text-sm"
                />

                <span className="text-sm text-gray-500 hidden sm:block">
                  To
                </span>

                <input
                  type="time"
                  value={day.to}
                  onChange={(e) =>
                    updateTime(index, "to", e.target.value)
                  }
                  className="w-full sm:w-40 border rounded-md px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
