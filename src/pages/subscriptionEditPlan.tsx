import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  planDurations,
  trialPeriods,
  planFeatures,
} from "../data/subscriptionCreatePlanData";
import {
  getSubscriptionPlans,
  updateSubscriptionPlan,
  SubscriptionPlan,
} from "../services/settingsService";

import activatedImage from "../assets/activated.png";
import deactivatedImage from "../assets/deactivated.png";
import updateSucess from "../assets/tick.png";

type AlertType = null | "updated" | "activated" | "deactivated";

function durationToLabel(months: number): string {
  if (months >= 9999) return "Lifetime";
  if (months === 12) return "Yearly";
  if (months === 1) return "Monthly";
  return "Yearly";
}

function parseDuration(label: string): number {
  switch (label) {
    case "Monthly": return 1;
    case "Yearly": return 12;
    case "Lifetime": return 9999;
    default: return 12;
  }
}

function trialDaysToLabel(days: number): string {
  if (days === 7) return "7 Days";
  if (days === 15) return "15 Days";
  if (days === 30) return "30 Days";
  return "";
}

function parseTrialDays(label: string): number {
  const match = label.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

const SubscriptionEditPlan = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [trialPeriod, setTrialPeriod] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [maxBranches, setMaxBranches] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // UI state
  const [alert, setAlert] = useState<AlertType>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load plan data
  useEffect(() => {
    if (!id) return;
    setPageLoading(true);
    getSubscriptionPlans()
      .then((res) => {
        if (res.success && res.data) {
          const plan = res.data.plans.find((p: SubscriptionPlan) => p.id === id);
          if (plan) {
            setName(plan.name);
            setPrice(String(Number(plan.price)));
            setDuration(durationToLabel(plan.duration));
            setTrialPeriod(trialDaysToLabel(plan.trialDays));
            setMaxBranches(plan.maxBranches);
            setIsActive(plan.status === "active");
            // features is stored as JSON array of strings
            const feats = Array.isArray(plan.features) ? plan.features as string[] : [];
            setSelectedFeatures(feats);
          } else {
            setError("Plan not found");
          }
        } else {
          setError("Failed to load plan");
        }
      })
      .catch(() => setError("Failed to load plan"))
      .finally(() => setPageLoading(false));
  }, [id]);

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const handleUpdate = async () => {
    if (!id) return;
    setError(null);
    setSubmitting(true);
    try {
      const numPrice = parseFloat(price.replace(/[₹,]/g, ""));
      const res = await updateSubscriptionPlan(id, {
        name: name.trim(),
        price: isNaN(numPrice) ? 0 : numPrice,
        duration: parseDuration(duration),
        trialDays: trialPeriod ? parseTrialDays(trialPeriod) : 0,
        features: selectedFeatures,
        maxBranches,
      });
      if (res.success) {
        setAlert("updated");
      } else {
        setError(res.message || "Failed to update plan");
      }
    } catch {
      setError("Failed to update plan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!id) return;
    setError(null);
    const newStatus = isActive ? "inactive" : "active";
    try {
      const res = await updateSubscriptionPlan(id, { status: newStatus });
      if (res.success) {
        setIsActive(!isActive);
        setAlert(isActive ? "deactivated" : "activated");
      } else {
        setError(res.message || "Failed to update status");
      }
    } catch {
      setError("Failed to update status");
    }
  };

  if (pageLoading) {
    return <div className="text-center py-8 text-bb-textSoft">Loading plan...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Edit Plan</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="bg-[#FFFDF5] rounded-lg space-y-8 p-6">

        {/* ================= FORM ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium">Plan Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-md px-4 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Price</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
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
              <option value="">No trial</option>
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
            className="w-full border rounded-md px-4 py-2"
          />
        </div>

        {/* Features */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-yellow-600">
            What Features to be Included
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {planFeatures.map((feature) => (
              <label key={feature} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(feature)}
                  onChange={() => toggleFeature(feature)}
                />
                {feature}
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

        {/* ================= ACTIONS ================= */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={handleToggleStatus}
            className="bg-black text-white px-6 py-2 rounded-md"
          >
            {isActive ? "Deactivate" : "Activate"}
          </button>

          <div className="flex gap-4">
            <button
              onClick={() => navigate(-1)}
              className="border px-6 py-2 rounded-md"
            >
              Cancel
            </button>

            <button
              onClick={handleUpdate}
              disabled={submitting}
              className="bg-yellow-400 px-6 py-2 rounded-md font-medium disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </div>

      {/* ================= ALERT MODALS ================= */}
      {alert && (
        <Overlay>
          <AlertModal
            type={alert}
            onClose={() => {
              setAlert(null);
              if (alert === "updated") {
                navigate("/subscription-plans");
              }
            }}
          />
        </Overlay>
      )}
    </div>
  );
};

export default SubscriptionEditPlan;

/* ================= SHARED COMPONENTS ================= */

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      {children}
    </div>
  );
}

function AlertModal({
  type,
  onClose,
}: {
  type: AlertType;
  onClose: () => void;
}) {
  const content = {
    updated: {
      title: "Plan Updated",
      desc: "Subscription Plan updated Successfully!",
      image: updateSucess,
    },
    activated: {
      title: "Plan Activated!",
      desc: "Subscription Plan Successfully Activated",
      image: activatedImage,
    },
    deactivated: {
      title: "Plan Deactivated!",
      desc: "Subscription Plan Successfully Inactivated",
      image: deactivatedImage,
    },
  }[type!];

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center relative">
      <button
        onClick={onClose}
        className="absolute right-3 top-3 text-gray-400"
      >
        ✕
      </button>

      <h3 className="text-xl font-bold mb-4">{content.title}</h3>

      <div className="mb-4 flex justify-center">
        <img
          src={content.image}
          alt={content.title}
          className="h-16 w-16"
        />
      </div>

      <p className="text-sm text-gray-600">{content.desc}</p>
    </div>
  );
}
