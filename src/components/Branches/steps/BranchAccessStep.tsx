import { useEffect, useMemo, useState } from "react";
import Checkbox from "../../form/Checkbox";
import Select from "../../form/Select";
import { BranchFormData } from "../CreateBranchModal";
import { getStaff, type Staff as StaffMember } from "../../../services/staffService";

type Props = {
  data: BranchFormData;
  onChange: (data: Partial<BranchFormData>) => void;
};

type AccessItem = {
  name: string;
  mode: "manage" | "predefined";
};

const initialAccess: AccessItem[] = [
  { name: "Taxes & Payments", mode: "manage" },
  { name: "Preferences", mode: "manage" },
  { name: "Charges", mode: "manage" },
  { name: "Reasons", mode: "manage" },
  { name: "Templates", mode: "manage" },
];

export default function AccessStep({ data, onChange }: Props) {
  const [accessList, setAccessList] = useState(initialAccess);
  const [managers, setManagers] = useState<StaffMember[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [managerError, setManagerError] = useState<string | null>(null);

  const [options, setOptions] = useState({
    multipleKitchens: true,
    tableReservation: true,
    qrOrdering: true,
  });

  useEffect(() => {
    const loadManagers = async () => {
      setLoadingManagers(true);
      setManagerError(null);
      try {
        const response = await getStaff();
        if (response.success && response.data) {
          const managerStaff = response.data.staff.filter(
            (staff) =>
              staff.roleName?.toLowerCase() === "manager" &&
              staff.status?.toLowerCase() === "active"
          );
          setManagers(managerStaff);
        } else {
          setManagerError(response.error?.message || "Failed to load managers");
        }
      } catch (err) {
        setManagerError(err instanceof Error ? err.message : "Failed to load managers");
      } finally {
        setLoadingManagers(false);
      }
    };

    loadManagers();
  }, []);

  const managerOptions = useMemo(
    () =>
      managers.map((staff) => ({
        label: `${staff.firstName} ${staff.lastName}`.trim(),
        value: staff.id,
      })),
    [managers]
  );

  const selectedManagerStaffId = data.accessSettings?.managerStaffId || "";

  const updateMode = (index: number, mode: "manage" | "predefined") => {
    const updated = [...accessList];
    updated[index].mode = mode;
    setAccessList(updated);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <h3 className="text-base sm:text-lg font-semibold">
        Access Control
      </h3>

      {/* ACCESS TABLE */}
      <div className="border rounded-xl overflow-hidden">
        {/* TABLE HEADER */}
        <div className="grid grid-cols-3 bg-yellow-400 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium">
          <span>Provide Access</span>
          <span className="text-center">Manage</span>
          <span className="text-center">Use-Predefined</span>
        </div>

        {/* TABLE BODY */}
        {accessList.map((item, index) => (
          <div
            key={item.name}
            className="grid grid-cols-3 px-3 sm:px-4 py-3 text-xs sm:text-sm items-center border-t even:bg-[#FFF8E7]"
          >
            <span>{item.name}</span>

            <div className="flex justify-center">
              <input
                type="radio"
                checked={item.mode === "manage"}
                onChange={() => updateMode(index, "manage")}
                className="h-4 w-4 accent-green-500"
              />
            </div>

            <div className="flex justify-center">
              <input
                type="radio"
                checked={item.mode === "predefined"}
                onChange={() => updateMode(index, "predefined")}
                className="h-4 w-4 accent-gray-400"
              />
            </div>
          </div>
        ))}
      </div>

      {/* CHECKBOX OPTIONS */}
      <div className="space-y-2">
        <Checkbox
          label="Have Multiple Kitchens"
          checked={options.multipleKitchens}
          onChange={(val) =>
            setOptions({ ...options, multipleKitchens: val })
          }
        />

        <Checkbox
          label="Allow Table Reservations"
          checked={options.tableReservation}
          onChange={(val) =>
            setOptions({ ...options, tableReservation: val })
          }
        />

        <Checkbox
          label="Allow Table QR Ordering"
          checked={options.qrOrdering}
          onChange={(val) =>
            setOptions({ ...options, qrOrdering: val })
          }
        />
      </div>

      {/* ASSIGN MANAGER */}
      <div className="max-w-full sm:max-w-xs">
        <Select
          label="Assign Branch Manager"
          required
          value={selectedManagerStaffId}
          disabled={loadingManagers}
          options={managerOptions}
          onChange={(value) => {
            const selectedManager = managers.find((staff) => staff.id === value);
            onChange({
              accessSettings: {
                ...(data.accessSettings || {}),
                managerStaffId: value,
                managerName: selectedManager
                  ? `${selectedManager.firstName} ${selectedManager.lastName}`.trim()
                  : "",
              },
            });
          }}
        />
        {loadingManagers && (
          <p className="mt-1 text-xs text-gray-500">Loading managers...</p>
        )}
        {managerError && (
          <p className="mt-1 text-xs text-red-600">{managerError}</p>
        )}
      </div>
    </div>
  );
}
