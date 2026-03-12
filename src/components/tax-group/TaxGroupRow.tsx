import { useMemo, useState, useEffect } from "react";
import ActionMenu from "../Common/ActionMenu";
import Modal from "../ui/Modal";
import { deleteTaxGroup, updateTaxGroup, getTaxes, Tax, TaxGroup } from "../../services/settingsService";
import { CRUDToasts } from "../../utils/toast";
import { showUpdatedSweetAlert } from "../../utils/swalAlerts";

type Props = {
  group: TaxGroup;
  onEditSuccess: () => void;
  onDeleteSuccess: () => void;
};

const TaxGroupRow: React.FC<Props> = ({
  group,
  onEditSuccess,
  onDeleteSuccess,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);

  const [groupName, setGroupName] = useState("");
  const [mixOf, setMixOf] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [availableTaxes, setAvailableTaxes] = useState<Tax[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingTaxes, setLoadingTaxes] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const formatPercent = (value: number) => {
    if (!Number.isFinite(value) || value === 0) return "0%";
    const text = value % 1 === 0 ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
    return `${text}%`;
  };

  const initialMixOf = useMemo(() => {
    if (!group.taxGroupItems || group.taxGroupItems.length === 0) return "";
    return group.taxGroupItems
      .map((item) => {
        const name = (item.tax?.name || "").trim();
        if (!name) return "";
        return name.split("(")[0]?.trim() || name;
      })
      .filter(Boolean)
      .join(", ");
  }, [group]);

  const initialTaxRate = useMemo(() => {
    if (!group.taxGroupItems || group.taxGroupItems.length === 0) return "";
    const sum = group.taxGroupItems.reduce((acc, item) => acc + (Number(item.tax?.percentage) || 0), 0);
    return formatPercent(sum);
  }, [group]);

  useEffect(() => {
    if (showEditModal) {
      setGroupName(group.name);
      setMixOf(initialMixOf);
      setTaxRate(initialTaxRate);
      fetchTaxes();
    }
  }, [showEditModal, group, initialMixOf, initialTaxRate]);

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

  const handleEdit = async () => {
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
      const response = await updateTaxGroup(group.id, {
        name: groupName,
        taxIds: resolvedMix.ids,
      });

      if (response.success) {
        setShowEditModal(false);
        onEditSuccess();
        await showUpdatedSweetAlert({
          title: "Tax Group Updated",
          message: "Tax Group Details Updated Successfully!",
        });
      } else {
        setError(response.message || 'Failed to update tax group');
      }
    } catch (err) {
      setError('An error occurred while updating the tax group');
      console.error('Error updating tax group:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (): Promise<boolean> => {
    try {
      const response = await deleteTaxGroup(group.id);

      if (response.success) {
        CRUDToasts.deleted("Tax Group");
        onDeleteSuccess();
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error('Error deleting tax group:', err);
      return false;
    } finally {
    }
  };

  const handleCloseEditModal = () => {
    setGroupName("");
    setMixOf("");
    setTaxRate("");
    setError(null);
    setShowEditModal(false);
  };

  const getMixOf = () => {
    if (!group.taxGroupItems || group.taxGroupItems.length === 0) return "-";
    return group.taxGroupItems
      .map((item) => {
        const name = (item.tax?.name || "").trim();
        if (!name) return "";
        return name.split("(")[0]?.trim() || name;
      })
      .filter(Boolean)
      .join(", ");
  };

  const getPercentage = () => {
    if (!group.taxGroupItems || group.taxGroupItems.length === 0) return "-";
    const sum = group.taxGroupItems.reduce((acc, item) => acc + (Number(item.tax?.percentage) || 0), 0);
    return formatPercent(sum);
  };

  return (
    <>
      <tr className="border-b last:border-none even:bg-[#FFF9E8]">
        <td className="px-6 py-4">{group.name}</td>
        <td className="px-6 py-4">{getMixOf()}</td>
        <td className="px-6 py-4">{getPercentage()}</td>
        <td className="px-6 py-4">
          <ActionMenu
            deleteEntityName="Tax group"
            successTimerMs={null}
            onEdit={() => setShowEditModal(true)}
            onDelete={handleDelete}
          />
        </td>
      </tr>

      {/* ================= EDIT TAX GROUP MODAL ================= */}
      <Modal open={showEditModal} onClose={handleCloseEditModal}>
        <div className="w-[760px] px-10 py-8">
          {/* Title */}
          <h2 className="text-[30px] font-bold mb-8">
            Edit Tax Group
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

            {/* Tax Rate */}
            <div className="col-span-1">
              <label className="block text-sm font-medium mb-2">
                Tax Rate <span className="text-red-500">*</span>
              </label>

              <input
                placeholder="12%"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full h-[46px] border border-gray-300 rounded-md px-4 text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-10">
            <button
              onClick={handleCloseEditModal}
              className="px-8 h-[44px] border border-black rounded-md text-sm font-medium"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              onClick={handleEdit}
              className="px-8 h-[44px] bg-yellow-400 rounded-md text-sm font-medium hover:bg-yellow-500 disabled:opacity-50"
              disabled={loading || loadingTaxes}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

    </>
  );
};

export default TaxGroupRow;
