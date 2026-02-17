import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  planDurations,
  trialPeriods,
  planFeatures,
} from "../data/subscriptionCreatePlanData";
import { createSubscriptionPlan } from "../services/settingsService";
import successIcon from "../assets/tick.png";

function parseDuration(label: string): number {
  switch (label) {
    case "Monthly": return 1;
    case "Yearly": return 12;
    case "Lifetime": return 9999;
    default: return 12;
  }
}

function parseTrialDays(label: string): number {
  const match = label.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

const CreatePlanPage = () => {
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [trialPeriod, setTrialPeriod] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [maxBranches, setMaxBranches] = useState(1);

  // UI state
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const toggleAll = () => {
    if (selectedFeatures.length === planFeatures.length) {
      setSelectedFeatures([]);
    } else {
      setSelectedFeatures([...planFeatures]);
    }
  };

  const handleCreate = async () => {
    setError(null);
    if (!name.trim()) { setError("Plan name is required"); return; }
    if (!price.trim()) { setError("Price is required"); return; }
    if (!duration) { setError("Plan duration is required"); return; }
    if (selectedFeatures.length === 0) { setError("Select at least one feature"); return; }

    setSubmitting(true);
    try {
      const numPrice = parseFloat(price.replace(/[₹,]/g, ""));
      const res = await createSubscriptionPlan({
        name: name.trim(),
        price: isNaN(numPrice) ? 0 : numPrice,
        duration: parseDuration(duration),
        trialDays: trialPeriod ? parseTrialDays(trialPeriod) : 0,
        features: selectedFeatures,
        maxBranches,
      });
      if (res.success) {
        setShowSuccess(true);
      } else {
        setError(res.message || "Failed to create plan");
      }
    } catch {
      setError("Failed to create plan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <h1 className="text-2xl font-semibold text-gray-800">Create Plan</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="bg-[#FFFDF5] rounded-lg space-y-8 p-6">
          {/* Top Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium">Plan Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Gold"
                className="w-full border rounded-md px-4 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Price</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="₹7,182"
                className="w-full border rounded-md px-4 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Plan Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full border rounded-md px-4 py-2"
              >
                <option value="">Select the Plan Duration</option>
                {planDurations.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Trial Period</label>
              <select
                value={trialPeriod}
                onChange={(e) => setTrialPeriod(e.target.value)}
                className="w-full border rounded-md px-4 py-2"
              >
                <option value="">Select Trial Period</option>
                {trialPeriods.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Input Text"
              className="w-full border rounded-md px-4 py-2 resize-none"
            />
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-yellow-600">
              What Features to be Included
            </h2>

            <label className="flex items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={selectedFeatures.length === planFeatures.length}
                onChange={toggleAll}
              />
              Select All
            </label>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {planFeatures.map((f) => (
                <label key={f} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(f)}
                    onChange={() => toggleFeature(f)}
                  />
                  {f}
                </label>
              ))}
            </div>
          </div>

          {/* Number of Branches */}
          <div>
            <h2 className="text-lg font-semibold text-yellow-600 mb-2">
              Number of Branches
            </h2>

            <div className="inline-flex items-center border rounded-full overflow-hidden">
              <button
                onClick={() => setMaxBranches((v) => Math.max(1, v - 1))}
                className="px-5 py-2 bg-black text-white"
              >
                -
              </button>
              <span className="px-6 py-2">{maxBranches}</span>
              <button
                onClick={() => setMaxBranches((v) => v + 1)}
                className="px-5 py-2 bg-black text-white"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="border px-6 py-2 rounded-md"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting}
              className="bg-yellow-400 px-6 py-2 rounded-md font-medium disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>

      {/* ================= SUCCESS MODAL ================= */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-3">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center relative">
            <button
              onClick={() => {
                setShowSuccess(false);
                navigate("/subscription-plans");
              }}
              className="absolute right-3 top-3 text-gray-400"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-2">Plan Created</h3>

            <div className="my-4">
              <img src={successIcon} className="mx-auto h-14 w-14" alt="success" />
            </div>

            <p className="text-sm text-gray-600">
              Subscription Plan created Successfully!
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default CreatePlanPage;
