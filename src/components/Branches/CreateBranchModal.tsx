import { X } from "lucide-react";
import { useState, useEffect } from "react";
import BranchDetailsStep from "./steps/BranchDetailsStep";
import BusinessHoursStep from "./steps/BusinessHoursStep";
import BranchAccessStep from "./steps/BranchAccessStep";
import ReservationStep from "./steps/ReservationStep";
import KitchenStep from "./steps/KitchenStep";
import TableStep from "./steps/TableStep";
import RoomStep from "./steps/RoomStep";
import FloorAreaStep from "./steps/FloorAreaStep";
import {
  createBranch,
  updateBranch,
  getBranches,
  updateBusinessHours,
  createKitchen,
  createFloor,
  createTable,
  createRoom,
  BranchResponse,
  CreateBranchData,
  UpdateBranchData,
  BusinessHoursInput,
} from "../../services/branchService";

const steps = [
  "Branch Detail's",
  "Business Hours",
  "Access",
  "Reservations",
  "Kitchen",
  "Floor / Area",
  "Table",
  "Room",
];

type Props = {
  defaultValues?: BranchResponse | null;
  onClose: () => void;
  onSave: () => void;
};

export interface BranchFormData {
  // Branch Details
  name: string;
  code?: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  description?: string;
  orderTypes?: string[];
  image?: File | null;
  // Business Hours
  businessHours?: any[];
  // Access
  accessSettings?: any;
  // Reservations
  reservationSettings?: any;
  // Kitchen
  kitchens?: any[];
  // Floor / Area
  floors?: any[];
  // Table
  tables?: any[];
  // Room
  rooms?: any[];
}

interface CreationSummary {
  branch: boolean;
  businessHours: boolean;
  kitchens: { created: number; failed: number };
  floors: { created: number; failed: number };
  tables: { created: number; failed: number };
  rooms: { created: number; failed: number };
  errors: string[];
}

const toApiStatus = (status: unknown): "active" | "inactive" => {
  if (status === "active" || status === true) return "active";
  return "inactive";
};

