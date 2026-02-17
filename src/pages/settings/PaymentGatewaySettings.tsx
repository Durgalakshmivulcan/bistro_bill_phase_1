import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import Modal from "../../components/ui/Modal";
import { TableSkeleton } from "../../components/Common";
import {
  GatewayProvider,
  GatewayConfig,
  UpsertGatewayConfigInput,
  TestConnectionResult,
  listGatewayConfigs,
  upsertGatewayConfig,
  toggleGatewayConfig,
  testGatewayConnection,
} from "../../services/paymentService";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Settings,
  CreditCard,
} from "lucide-react";

// ============================================
// Gateway Provider Metadata
// ============================================

interface ProviderMeta {
  name: string;
  description: string;
  color: string;
  bgColor: string;
  fields: { apiKey: string; apiSecret: string; webhookSecret: string };
}

const PROVIDER_META: Record<GatewayProvider, ProviderMeta> = {
  Razorpay: {
    name: "Razorpay",
    description: "Accept UPI, cards, net banking, wallets. Popular in India.",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    fields: {
      apiKey: "Key ID (e.g., rzp_test_...)",
      apiSecret: "Key Secret",
      webhookSecret: "Webhook Secret",
    },
  },
  Stripe: {
    name: "Stripe",
    description: "Accept international cards — Visa, Mastercard, Amex.",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    fields: {
      apiKey: "Secret Key (e.g., sk_test_...)",
      apiSecret: "Publishable Key (e.g., pk_test_...)",
      webhookSecret: "Webhook Signing Secret (e.g., whsec_...)",
    },
  },
  PayU: {
    name: "PayU",
    description: "UPI and net banking with redirect flow.",
    color: "text-green-700",
    bgColor: "bg-green-50",
    fields: {
      apiKey: "Merchant Key",
      apiSecret: "Merchant Salt",
      webhookSecret: "Webhook Secret (optional)",
    },
  },
};

const ALL_PROVIDERS: GatewayProvider[] = ["Razorpay", "Stripe", "PayU"];

// ============================================
// Configure Gateway Modal
// ============================================

interface ConfigureModalProps {
  open: boolean;
  onClose: () => void;
  provider: GatewayProvider | null;
  existingConfig: GatewayConfig | null;
  onSave: (input: UpsertGatewayConfigInput) => Promise<void>;
  saving: boolean;
}

