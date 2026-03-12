import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Input from "../form/Input";
import Select from "../form/Select";
import Textarea from "../form/Textarea";
import MultiSelect from "../form/Multiselect";
import { getAdvertisements, updateAdvertisement, getDiscounts, Advertisement } from "../../services/marketingService";
import { getBranches } from "../../services/branchService";

export default function EditAdvertisement() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [advertisement, setAdvertisement] = useState<Advertisement | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [discountOptions, setDiscountOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [branchOptions, setBranchOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    status: "active" as "active" | "inactive",
    startDate: "",
    endDate: "",
    branch: "",
    description: "",
  });

  useEffect(() => {
    loadAdvertisement();
    loadDiscounts();
    loadBranches();
  }, [id]);

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
      const response = await getBranches({ status: 'active' });
      if (response.success && response.data) {
        const options = response.data.branches.map(branch => ({
          label: branch.name,
          value: branch.id,
        }));
        setBranchOptions(options);
        setForm((prev) => ({
          ...prev,
          branch: prev.branch || options[0]?.value || "",
        }));
      }
    } catch (err) {
      console.error('Error loading branches:', err);
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    if (!branchOptions.length) {
      setForm((prev) => ({ ...prev, branch: "" }));
      return;
    }
    const isExisting = branchOptions.some((option) => option.value === form.branch);
    if (!isExisting) {
      setForm((prev) => ({ ...prev, branch: branchOptions[0].value }));
    }
  }, [branchOptions, form.branch]);

  const loadAdvertisement = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await getAdvertisements();
      const ad = response.data?.find(a => a.id === id);

      if (!ad) {
        alert('Advertisement not found');
        navigate(-1);
        return;
      }

      setAdvertisement(ad);

      const formatDateForInput = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      setForm({
        title: ad.title,
        status: ad.status,
        startDate: formatDateForInput(ad.startDate),
        endDate: formatDateForInput(ad.endDate),
        branch: branchOptions[0]?.value || "",
        description: ad.description || "",
      });

      setSelectedDiscounts(ad.linkedDiscounts.map(d => d.id));
    } catch (err: any) {
      console.error('Error loading advertisement:', err);
      alert(err.message || 'Failed to load advertisement');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!id || !form.title) {
      alert('Please fill in the title');
      return;
    }
    if (!form.branch) {
      alert('Please select branch');
      return;
    }

    try {
      setSaving(true);
      await updateAdvertisement(id, {
        title: form.title,
        description: form.description,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        discountIds: selectedDiscounts,
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Error updating advertisement:', err);
      alert(err.message || 'Failed to update advertisement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6">Loading advertisement...</p>;
  }

  if (!advertisement) {
    return <p className="p-6">Advertisement not found</p>;
  }

  return (
    <div className="bg-bb-bg min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Advertisement</h1>

      <div className="bg-bb-bg p-6 rounded-xl space-y-6 border">
        {/* BASIC DETAILS */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(value) =>
              setForm({ ...form, title: value })
            }
          />

          <Select
            label="Status"
            required
            value={form.status}
            onChange={(value) =>
              setForm({ ...form, status: value as "active" | "inactive" })
            }
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />

          <Input
            label="Start Date"
            type="date"
            required
            value={form.startDate}
            onChange={(value) =>
              setForm({ ...form, startDate: value })
            }
          />

          <Input
            label="End Date"
            type="date"
            required
            value={form.endDate}
            onChange={(value) =>
              setForm({ ...form, endDate: value })
            }
          />
        </div>

        {/* DISCOUNT CODES */}
        <MultiSelect
          label="Discount Codes"
          required
          options={discountOptions}
          value={selectedDiscounts}
          onChange={setSelectedDiscounts}
        />

        {/* BRANCH SELECT ✅ */}
        <Select
          label="Branch"
          required
          value={form.branch}
          onChange={(value) =>
            setForm({ ...form, branch: value })
          }
          options={branchOptions}
          disabled={saving || loadingBranches}
        />

        {/* DESCRIPTION */}
        <Textarea
          label="Description"
          placeholder="Type here..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        {/* ACTIONS */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => navigate(-1)}
            disabled={saving}
            className="border px-4 py-2 rounded border-black"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="bg-yellow-400 px-4 py-2 rounded disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Update'}
          </button>
        </div>

        {/* SUCCESS MODAL */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl w-[420px] p-6 relative text-center">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate(-1);
                }}
                className="absolute right-4 top-4 text-gray-500 text-xl"
              >
                ✕
              </button>

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

              <h2 className="text-xl font-bold mb-2">
                Advertisement Updated
              </h2>
              <p className="text-sm text-gray-600">
                Advertisement details updated successfully.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
