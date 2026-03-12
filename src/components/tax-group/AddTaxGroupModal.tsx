import { useMemo, useState, useEffect } from "react";
import Modal from "../ui/Modal";
import { createTaxGroup, getTaxes, Tax } from "../../services/settingsService";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const AddTaxGroupModal: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [groupName, setGroupName] = useState("");
  const [mixOf, setMixOf] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [availableTaxes, setAvailableTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTaxes, setLoadingTaxes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchTaxes();
    }
  }, [open]);

  const fetchTaxes = async () => {
    try {
      setLoadingTaxes(true);
      const response = await getTaxes({ status: 'active' });
      if (response.success && response.data) {
        setAvailableTaxes(response.data);
      }
    } catch (err) {
      console.error('Error fetching taxes:', err);
    } finally {
      setLoadingTaxes(false);
    }
  };

  const normalize = (value: string) => value.trim().toLowerCase();

  const parseMixOf = (value: string) =>
    value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

  const buildTaxKeyMap = (taxes: Tax[]) => {
    const map = new Map<string, string>();
    for (const tax of taxes) {
      const name = (tax.name || "").trim();
      if (!name) continue;

      const beforeParen = name.split("(")[0]?.trim() || name;
      const firstToken = name.split(/[ (]/)[0]?.trim() || name;

      for (const key of [name, beforeParen, firstToken]) {
        const normalizedKey = normalize(key);
        if (!normalizedKey) continue;
        if (!map.has(normalizedKey)) {
          map.set(normalizedKey, tax.id);
        }
      }
    }
    return map;
  };

  const resolveTaxIdsFromMixOf = (value: string) => {
    const parts = parseMixOf(value);
    const keyMap = buildTaxKeyMap(availableTaxes);
    const ids: string[] = [];
    const unknown: string[] = [];

    for (const part of parts) {
      const id = keyMap.get(normalize(part));
      if (id) {
        if (!ids.includes(id)) ids.push(id);
      } else {
        unknown.push(part);
      }
    }

    return { ids, unknown };
  };

  const resolvedMix = useMemo(() => resolveTaxIdsFromMixOf(mixOf), [mixOf, availableTaxes]);

  const handleSave = async () => {
    if (!groupName.trim()) {
      setError("Please enter a group name");
      return;
    }

    if (resolvedMix.unknown.length > 0) {
      setError(`Unknown tax name(s): ${resolvedMix.unknown.join(", ")}`);
      return;
    }

    if (resolvedMix.ids.length === 0) {
      setError("Please enter at least one tax in Mix of");
      return;
    }

    if (!taxRate.trim()) {
      setError("Please enter the tax rate");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await createTaxGroup({
        name: groupName,
        taxIds: resolvedMix.ids,
        status: 'active'
      });

      if (response.success) {
        handleClose();
        onSuccess();
      } else {
        setError(response.message || 'Failed to create tax group');
      }
    } catch (err) {
      setError('An error occurred while creating the tax group');
      console.error('Error creating tax group:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName("");
    setMixOf("");
    setTaxRate("");
    setError(null);
    onClose();
  };

  return (
<Modal open={open} onClose={handleClose}>
  <div className="w-[760px] px-10 py-8">

    {/* Title */}
    <h2 className="text-[30px] font-bold mb-8">
      Add New Tax Group
    </h2>

    {error && (
      <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
        {error}
      </div>
    )}

    {/* FORM */}
    <div className="grid grid-cols-2 gap-x-8 gap-y-6">

      {/* Tax Group Name */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Tax Group Name <span className="text-red-500">*</span>
        </label>

        <input
          placeholder="Dual Tax"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full h-[46px] border border-gray-300 rounded-md px-4 text-sm"
        />
      </div>

      {/* Mix Of */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Mix of
        </label>

        <input
          placeholder="CGST,SGST"
          value={mixOf}
          onChange={(e) => setMixOf(e.target.value)}
          className="w-full h-[46px] border border-gray-300 rounded-md px-4 text-sm"
        />
      </div>

      {/* Tax Rate INPUT (not dropdown) */}
      <div className="col-span-1">
        <label className="block text-sm font-medium mb-2">
          Tax Rate <span className="text-red-500">*</span>
        </label>

        <input
          placeholder="12%"
          value={taxRate}
          onChange={(e) => {
            setTaxRate(e.target.value);
          }}
          className="w-full h-[46px] border border-gray-300 rounded-md px-4 text-sm"
        />
      </div>

    </div>

    {/* Buttons */}
    <div className="flex justify-end gap-4 mt-10">

      <button
        onClick={handleClose}
        disabled={loading}
        className="px-8 h-[44px] border border-black rounded-md text-sm font-medium"
      >
        Cancel
      </button>

      <button
        onClick={handleSave}
        disabled={loading || loadingTaxes}
        className="px-8 h-[44px] bg-yellow-400 rounded-md text-sm font-medium hover:bg-yellow-500"
      >
        {loading ? "Saving..." : "Save"}
      </button>

    </div>

  </div>
</Modal>
  );
};

export default AddTaxGroupModal;
