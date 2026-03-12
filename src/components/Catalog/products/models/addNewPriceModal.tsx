import { useState, useEffect } from "react";
import Select from "../../../form/Select";
import Input from "../../../form/Input";
import { Trash2 } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import { getChannels, Channel } from "../../../../services/settingsService";
import { getBranches } from "../../../../services/branchService";
import { listProductVariants } from "../../../../services/catalogService";

import deleteImg from "../../../../assets/deleteConformImg.png";
import tickImg from "../../../../assets/deleteSuccessImg.png";

interface PriceRow {
  variant: string;
  channel: string;
  price: string;
}

interface PriceItem {
  branch: string;
  prices: PriceRow[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: PriceItem) => void;
  productId?: string;
  localVariants?: Array<{ id: string | number; name: string; status?: string | boolean }>;
}

const AddNewPriceModal = ({ open, onClose, onSave, productId, localVariants = [] }: Props) => {
  const [branch, setBranch] = useState("");
  const [variant, setVariant] = useState("");
  const [channel, setChannel] = useState("");
  const [price, setPrice] = useState("");
  const [rows, setRows] = useState<PriceRow[]>([]);

  // Delete/success modal states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Dynamic dropdown states
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [variants, setVariants] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [branchOptions, setBranchOptions] = useState<Array<{ label: string; value: string }>>([]);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoadingChannels(true);
        const response = await getChannels();
        if (response.success && response.data) {
          setChannels(response.data.filter((c) => c.status === "active"));
        } else {
          setChannels([
            { id: "dinein", name: "DineIn", status: "active" },
            { id: "takeaway", name: "TakeAway", status: "active" },
            { id: "delivery", name: "Delivery", status: "active" },
          ]);
        }
      } catch (err) {
        console.error("Failed to load channels:", err);
        setChannels([
          { id: "dinein", name: "DineIn", status: "active" },
          { id: "takeaway", name: "TakeAway", status: "active" },
          { id: "delivery", name: "Delivery", status: "active" },
        ]);
      } finally {
        setLoadingChannels(false);
      }
    };

    const fetchBranches = async () => {
      try {
        const res = await getBranches({ status: "active" });
        if (res.success && res.data) {
          setBranchOptions([
            { label: "Select Branch Location", value: "" },
            ...res.data.branches.map((b) => ({ label: b.name, value: b.id })),
          ]);
        } else {
          setBranchOptions([{ label: "Select Branch Location", value: "" }]);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
        setBranchOptions([{ label: "Select Branch Location", value: "" }]);
      }
    };

    const fetchVariants = async () => {
      if (!productId && localVariants.length === 0) {
        setVariants([]);
        return;
      }

      if (productId) {
        try {
          setLoadingVariants(true);
          const response = await listProductVariants(productId);
          if (response.success && response.data) {
            setVariants(
              (response.data.variants || [])
                .filter((v) => String(v.status || "").toLowerCase() === "active")
                .map((v) => ({ id: String(v.id), name: v.name, status: String(v.status || "active") }))
            );
          } else {
            setVariants([]);
          }
        } catch (err) {
          console.error("Failed to load variants:", err);
          setVariants([]);
        } finally {
          setLoadingVariants(false);
        }
      } else {
        setVariants(
          localVariants
            .filter((v) => String(v.status ?? "active").toLowerCase() !== "inactive")
            .map((v) => ({ id: String(v.id), name: v.name, status: "active" }))
        );
      }
    };

    fetchChannels();
    fetchBranches();
    fetchVariants();
  }, [productId, localVariants]);

  if (!open) return null;

  const safeSet = (setter: (v: string) => void) => (val: any) => {
    if (typeof val === "string") {
      setter(val);
    } else {
      setter(val?.target?.value || "");
    }
  };

  const getVariantLabel = (variantId: string) => {
    if (!variantId) return "Base Product";
    const selected = variants.find((v) => v.id === variantId);
    return selected?.name || variantId;
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, { variant, channel, price }]);
    setVariant("");
    setChannel("");
    setPrice("");
  };

  const handleDeleteConfirm = () => {
    if (selectedIndex === null) return;

    setRows((prev) => prev.filter((_, i) => i !== selectedIndex));
    setDeleteOpen(false);
    setSuccessOpen(true);

    setTimeout(() => {
      setSuccessOpen(false);
    }, 1500);
  };

  const handleSave = () => {
    onSave({
      branch,
      prices: rows,
    });

    setSuccessOpen(true);

    setTimeout(() => {
      setSuccessOpen(false);
      setBranch("");
      setRows([]);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[750px] p-6">
        <h2 className="font-semibold mb-4">Add New Price</h2>

        <Select
          label="Branch"
          options={branchOptions.length > 0 ? branchOptions : [{ label: "Select Branch Location", value: "" }]}
          value={branch}
          onChange={safeSet(setBranch)}
        />

        <div className="grid grid-cols-3 gap-4 mt-4">
          <Select
            label="Variant Name"
            options={[
              { label: loadingVariants ? "Loading variants..." : "Base Product", value: "" },
              ...variants.map((v) => ({ label: v.name, value: v.id })),
            ]}
            value={variant}
            onChange={safeSet(setVariant)}
            disabled={loadingVariants}
          />

          <Select
            label="Channel"
            options={[
              { label: loadingChannels ? "Loading channels..." : "Select Channel", value: "" },
              ...channels.map((c) => ({ label: c.name, value: c.name })),
            ]}
            value={channel}
            onChange={safeSet(setChannel)}
            disabled={loadingChannels}
          />

          <Input
            label="Price"
            placeholder="Enter Price"
            value={price}
            onChange={(value: string) => setPrice(value)}
          />
        </div>

        <button
          onClick={handleAddRow}
          className="text-sm text-black w-full mt-4 border border-grey"
        >
          + Add New Price
        </button>

        <table className="w-full text-sm border mt-4">
          <thead className="bg-yellow-400">
            <tr>
              <th className="p-2">Variant Name</th>
              <th className="p-2">Channel</th>
              <th className="p-2">Price</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No price added
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{getVariantLabel(row.variant)}</td>
                  <td className="p-2">{row.channel || "-"}</td>
                  <td className="p-2">Rs {row.price || "0"}</td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => {
                        setSelectedIndex(idx);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="border px-4 py-2 rounded">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-yellow-400 px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Delete</h2>

        <div className="flex justify-center mb-4">
          <img src={deleteImg} alt="Delete" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600 mb-6">
          This action cannot be undone. <br />
          Do you want to proceed with deletion?
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setDeleteOpen(false)}
            className="border border-black px-6 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleDeleteConfirm}
            className="bg-yellow-400 px-8 py-2 rounded font-medium"
          >
            Yes
          </button>
        </div>
      </Modal>

      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">Success!</h2>

        <div className="flex justify-center mb-6">
          <img src={tickImg} alt="Success" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          Price details saved successfully.
        </p>
      </Modal>
    </div>
  );
};

export default AddNewPriceModal;