const ConfigureModal: React.FC<ConfigureModalProps> = ({
  open,
  onClose,
  provider,
  existingConfig,
  onSave,
  saving,
}) => {
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isTestMode, setIsTestMode] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  useEffect(() => {
    if (open) {
      setApiKey("");
      setApiSecret("");
      setWebhookSecret("");
      setIsTestMode(existingConfig?.isTestMode ?? true);
      setShowApiKey(false);
      setShowApiSecret(false);
      setShowWebhookSecret(false);
    }
  }, [open, existingConfig]);

  if (!provider) return null;

  const meta = PROVIDER_META[provider];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      provider,
      apiKey,
      apiSecret,
      webhookSecret: webhookSecret || undefined,
      isTestMode,
    });
  };

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-lg ${meta.bgColor} flex items-center justify-center`}
        >
          <CreditCard size={20} className={meta.color} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-bb-text">
            Configure {meta.name}
          </h3>
          <p className="text-xs text-bb-textSoft">{meta.description}</p>
        </div>
      </div>

      {existingConfig && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-700">
          <strong>Note:</strong> Existing credentials are masked. Enter new
          values to update them.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-bb-text mb-1">
            {meta.fields.apiKey}
          </label>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                existingConfig
                  ? existingConfig.apiKey
                  : "Enter API key"
              }
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-bb-primary focus:border-bb-primary"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* API Secret */}
        <div>
          <label className="block text-sm font-medium text-bb-text mb-1">
            {meta.fields.apiSecret}
          </label>
          <div className="relative">
            <input
              type={showApiSecret ? "text" : "password"}
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder={
                existingConfig
                  ? existingConfig.apiSecret
                  : "Enter API secret"
              }
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-bb-primary focus:border-bb-primary"
            />
            <button
              type="button"
              onClick={() => setShowApiSecret(!showApiSecret)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showApiSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Webhook Secret */}
        <div>
          <label className="block text-sm font-medium text-bb-text mb-1">
            {meta.fields.webhookSecret}
          </label>
          <div className="relative">
            <input
              type={showWebhookSecret ? "text" : "password"}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={
                existingConfig?.webhookSecret
                  ? existingConfig.webhookSecret
                  : "Enter webhook secret (optional)"
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-bb-primary focus:border-bb-primary"
            />
            <button
              type="button"
              onClick={() => setShowWebhookSecret(!showWebhookSecret)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showWebhookSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Test Mode Toggle */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <div>
            <p className="text-sm font-medium text-bb-text">Test Mode</p>
            <p className="text-xs text-bb-textSoft">
              Use sandbox/test credentials
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsTestMode(!isTestMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isTestMode ? "bg-amber-400" : "bg-green-500"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isTestMode ? "translate-x-1" : "translate-x-6"
              }`}
            />
          </button>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isTestMode
                ? "bg-amber-100 text-amber-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {isTestMode ? "Test" : "Live"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-bb-text hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !apiKey || !apiSecret}
            className="flex-1 px-4 py-2 bg-bb-primary text-bb-text rounded-lg text-sm font-medium hover:bg-bb-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : existingConfig ? (
              "Update Credentials"
            ) : (
              "Save Credentials"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ============================================
// Main Component
// ============================================

const PaymentGatewaySettings: React.FC = () => {
  const [configs, setConfigs] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configure modal state
  const [configureProvider, setConfigureProvider] =
    useState<GatewayProvider | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Test connection state
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<
    Record<string, TestConnectionResult>
  >({});

  // Toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listGatewayConfigs();
      if (response.success && response.data) {
        setConfigs(response.data);
      }
    } catch {
      setError("Failed to load gateway configurations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const getConfigForProvider = (
    provider: GatewayProvider
  ): GatewayConfig | null => {
    return configs.find((c) => c.provider === provider) || null;
  };

  const handleSaveConfig = async (input: UpsertGatewayConfigInput) => {
    try {
      setSaving(true);
      const response = await upsertGatewayConfig(input);
      if (response.success) {
        setSaveSuccess(input.provider);
        setConfigureProvider(null);
        await fetchConfigs();
        setTimeout(() => setSaveSuccess(null), 3000);
      }
    } catch {
      setError("Failed to save gateway configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (config: GatewayConfig) => {
    try {
      setTogglingId(config.id);
      const response = await toggleGatewayConfig(config.id);
      if (response.success) {
        setConfigs((prev) =>
          prev.map((c) =>
            c.id === config.id ? { ...c, isActive: !c.isActive } : c
          )
        );
      }
    } catch {
      setError("Failed to toggle gateway status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleTestConnection = async (config: GatewayConfig) => {
    try {
      setTestingId(config.id);
      setTestResult((prev) => {
        const next = { ...prev };
        delete next[config.id];
        return next;
      });
      const response = await testGatewayConnection(config.id);
      if (response.success && response.data) {
        setTestResult((prev) => ({ ...prev, [config.id]: response.data! }));
      }
    } catch {
      setTestResult((prev) => ({
        ...prev,
        [config.id]: { connected: false, message: "Test request failed" },
      }));
    } finally {
      setTestingId(null);
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <DashboardLayout>
      <div className="bb-shell">
        <div className="bb-frame flex flex-col">
          <main className="flex-1 bg-[#FFFBF3] px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-bb-primary/20 rounded-lg flex items-center justify-center">
                  <Settings size={20} className="text-bb-text" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-bb-text">
                    Payment Gateway Configuration
                  </h1>
                  <p className="text-sm text-bb-textSoft">
                    Configure and manage payment gateway credentials
                  </p>
                </div>
              </div>
              <button
                onClick={fetchConfigs}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-bb-text hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            {/* Success Banner */}
            {saveSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 size={16} />
                <span>
                  <strong>{saveSuccess}</strong> configuration saved
                  successfully!
                </span>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
                <AlertCircle size={16} />
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700 text-xs"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && <TableSkeleton />}

            {/* Gateway Cards */}
            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ALL_PROVIDERS.map((provider) => {
                  const meta = PROVIDER_META[provider];
                  const config = getConfigForProvider(provider);
                  const isConfigured = !!config;
                  const result = config ? testResult[config.id] : null;
                  const isTesting = config?.id === testingId;
                  const isToggling = config?.id === togglingId;

                  return (
                    <div
                      key={provider}
                      className={`bg-white rounded-xl border ${
                        isConfigured && config.isActive
                          ? "border-green-200 shadow-md"
                          : "border-gray-200"
                      } overflow-hidden`}
                    >
                      {/* Card Header */}
                      <div
                        className={`${meta.bgColor} px-5 py-4 flex items-center justify-between`}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard size={24} className={meta.color} />
                          <div>
                            <h3
                              className={`font-semibold ${meta.color} text-lg`}
                            >
                              {meta.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {meta.description}
                            </p>
                          </div>
                        </div>
                        {isConfigured && (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              config.isTestMode
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {config.isTestMode ? "Test" : "Live"}
                          </span>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="px-5 py-4 space-y-4">
                        {isConfigured ? (
                          <>
                            {/* Credentials (masked) */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-bb-textSoft">
                                  API Key:
                                </span>
                                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono text-gray-600">
                                  {config.apiKey}
                                </code>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-bb-textSoft">
                                  API Secret:
                                </span>
                                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono text-gray-600">
                                  {config.apiSecret}
                                </code>
                              </div>
                              {config.webhookSecret && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-bb-textSoft">
                                    Webhook:
                                  </span>
                                  <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono text-gray-600">
                                    {config.webhookSecret}
                                  </code>
                                </div>
                              )}
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <Shield size={14} className="text-bb-textSoft" />
                                <span className="text-sm font-medium text-bb-text">
                                  Gateway{" "}
                                  {config.isActive ? "Enabled" : "Disabled"}
                                </span>
                              </div>
                              <button
                                onClick={() => handleToggle(config)}
                                disabled={isToggling}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  config.isActive
                                    ? "bg-green-500"
                                    : "bg-gray-300"
                                }`}
                              >
                                {isToggling ? (
                                  <Loader2
                                    size={12}
                                    className="animate-spin absolute left-1/2 -translate-x-1/2 text-white"
                                  />
                                ) : (
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      config.isActive
                                        ? "translate-x-6"
                                        : "translate-x-1"
                                    }`}
                                  />
                                )}
                              </button>
                            </div>

                            {/* Test Connection Result */}
                            {result && (
                              <div
                                className={`rounded-lg p-3 text-sm flex items-center gap-2 ${
                                  result.connected
                                    ? "bg-green-50 text-green-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {result.connected ? (
                                  <CheckCircle2 size={14} />
                                ) : (
                                  <AlertCircle size={14} />
                                )}
                                {result.message}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleTestConnection(config)}
                                disabled={isTesting}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-bb-text hover:bg-gray-50 disabled:opacity-50"
                              >
                                {isTesting ? (
                                  <>
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                    Testing...
                                  </>
                                ) : (
                                  <>
                                    <Zap size={14} />
                                    Test Connection
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => setConfigureProvider(provider)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-bb-primary text-bb-text rounded-lg text-sm font-medium hover:bg-bb-primary/90"
                              >
                                <Settings size={14} />
                                Update
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Not configured state */}
                            <div className="text-center py-6">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CreditCard
                                  size={20}
                                  className="text-gray-400"
                                />
                              </div>
                              <p className="text-sm text-bb-textSoft mb-1">
                                Not configured yet
                              </p>
                              <p className="text-xs text-gray-400">
                                Add your {meta.name} credentials to get started
                              </p>
                            </div>
                            <button
                              onClick={() => setConfigureProvider(provider)}
                              className="w-full px-4 py-2 bg-bb-primary text-bb-text rounded-lg text-sm font-medium hover:bg-bb-primary/90 flex items-center justify-center gap-2"
                            >
                              <Settings size={14} />
                              Configure {meta.name}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Security Note */}
            {!loading && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Shield size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Security Notice</p>
                  <p>
                    All credentials are encrypted before storage using
                    AES-256-CBC encryption. Credentials are never displayed in
                    plain text — only masked values are shown. Use{" "}
                    <strong>Test Mode</strong> for sandbox credentials during
                    development.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Configure Modal */}
      <ConfigureModal
        open={configureProvider !== null}
        onClose={() => setConfigureProvider(null)}
        provider={configureProvider}
        existingConfig={
          configureProvider ? getConfigForProvider(configureProvider) : null
        }
        onSave={handleSaveConfig}
        saving={saving}
      />
    </DashboardLayout>
  );
};

export default PaymentGatewaySettings;
