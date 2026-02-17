import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { DayOfWeek, ProductAvailabilitySchedule } from "../../../services/catalogService";

const DAYS: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_START = "09:00";
const DEFAULT_END = "22:00";

function buildDefault(): ProductAvailabilitySchedule[] {
  return DAYS.map((day) => ({
    dayOfWeek: day,
    isAvailable: true,
    startTime: DEFAULT_START,
    endTime: DEFAULT_END,
  }));
}

const AvailabilityScheduleStep = ({
  productData,
  setProductData,
  readOnly,
  onPrev,
}: any) => {
  const [alwaysAvailable, setAlwaysAvailable] = useState(true);
  const [schedule, setSchedule] = useState<ProductAvailabilitySchedule[]>(
    buildDefault()
  );

  // Initialise from productData when it loads
  useEffect(() => {
    if (productData?.availabilitySchedule && productData.availabilitySchedule.length > 0) {
      setSchedule(productData.availabilitySchedule);
      setAlwaysAvailable(false);
    } else {
      setAlwaysAvailable(true);
      setSchedule(buildDefault());
    }
  }, [productData?.availabilitySchedule]);

  const persist = (updated: ProductAvailabilitySchedule[], isAlways: boolean) => {
    setProductData((prev: any) => ({
      ...prev,
      availabilitySchedule: isAlways ? undefined : updated,
    }));
  };

  const toggleAlwaysAvailable = () => {
    const next = !alwaysAvailable;
    setAlwaysAvailable(next);
    if (next) {
      persist(schedule, true);
    } else {
      persist(schedule, false);
    }
  };

  const toggleDay = (day: DayOfWeek) => {
    const updated = schedule.map((s) =>
      s.dayOfWeek === day ? { ...s, isAvailable: !s.isAvailable } : s
    );
    setSchedule(updated);
    persist(updated, alwaysAvailable);
  };

  const updateTime = (
    day: DayOfWeek,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const updated = schedule.map((s) =>
      s.dayOfWeek === day ? { ...s, [field]: value } : s
    );
    setSchedule(updated);
    persist(updated, alwaysAvailable);
  };

  return (
    <div className="bg-bb-bg border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={18} className="text-bb-textSoft" />
        <h2 className="font-semibold">Availability Schedule</h2>
      </div>

      <p className="text-sm text-bb-textSoft mb-5">
        Set when this product is available for ordering. Leave as "Always
        Available" if no restrictions are needed.
      </p>

      {/* Always Available Toggle */}
      <label className="flex items-center gap-3 mb-6 cursor-pointer select-none">
        <div
          className={`w-11 h-6 rounded-full relative transition-colors ${
            alwaysAvailable ? "bg-green-500" : "bg-gray-300"
          } ${readOnly ? "opacity-60" : ""}`}
          onClick={() => !readOnly && toggleAlwaysAvailable()}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              alwaysAvailable ? "translate-x-5" : ""
            }`}
          />
        </div>
        <span className="text-sm font-medium">Always Available</span>
      </label>

      {/* Schedule Editor */}
      {!alwaysAvailable && (
        <div className="space-y-3">
          {schedule.map((entry) => (
            <div
              key={entry.dayOfWeek}
              className={`flex items-center gap-4 p-3 rounded-lg border ${
                entry.isAvailable
                  ? "bg-white border-gray-200"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              {/* Day toggle */}
              <label className="flex items-center gap-2 w-28 shrink-0 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={entry.isAvailable}
                  onChange={() => !readOnly && toggleDay(entry.dayOfWeek)}
                  disabled={readOnly}
                  className="w-4 h-4 accent-yellow-400"
                />
                <span
                  className={`text-sm font-medium ${
                    entry.isAvailable ? "text-bb-text" : "text-bb-textSoft"
                  }`}
                >
                  {entry.dayOfWeek}
                </span>
              </label>

              {/* Time range */}
              {entry.isAvailable ? (
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    value={entry.startTime || DEFAULT_START}
                    onChange={(e) =>
                      updateTime(entry.dayOfWeek, "startTime", e.target.value)
                    }
                    disabled={readOnly}
                    className="border rounded px-2 py-1.5 text-sm bg-white disabled:opacity-60"
                  />
                  <span className="text-bb-textSoft">to</span>
                  <input
                    type="time"
                    value={entry.endTime || DEFAULT_END}
                    onChange={(e) =>
                      updateTime(entry.dayOfWeek, "endTime", e.target.value)
                    }
                    disabled={readOnly}
                    className="border rounded px-2 py-1.5 text-sm bg-white disabled:opacity-60"
                  />
                </div>
              ) : (
                <span className="text-sm text-bb-textSoft italic">Closed</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-6">
        {onPrev && (
          <button
            onClick={onPrev}
            className="border border-black px-4 py-2 rounded"
          >
            Previous
          </button>
        )}
      </div>
    </div>
  );
};

export default AvailabilityScheduleStep;
