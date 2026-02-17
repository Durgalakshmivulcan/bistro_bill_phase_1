import { useState, useEffect } from "react";
import Select from "../../../form/Select";
import Input from "../../../form/Input";
import { Trash2 } from "lucide-react";
import Modal from "../../../../components/ui/Modal";
import { getChannels, Channel } from "../../../../services/settingsService";
import { getBranches } from "../../../../services/branchService";

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
}

const AddNewPriceModal = ({ open, onClose, onSave }: Props) => {
  const [branch, setBranch] = useState("");
  const [variant, setVariant] = useState("");
  const [channel, setChannel] = useState("");
  const [price, setPrice] = useState("");
  const [rows, setRows] = useState<PriceRow[]>([]);

  // 🔴 MODAL STATES
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Channel state
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [branchOptions, setBranchOptions] = useState<Array<{ label: string; value: string }>>([]);

  // Fetch channels and branches on component mount
  useEffect(() => {
    const fetchChannels = async () => {
      setLoadingChannels(true);
      const response = await getChannels();
      if (response.success && response.data) {
        setChannels(response.data.filter(c => c.status === 'active'));
      }
      setLoadingChannels(false);
    };
    const fetchBranches = async () => {
      try {
        const res = await getBranches({ status: "Active" });
        if (res.success && res.data) {
          setBranchOptions([
            { label: "Select Branch Location", value: "" },
            ...res.data.branches.map((b) => ({ label: b.name, value: b.id })),
          ]);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };
    fetchChannels();
    fetchBranches();
  }, []);

  if (!open) return null;

  // 🔁 SAFE SELECT HANDLER
  const safeSet = (setter: (v: string) => void) => (val: any) => {
    if (typeof val === "string") {
      setter(val);
    } else {
      setter(val?.target?.value || "");
    }
  };

  /* ADD ROW */
  const handleAddRow = () => {
    setRows((prev) => [...prev, { variant, channel, price }]);

    setVariant("");
    setChannel("");
    setPrice("");
  };

  /* DELETE CONFIRM */
  const handleDeleteConfirm = () => {
    if (selectedIndex === null) return;

    setRows((prev) => prev.filter((_, i) => i !== selectedIndex));

    setDeleteOpen(false);
    setSuccessOpen(true);

    setTimeout(() => {
      setSuccessOpen(false);
    }, 1500);
  };

  /* SAVE ALL */
  const handleSave = () => {
    // Send data back to parent
    onSave({
      branch,
      prices: rows,
    });

    // 🔥 SHOW SUCCESS MODAL FIRST
    setSuccessOpen(true);

    // 🔁 CLOSE EVERYTHING AFTER MODAL SHOWS
    setTimeout(() => {
      setSuccessOpen(false);

      // Reset form
      setBranch("");
      setRows([]);

      // Close main modal
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      {/* MAIN PRICE MODAL */}
      <div className="bg-white rounded-lg w-[750px] p-6">
        <h2 className="font-semibold mb-4">Add New Price</h2>

        {/* Branch */}
        <Select
          label="Branch"
          options={branchOptions.length > 0 ? branchOptions : [{ label: "Select Branch Location", value: "" }]}
          value={branch}
          onChange={safeSet(setBranch)}
        />

        {/* INPUT ROW */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <Select
            label="Variant Name"
            options={[
              { label: "Select Variant", value: "" },
              { label: "Small", value: "Small" },
              { label: "Medium", value: "Medium" },
              { label: "Large", value: "Large" },
            ]}
            value={variant}
            onChange={safeSet(setVariant)}
          />

          <Select
            label="Channel"
            options={[
              { label: loadingChannels ? "Loading channels..." : "Select Channel", value: "" },
              ...channels.map(c => ({ label: c.name, value: c.name })),
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

        {/* ADD NEW PRICE */}
        <button
          onClick={handleAddRow}
          className="text-sm text-black w-full mt-4 border border-grey"
        >
          + Add New Price
        </button>

        {/* TABLE */}
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
                  <td className="p-2">{row.variant || "-"}</td>
                  <td className="p-2">{row.channel || "-"}</td>
                  <td className="p-2">₹ {row.price || "0"}</td>
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

        {/* FOOTER */}
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

      {/* 🔴 DELETE CONFIRM MODAL */}
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

      {/* 🔵 SUCCESS MODAL */}
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
