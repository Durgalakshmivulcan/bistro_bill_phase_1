import { useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import SettingsTabs from "../../components/NavTabs/BusinessSettingsTabs";
import type {
  Integration,
  IntegrationProvider,
  IntegrationStatus,
} from "../../types/integration";

// TODO: Replace with API call to fetch integrations once backend integration routes are implemented.
// No backend route for /integrations currently exists. Using default configuration as initial state.
const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: "int-tally-1",
    businessOwnerId: "",
    provider: "tally",
    type: "accounting",
    config: { serverUrl: "http://localhost", port: 9000 },
    status: "inactive",
    lastSyncAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "int-qb-1",
    businessOwnerId: "",
    provider: "quickbooks",
    type: "accounting",
    config: {},
    status: "inactive",
    lastSyncAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "int-zoho-1",
    businessOwnerId: "",
    provider: "zoho_books",
    type: "accounting",
    config: {},
    status: "inactive",
    lastSyncAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/* ── provider display metadata ── */
const PROVIDER_META: Record<
  "tally" | "quickbooks" | "zoho_books",
  { label: string; description: string; color: string }
> = {
  tally: {
    label: "Tally",
    description:
      "Sync invoices to Tally ERP9 / TallyPrime for automated accounting.",
    color: "#E8413C",
  },
  quickbooks: {
    label: "QuickBooks",
    description:
      "Connect QuickBooks Online to auto-create invoices and record payments.",
    color: "#2CA01C",
  },
  zoho_books: {
    label: "Zoho Books",
    description:
      "Sync invoices, customers and taxes to Zoho Books automatically.",
    color: "#DC2626",
  },
};

/* ── status badge ── */
function StatusBadge({ status }: { status: IntegrationStatus }) {
  const styles: Record<IntegrationStatus, string> = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-500",
    error: "bg-red-100 text-red-700",
  };
  const labels: Record<IntegrationStatus, string> = {
    active: "Connected",
    inactive: "Disconnected",
    error: "Error",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

/* ── main page ── */
export default function IntegrationSettings() {
  const [integrations, setIntegrations] =
    useState<Integration[]>(INITIAL_INTEGRATIONS);
  const [testing, setTesting] = useState<string | null>(null);

  /* Tally-specific local state */
  const tallyIntegration = integrations.find((i) => i.provider === "tally")!;
  const [tallyUrl, setTallyUrl] = useState(
    (tallyIntegration.config.serverUrl as string) ?? "http://localhost"
  );
  const [tallyPort, setTallyPort] = useState(
    String((tallyIntegration.config.port as number) ?? 9000)
  );

  /* ── helpers ── */
  const toggleAutoSync = (provider: IntegrationProvider) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.provider === provider
          ? {
              ...i,
              config: {
                ...i.config,
                autoSync: !i.config.autoSync,
              },
            }
          : i
      )
    );
  };

  const updateStatus = (provider: IntegrationProvider, status: IntegrationStatus) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.provider === provider
          ? { ...i, status, lastSyncAt: status === "active" ? new Date().toISOString() : i.lastSyncAt }
          : i
      )
    );
  };

  const handleTestConnection = async (provider: IntegrationProvider) => {
    setTesting(provider);
    // TODO: Call integration test-connection API once backend route exists
    await new Promise((r) => setTimeout(r, 1500));
    updateStatus(provider, "active");
    setTesting(null);
  };

  const handleOAuthConnect = (provider: "quickbooks" | "zoho_books") => {
    // TODO: Redirect to OAuth URL from backend once integration routes exist
    updateStatus(provider, "active");
  };

  const handleSaveTallyConfig = () => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.provider === "tally"
          ? {
              ...i,
              config: {
                ...i.config,
                serverUrl: tallyUrl,
                port: Number(tallyPort),
              },
            }
          : i
      )
    );
  };

  const getIntegration = (provider: IntegrationProvider) =>
    integrations.find((i) => i.provider === provider)!;

  /* ── render ── */
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
                  Accounting Integrations
                </h2>
                <p className="text-sm text-bb-textSoft mb-4">
                  Connect your accounting software to automatically sync
                  invoices when orders are completed.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Tally Card ── */}
                {(() => {
                  const integration = getIntegration("tally");
                  const meta = PROVIDER_META.tally;
                  return (
                    <div className="bg-white border border-bb-border rounded-xl shadow-bb-card p-5 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: meta.color }}
                          >
                            T
                          </div>
                          <div>
                            <h3 className="font-medium text-sm">
                              {meta.label}
                            </h3>
                            <StatusBadge status={integration.status} />
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-bb-textSoft">
                        {meta.description}
                      </p>

                      {/* Tally config inputs */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Tally Server URL
                          </label>
                          <input
                            type="text"
                            value={tallyUrl}
                            onChange={(e) => setTallyUrl(e.target.value)}
                            placeholder="http://localhost"
                            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bb-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Port
                          </label>
                          <input
                            type="text"
                            value={tallyPort}
                            onChange={(e) => setTallyPort(e.target.value)}
                            placeholder="9000"
                            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-bb-primary"
                          />
                        </div>
                        <button
                          onClick={handleSaveTallyConfig}
                          className="text-xs text-bb-primary font-medium hover:underline"
                        >
                          Save Configuration
                        </button>
                      </div>

                      {/* Auto-sync toggle */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-600">
                          Auto-sync invoices
                        </span>
                        <button
                          onClick={() => toggleAutoSync("tally")}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            integration.config.autoSync
                              ? "bg-bb-primary"
                              : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                              integration.config.autoSync
                                ? "translate-x-4"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Test connection */}
                      <button
                        onClick={() => handleTestConnection("tally")}
                        disabled={testing === "tally"}
                        className="w-full text-center py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {testing === "tally"
                          ? "Testing..."
                          : "Test Connection"}
                      </button>

                      {integration.lastSyncAt && (
                        <p className="text-[11px] text-bb-textSoft text-center">
                          Last synced:{" "}
                          {new Date(integration.lastSyncAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* ── QuickBooks Card ── */}
                {(() => {
                  const integration = getIntegration("quickbooks");
                  const meta = PROVIDER_META.quickbooks;
                  return (
                    <div className="bg-white border border-bb-border rounded-xl shadow-bb-card p-5 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: meta.color }}
                          >
                            QB
                          </div>
                          <div>
                            <h3 className="font-medium text-sm">
                              {meta.label}
                            </h3>
                            <StatusBadge status={integration.status} />
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-bb-textSoft">
                        {meta.description}
                      </p>

                      {/* OAuth connect button */}
                      {integration.status === "inactive" ? (
                        <button
                          onClick={() => handleOAuthConnect("quickbooks")}
                          className="w-full py-2 text-sm font-medium rounded-lg text-white hover:opacity-90"
                          style={{ backgroundColor: meta.color }}
                        >
                          Connect with QuickBooks
                        </button>
                      ) : (
                        <button
                          onClick={() => updateStatus("quickbooks", "inactive")}
                          className="w-full py-2 text-sm font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Disconnect
                        </button>
                      )}

                      {/* Auto-sync toggle */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-600">
                          Auto-sync invoices
                        </span>
                        <button
                          onClick={() => toggleAutoSync("quickbooks")}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            integration.config.autoSync
                              ? "bg-bb-primary"
                              : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                              integration.config.autoSync
                                ? "translate-x-4"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Test connection */}
                      <button
                        onClick={() => handleTestConnection("quickbooks")}
                        disabled={testing === "quickbooks"}
                        className="w-full text-center py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {testing === "quickbooks"
                          ? "Testing..."
                          : "Test Connection"}
                      </button>

                      {integration.lastSyncAt && (
                        <p className="text-[11px] text-bb-textSoft text-center">
                          Last synced:{" "}
                          {new Date(integration.lastSyncAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* ── Zoho Books Card ── */}
                {(() => {
                  const integration = getIntegration("zoho_books");
                  const meta = PROVIDER_META.zoho_books;
                  return (
                    <div className="bg-white border border-bb-border rounded-xl shadow-bb-card p-5 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: meta.color }}
                          >
                            ZB
                          </div>
                          <div>
                            <h3 className="font-medium text-sm">
                              {meta.label}
                            </h3>
                            <StatusBadge status={integration.status} />
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-bb-textSoft">
                        {meta.description}
                      </p>

                      {/* OAuth connect button */}
                      {integration.status === "inactive" ? (
                        <button
                          onClick={() => handleOAuthConnect("zoho_books")}
                          className="w-full py-2 text-sm font-medium rounded-lg text-white hover:opacity-90"
                          style={{ backgroundColor: meta.color }}
                        >
                          Connect with Zoho
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            updateStatus("zoho_books", "inactive")
                          }
                          className="w-full py-2 text-sm font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Disconnect
                        </button>
                      )}

                      {/* Auto-sync toggle */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-600">
                          Auto-sync invoices
                        </span>
                        <button
                          onClick={() => toggleAutoSync("zoho_books")}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            integration.config.autoSync
                              ? "bg-bb-primary"
                              : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                              integration.config.autoSync
                                ? "translate-x-4"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Test connection */}
                      <button
                        onClick={() => handleTestConnection("zoho_books")}
                        disabled={testing === "zoho_books"}
                        className="w-full text-center py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {testing === "zoho_books"
                          ? "Testing..."
                          : "Test Connection"}
                      </button>

                      {integration.lastSyncAt && (
                        <p className="text-[11px] text-bb-textSoft text-center">
                          Last synced:{" "}
                          {new Date(integration.lastSyncAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
