import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import SettingsTabs from "../NavTabs/BusinessSettingsTabs";
import {
  getAggregatorConfigs,
  updateAggregatorConfig,
  type Aggregator,
  type UpdateAggregatorInput,
} from "../../services/aggregatorService";
import { showSuccessToast, showErrorToast } from "../../utils/toast";

const AGGREGATOR_META: Record<
  string,
  { label: string; description: string; color: string; initial: string }
> = {
  Swiggy: {
    label: "Swiggy",
    description:
      "Receive and manage orders from Swiggy directly in your POS.",
    color: "#FC8019",
    initial: "S",
  },
  Zomato: {
    label: "Zomato",
    description:
      "Receive and manage orders from Zomato directly in your POS.",
    color: "#E23744",
    initial: "Z",
  },
  UberEats: {
    label: "Uber Eats",
    description:
      "Receive and manage orders from Uber Eats directly in your POS.",
    color: "#06C167",
    initial: "UE",
  },
};

const API_BASE =
  process.env.REACT_APP_API_URL || "http://localhost:5001/api/v1";

export default function AggregatorConfigPage() {
  const [aggregators, setAggregators] = useState<Aggregator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [formState, setFormState] = useState<
    Record<string, UpdateAggregatorInput>
  >({});

  const fetchAggregators = useCallback(async () => {
    try {
      const res = await getAggregatorConfigs();
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : [];
        setAggregators(list);
        const initial: Record<string, UpdateAggregatorInput> = {};
        list.forEach((agg) => {
          initial[agg.id] = {
            apiKey: agg.apiKey || "",
            merchantId: agg.merchantId || "",
            callbackUrl: agg.callbackUrl || "",
            isConnected: agg.isConnected,
          };
        });
        setFormState(initial);
      }
    } catch {
      showErrorToast("Failed to load aggregator configurations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAggregators();
  }, [fetchAggregators]);

  const handleFieldChange = (
    aggId: string,
    field: keyof UpdateAggregatorInput,
    value: string | boolean
  ) => {
    setFormState((prev) => ({
      ...prev,
      [aggId]: { ...prev[aggId], [field]: value },
    }));
  };

  const handleSave = async (agg: Aggregator) => {
    setSaving(agg.id);
    try {
      const input = formState[agg.id];
      const res = await updateAggregatorConfig(agg.id, input);
      if (res.success) {
        showSuccessToast(`${agg.name} configuration saved`);
        fetchAggregators();
      } else {
        showErrorToast("Failed to save configuration");
      }
    } catch {
      showErrorToast("Failed to save configuration");
    } finally {
      setSaving(null);
    }
  };

  const handleToggle = async (agg: Aggregator) => {
    const newVal = !formState[agg.id]?.isConnected;
    handleFieldChange(agg.id, "isConnected", newVal);
    setSaving(agg.id);
    try {
      const res = await updateAggregatorConfig(agg.id, {
        isConnected: newVal,
      });
      if (res.success) {
        showSuccessToast(
          `${agg.name} ${newVal ? "enabled" : "disabled"}`
        );
        fetchAggregators();
      } else {
        handleFieldChange(agg.id, "isConnected", !newVal);
        showErrorToast("Failed to update status");
      }
    } catch {
      handleFieldChange(agg.id, "isConnected", !newVal);
      showErrorToast("Failed to update status");
    } finally {
      setSaving(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccessToast("Webhook URL copied to clipboard");
  };

  const getWebhookUrl = (aggName: string) =>
    `${API_BASE}/webhooks/online-orders/${aggName.toLowerCase().replace(/\s+/g, "")}`;

  const getMeta = (name: string) =>
    AGGREGATOR_META[name] || {
      label: name,
      description: `Receive orders from ${name}.`,
      color: "#6B7280",
      initial: name.charAt(0),
    };

  return (
    <DashboardLayout>
      <div className="bb-shell">
        <div className="bb-frame">
          <main className="flex-1 bg-[#FFFBF3] px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-lg font-medium mb-4">Business Settings</h1>
            <SettingsTabs />

            <div className="space-y-6">
              <div>
                <h2 className="text-base font-medium mb-1">
                  Aggregator Integrations
                </h2>
                <p className="text-sm text-bb-textSoft mb-4">
                  Configure your Swiggy, Zomato, and Uber Eats credentials to
                  receive online orders directly in your POS.
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bb-primary" />
                </div>
              ) : aggregators.length === 0 ? (
                <div className="bg-white border border-bb-border rounded-xl shadow-bb-card p-8 text-center">
                  <i className="bi bi-shop text-4xl text-bb-textSoft mb-3 block" />
                  <p className="text-sm text-bb-textSoft">
                    No aggregator integrations available. Contact support to
                    set up your aggregator accounts.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {aggregators.map((agg) => {
                    const meta = getMeta(agg.name);
                    const form = formState[agg.id] || {};
                    const webhookUrl = getWebhookUrl(agg.name);
                    const isSaving = saving === agg.id;

                    return (
                      <div
                        key={agg.id}
                        className="bg-white border border-bb-border rounded-xl shadow-bb-card p-5 flex flex-col gap-4"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                              style={{ backgroundColor: meta.color }}
                            >
                              {meta.initial}
                            </div>
                            <div>
                              <h3 className="font-medium text-sm">
                                {meta.label}
                              </h3>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                  form.isConnected
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {form.isConnected ? "Connected" : "Disconnected"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-bb-textSoft">
                          {meta.description}
                        </p>

                        {/* Config fields */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              API Key
                            </label>
                            <input
                              type="password"
                              value={(form.apiKey as string) || ""}
                              onChange={(e) =>
                                handleFieldChange(
                                  agg.id,
                                  "apiKey",
                                  e.target.value
                                )
                              }
                              placeholder="Enter API key"
                              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bb-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Restaurant / Store ID
                            </label>
                            <input
                              type="text"
                              value={(form.merchantId as string) || ""}
                              onChange={(e) =>
                                handleFieldChange(
                                  agg.id,
                                  "merchantId",
                                  e.target.value
                                )
                              }
                              placeholder="Enter restaurant ID"
                              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bb-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Webhook URL
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={webhookUrl}
                                readOnly
                                className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-gray-50 text-gray-500"
                              />
                              <button
                                onClick={() => copyToClipboard(webhookUrl)}
                                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                                title="Copy"
                              >
                                <i className="bi bi-clipboard" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Enable/Disable toggle */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-600">
                            Enable integration
                          </span>
                          <button
                            onClick={() => handleToggle(agg)}
                            disabled={isSaving}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              form.isConnected
                                ? "bg-bb-primary"
                                : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                                form.isConnected
                                  ? "translate-x-4"
                                  : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Save button */}
                        <button
                          onClick={() => handleSave(agg)}
                          disabled={isSaving}
                          className="w-full py-2 text-sm font-medium rounded-lg bg-bb-primary text-bb-text hover:opacity-90 disabled:opacity-50"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