export default function CreateBranchModal({ defaultValues, onClose, onSave }: Props) {
  const [step, setStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [creationSummary, setCreationSummary] = useState<CreationSummary | null>(null);

  const [formData, setFormData] = useState<BranchFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // Load default values for edit mode
  useEffect(() => {
    if (defaultValues) {
      setFormData({
        name: defaultValues.name,
        code: defaultValues.code || "",
        email: defaultValues.email || "",
        phone: defaultValues.phone || "",
        address: defaultValues.address || "",
        city: defaultValues.city || "",
        state: defaultValues.state || "",
        country: defaultValues.country || "",
        zipCode: defaultValues.zipCode || "",
      });
    }
  }, [defaultValues]);

  useEffect(() => {
    const setNextBranchCode = async () => {
      if (defaultValues) return;

      try {
        const response = await getBranches();
        if (!response.success || !response.data) return;

        const maxCode = response.data.branches.reduce((max, branch) => {
          const currentCode = branch.code?.trim();
          if (!currentCode || !/^\d{4}$/.test(currentCode)) return max;

          const numericCode = parseInt(currentCode, 10);
          return Number.isNaN(numericCode) ? max : Math.max(max, numericCode);
        }, 0);

        const nextCode = maxCode + 1;
        if (nextCode <= 9999) {
          setFormData((prev) => ({ ...prev, code: String(nextCode).padStart(4, "0") }));
        }
      } catch {
        // Keep UI resilient; backend will still assign code on save.
      }
    };

    setNextBranchCode();
  }, [defaultValues]);

  const updateFormData = (data: Partial<BranchFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const dayNameToNumber: Record<string, number> = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6,
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setProgressMessage(null);
    setCreationSummary(null);

    try {
      if (defaultValues) {
        // Update existing branch
        setProgressMessage("Updating branch...");
        const updateData: UpdateBranchData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          zipCode: formData.zipCode,
        };
        await updateBranch(defaultValues.id, updateData);
        setShowSuccess(true);
      } else {
        // Create new branch
        setProgressMessage("Creating branch...");
        const createData: CreateBranchData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          zipCode: formData.zipCode,
        };
        const branchResponse = await createBranch(createData);

        if (!branchResponse.success || !branchResponse.data) {
          throw new Error("Failed to create branch");
        }

        const branchId = branchResponse.data.branch.id;
        const summary: CreationSummary = {
          branch: true,
          businessHours: false,
          kitchens: { created: 0, failed: 0 },
          floors: { created: 0, failed: 0 },
          tables: { created: 0, failed: 0 },
          rooms: { created: 0, failed: 0 },
          errors: [],
        };

        // Step 2: Business Hours
        if (formData.businessHours?.length) {
          setProgressMessage("Setting business hours...");
          try {
            const hoursInput: BusinessHoursInput[] = formData.businessHours.map(
              (day: any) => ({
                dayOfWeek: dayNameToNumber[day.name] ?? 0,
                openTime: day.from || "09:00",
                closeTime: day.to || "17:00",
                isClosed: !day.open,
              })
            );
            await updateBusinessHours(branchId, hoursInput);
            summary.businessHours = true;
          } catch (err: any) {
            summary.errors.push(`Business hours: ${err?.message || "Failed"}`);
          }
        }

        // Step 3: Kitchens
        if (formData.kitchens?.length) {
          setProgressMessage("Creating kitchens...");
          for (const kitchen of formData.kitchens) {
            try {
              await createKitchen({
                branchId,
                name: (kitchen as any).name,
                description: (kitchen as any).category || undefined,
                status: toApiStatus((kitchen as any).status),
              });
              summary.kitchens.created++;
            } catch (err: any) {
              summary.kitchens.failed++;
              summary.errors.push(`Kitchen "${(kitchen as any).name}": ${err?.message || "Failed"}`);
            }
          }
        }

        // Step 4: Floors
        const floorIdMap: Record<string, string> = {};
        if (formData.floors?.length) {
          setProgressMessage("Creating floors...");
          for (let i = 0; i < formData.floors.length; i++) {
            const floor = formData.floors[i] as any;
            try {
              const floorResponse = await createFloor({
                branchId,
                name: floor.name,
                floorNumber: i + 1,
                status: toApiStatus(floor.status),
              });
              if (floorResponse.success && floorResponse.data) {
                floorIdMap[floor.name] = floorResponse.data.floor.id;
              }
              summary.floors.created++;
            } catch (err: any) {
              summary.floors.failed++;
              summary.errors.push(`Floor "${floor.name}": ${err?.message || "Failed"}`);
            }
          }
        }

        // Step 5: Tables (depends on floors being created)
        if (formData.tables?.length) {
          setProgressMessage("Creating tables...");
          for (const table of formData.tables) {
            const t = table as any;
            const floorId = floorIdMap[t.floor];
            if (!floorId) {
              summary.tables.failed++;
              summary.errors.push(`Table "${t.name}": Floor "${t.floor}" not found`);
              continue;
            }
            try {
              await createTable({
                floorId,
                tableNumber: t.name,
                capacity: t.capacity || 1,
                status: toApiStatus(t.status),
              });
              summary.tables.created++;
            } catch (err: any) {
              summary.tables.failed++;
              summary.errors.push(`Table "${t.name}": ${err?.message || "Failed"}`);
            }
          }
        }

        // Step 6: Rooms
        if (formData.rooms?.length) {
          setProgressMessage("Creating rooms...");
          for (let i = 0; i < formData.rooms.length; i++) {
            const room = formData.rooms[i] as any;
            try {
              await createRoom({
                branchId,
                name: room.name,
                roomNumber: `R${i + 1}`,
                capacity: 1,
                status: toApiStatus(room.status),
              });
              summary.rooms.created++;
            } catch (err: any) {
              summary.rooms.failed++;
              summary.errors.push(`Room "${room.name}": ${err?.message || "Failed"}`);
            }
          }
        }

        setCreationSummary(summary);
        setProgressMessage(null);
        setShowSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save branch");
      console.error("Error saving branch:", err);
    } finally {
      setLoading(false);
      setProgressMessage(null);
    }
  };

  const handleNext = () => {
    if (step === 7) {
      handleSave();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-2 sm:px-4">
      <div className="bg-white w-full sm:w-[95%] max-w-6xl rounded-xl sm:rounded-2xl p-4 sm:p-6 relative max-h-[95vh] overflow-y-auto">
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 sm:right-4 sm:top-4 text-gray-500"
        >
          <X />
        </button>

        {/* TITLE */}
        <h2 className="text-xl sm:text-2xl font-bold mb-4">
          {defaultValues ? "Edit Branch" : "Create New Branch"}
        </h2>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* STEPPER */}
        <div className="flex gap-3 text-sm mb-6 overflow-x-auto pb-2">
          {steps.map((label, index) => (
            <div
              key={label}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border ${
                  index <= step ? "bg-yellow-400 font-bold" : "bg-white"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-xs sm:text-sm ${
                  index <= step ? "font-semibold" : "text-gray-500"
                }`}
              >
                {label}
              </span>
              {index < steps.length - 1 && (
                <span className="hidden sm:inline">›</span>
              )}
            </div>
          ))}
        </div>

        {/* STEP CONTENT */}
        <div className="border rounded-lg sm:rounded-xl p-4 sm:p-6">
          {step === 0 && (
            <BranchDetailsStep
              data={formData}
              onChange={updateFormData}
            />
          )}
          {step === 1 && (
            <BusinessHoursStep
              data={formData}
              onChange={updateFormData}
            />
          )}
          {step === 2 && (
            <BranchAccessStep
              data={formData}
              onChange={updateFormData}
            />
          )}
          {step === 3 && (
            <ReservationStep
              data={formData}
              onChange={updateFormData}
            />
          )}
          {step === 4 && (
            <KitchenStep
              data={formData}
              onChange={updateFormData}
            />
          )}
          {step === 5 && (
            <FloorAreaStep
              data={formData}
              onChange={updateFormData}
            />
          )}
          {step === 6 && (
            <TableStep
              data={formData}
              onChange={updateFormData}
            />
          )}
          {step === 7 && (
            <RoomStep
              data={formData}
              onChange={updateFormData}
            />
          )}
        </div>

        {/* PROGRESS INDICATOR */}
        {progressMessage && (
          <div className="mt-4 flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">{progressMessage}</span>
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="border px-4 py-2 rounded-md w-full sm:w-auto disabled:opacity-50"
          >
            Cancel
          </button>

          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              disabled={loading}
              className="border px-4 py-2 rounded-md w-full sm:w-auto disabled:opacity-50"
            >
              Previous
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={loading}
            className="bg-yellow-400 px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : step === 7 ? "Save" : "Save & Next"}
          </button>
        </div>
      </div>
      {showSuccess && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[90%] max-w-md p-6 relative text-center">
            {/* CLOSE */}
            <button
              onClick={() => {
                setShowSuccess(false);
                onClose(); // close whole create modal
              }}
              className="absolute right-4 top-4 text-gray-500 text-xl"
            >
              ✕
            </button>

            {/* ICON */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            {/* TEXT */}
            <h2 className="text-xl font-bold mb-2">
              {defaultValues ? "Branch Updated Successfully" : "Branch Created Successfully"}
            </h2>
            {creationSummary ? (
              <div className="text-sm text-gray-600 text-left space-y-1 mt-2">
                <p>Branch: Created</p>
                {creationSummary.businessHours && <p>Business Hours: Configured</p>}
                {creationSummary.kitchens.created > 0 && (
                  <p>Kitchens: {creationSummary.kitchens.created} created{creationSummary.kitchens.failed > 0 ? `, ${creationSummary.kitchens.failed} failed` : ""}</p>
                )}
                {creationSummary.floors.created > 0 && (
                  <p>Floors: {creationSummary.floors.created} created{creationSummary.floors.failed > 0 ? `, ${creationSummary.floors.failed} failed` : ""}</p>
                )}
                {creationSummary.tables.created > 0 && (
                  <p>Tables: {creationSummary.tables.created} created{creationSummary.tables.failed > 0 ? `, ${creationSummary.tables.failed} failed` : ""}</p>
                )}
                {creationSummary.rooms.created > 0 && (
                  <p>Rooms: {creationSummary.rooms.created} created{creationSummary.rooms.failed > 0 ? `, ${creationSummary.rooms.failed} failed` : ""}</p>
                )}
                {creationSummary.errors.length > 0 && (
                  <div className="mt-2 bg-red-50 border border-red-200 text-red-700 p-2 rounded text-xs">
                    <p className="font-medium mb-1">Some operations failed:</p>
                    {creationSummary.errors.slice(0, 3).map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                    {creationSummary.errors.length > 3 && (
                      <p>...and {creationSummary.errors.length - 3} more</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Your branch has been {defaultValues ? "updated" : "created"} and is ready to use.
              </p>
            )}

            {/* ACTION */}
            <button
              onClick={() => {
                setShowSuccess(false);
                onSave(); // Notify parent to refresh list
                onClose();
              }}
              className="mt-6 bg-yellow-400 px-6 py-2 rounded-md font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
