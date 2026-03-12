import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Input from "../form/Input";
import Select from "../form/Select";
import Textarea from "../form/Textarea";
import Checkbox from "../form/Checkbox";
import { Star, Copy, Trash2, Plus } from "lucide-react";
import { getFeedbackForms, updateFeedbackForm } from "../../services/marketingService";
import { getBranches } from "../../services/branchService";
import LoadingSpinner from "../Common/LoadingSpinner";

export default function EditFeedbackForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isRequired, setIsRequired] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branchOptions, setBranchOptions] = useState<Array<{ label: string; value: string }>>([]);

  const [form, setForm] = useState({
    title: "",
    status: "Active",
    description: "",
    completionMessage: "",
    branch: "",
    channel: "Dine In",
  });

  useEffect(() => {
    const loadForm = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await getFeedbackForms();
        if (res.success && res.data) {
          const found = res.data.find((f) => f.id === id);
          if (found) {
            setForm({
              title: found.title,
              status: found.status === "active" ? "Active" : "Inactive",
              description: found.description || "",
              completionMessage: "",
              branch: "",
              channel: "Dine In",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load feedback form:", err);
      } finally {
        setLoading(false);
      }
    };
    loadForm();
  }, [id]);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await getBranches({ status: "active" });
        if (res.success && res.data) {
          setBranchOptions([
            { label: "Select Branches", value: "" },
            ...res.data.branches.map((b) => ({ label: b.name, value: b.id })),
          ]);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };
    loadBranches();
  }, []);

  const handleUpdate = async () => {
    if (!id) return;
    try {
      setSaving(true);
      await updateFeedbackForm(id, {
        title: form.title,
        description: form.description || undefined,
        status: form.status === "Active" ? "active" : "inactive",
      });
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Failed to update feedback form:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" message="Loading feedback form..." />
      </div>
    );
  }

  return (
    <div className="bg-bb-bg min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Feedback Form</h1>

      <div className="bg-bb-bg p-6 rounded-xl space-y-6 border">
        {/* BASIC DETAILS */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(value) => setForm({ ...form, title: value })}
          />

          <Select
            label="Status"
            required
            value={form.status}
            onChange={(value) => setForm({ ...form, status: value })}
            options={[
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
            ]}
          />
        </div>

        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <Textarea
          label="Completion Message"
          value={form.completionMessage}
          onChange={(e) => setForm({ ...form, completionMessage: e.target.value })}
        />

        {/* BRANCH & CHANNEL */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Branch"
            required
            value={form.branch}
            onChange={(value) => setForm({ ...form, branch: value })}
            options={branchOptions.length > 0 ? branchOptions : [{ label: "Select Branches", value: "" }]}
          />

          <Select
            label="Channels"
            required
            value={form.channel}
            onChange={(value) => setForm({ ...form, channel: value })}
            options={[
              { label: "Dine In", value: "Dine In" },
              { label: "Take Away", value: "Take Away" },
              { label: "Online Order", value: "Online Order" },
            ]}
          />
        </div>

        {/* QUESTIONS SECTION */}
        <div className="border rounded-xl p-4 space-y-4">
          <h3 className="text-yellow-600 font-semibold">Questions</h3>

          <div className="bg-gray-200 rounded-md p-3 flex justify-between items-center">
            <span className="text-sm font-medium">
              Give Rating for Our Service
            </span>

            <Select
              value="Rating"
              options={[
                { label: "Rating", value: "Rating" },
                { label: "Text", value: "Text" },
                { label: "Yes / No", value: "YesNo" },
              ]}
            />
          </div>

          <Select
            value="5"
            options={[
              { label: "5", value: "5" },
              { label: "4", value: "4" },
              { label: "3", value: "3" },
            ]}
          />

          {/* STAR PREVIEW */}
          <div className="flex justify-between px-10">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="flex flex-col items-center gap-1">
                <span className="text-sm">{num}</span>
                <Star className="w-6 h-6" />
              </div>
            ))}
          </div>

          <hr />

          {/* QUESTION ACTIONS */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 text-gray-600">
              <Copy className="w-5 h-5 cursor-pointer" />
              <Trash2 className="w-5 h-5 cursor-pointer" />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm">Required</span>
              <Checkbox
                label="Required"
                checked={isRequired}
                onChange={setIsRequired}
              />

              <Plus className="w-5 h-5 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => navigate(-1)}
            className="border px-4 py-2 rounded border-black"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="bg-yellow-400 px-4 py-2 rounded disabled:opacity-50"
          >
            {saving ? "Updating..." : "Update"}
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

              <h2 className="text-xl font-bold mb-2">Feedback Form Updated</h2>
              <p className="text-sm text-gray-600">
                Feedback form updated successfully.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
