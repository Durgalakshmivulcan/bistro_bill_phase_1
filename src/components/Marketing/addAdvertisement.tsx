import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../form/Input";
import Select from "../form/Select";
import Textarea from "../form/Textarea";
import MultiSelect from "../form/Multiselect";
import Modal from "../ui/Modal";
import successImg from "../../assets/tick.png";
import { createAdvertisement, getDiscounts } from "../../services/marketingService";
import { getBranches } from "../../services/branchService";

export default function CreateAdvertisement() {
  const navigate = useNavigate();

  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [discountOptions, setDiscountOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [branchOptions, setBranchOptions] = useState<Array<{ label: string; value: string }>>([]);

  const [form, setForm] = useState({
    title: "",
    status: "active" as "active" | "inactive",
    startDate: "",
    endDate: "",
    description: "",
  });

  useEffect(() => {
    loadDiscounts();
    loadBranches();
  }, []);

  const loadDiscounts = async () => {
    try {
      const response = await getDiscounts();
      if (response.data) {
        const options = response.data.map(discount => ({
          label: `${discount.code} - ${discount.name}`,
          value: discount.id,
        }));
        setDiscountOptions(options);
      }
    } catch (err) {
      console.error('Error loading discounts:', err);
    }
  };

  const loadBranches = async () => {
    try {
      setLoadingBranches(true);
      const response = await getBranches({ status: 'Active' });
      if (response.success && response.data) {
        const options = response.data.branches.map(branch => ({
          label: branch.name,
          value: branch.id,
        }));
        setBranchOptions(options);
      }
    } catch (err) {
      console.error('Error loading branches:', err);
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleSave = async () => {
    if (!form.title) {
      alert('Please fill in the title');
      return;
    }

    try {
      setLoading(true);
      await createAdvertisement({
        title: form.title,
        description: form.description,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        discountIds: selectedDiscounts,
      });
      setShowSuccess(true);
    } catch (err: any) {
      console.error('Error creating advertisement:', err);
      alert(err.message || 'Failed to create advertisement');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-bb-bg min-h-screen p-4 sm:p-6 space-y-6">
      {/* TITLE */}
      <h1 className="text-[28px] sm:text-[35px] font-bold">
        Create Advertisement
      </h1>

      {/* FORM CARD */}
      <div className="border border-bb-coloredborder p-4 sm:p-6 rounded-xl space-y-6">
        {/* BASIC DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Title"
            required
            placeholder="Enter Title"
            value={form.title}
            onChange={(value) => setForm({ ...form, title: value })}
          />

          <Select
            label="Status"
            required
            value={form.status}
            onChange={(value) => setForm({ ...form, status: value as "active" | "inactive" })}
            options={[
              { label: "Select Status", value: "" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />

          <Input
            label="Start Date"
            required
            type="text"
            placeholder="Choose Start Date"
            value={form.startDate}
            onChange={(value) => setForm({ ...form, startDate: value })}
            onFocus={(e) => (e.currentTarget.type = "date")}
            onBlur={(e) => {
              if (!e.currentTarget.value) e.currentTarget.type = "text";
            }}
          />

          <Input
            label="End Date"
            required
            type="text"
            placeholder="Choose End Date"
            value={form.endDate}
            onChange={(value) => setForm({ ...form, endDate: value })}
            onFocus={(e) => (e.currentTarget.type = "date")}
            onBlur={(e) => {
              if (!e.currentTarget.value) e.currentTarget.type = "text";
            }}
          />
        </div>

        {/* MULTI SELECTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MultiSelect
            label="Discount Code"
            required
            options={discountOptions}
            value={selectedDiscounts}
            onChange={setSelectedDiscounts}
          />

          <MultiSelect
            label="Branch"
            required
            options={branchOptions}
            value={selectedBranches}
            onChange={setSelectedBranches}
          />
        </div>

        {/* DESCRIPTION */}
        <Textarea
          label="Description"
          placeholder="Type Here..."
        />
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <button
          onClick={() => navigate(-1)}
          className="border px-4 py-2 rounded border-black w-full sm:w-auto"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-yellow-400 px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
            <Modal
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          navigate(-1);
        }}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Advertisement Added</h2>

        <div className="flex justify-center mb-4">
          <img src={successImg} alt="success" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
       New Advertisement has been added successfully.
        </p>
      </Modal>
    </div>
  );
}
