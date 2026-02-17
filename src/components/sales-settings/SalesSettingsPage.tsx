import { useState, useEffect } from "react";
import {
  getSalesChannels,
  updateSalesChannel,
  getAggregators,
  updateAggregator,
  SalesChannel,
  Aggregator,
} from "../../services/settingsService";

const SalesSettingsPage = () => {
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [aggregators, setAggregators] = useState<Aggregator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedAggregator, setSelectedAggregator] = useState<Aggregator | null>(
    null
  );
  const [formData, setFormData] = useState({
    merchantId: "",
    apiKey: "",
    apiEndpoint: "",
    callbackUrl: "",
  });

  // Fetch sales channels and aggregators on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [channelsResponse, aggregatorsResponse] = await Promise.all([
          getSalesChannels(),
          getAggregators(),
        ]);

        if (channelsResponse.success && channelsResponse.data) {
          setChannels(channelsResponse.data);
        } else {
          console.error("Failed to fetch sales channels:", channelsResponse.error);
        }

        if (aggregatorsResponse.success && aggregatorsResponse.data) {
          setAggregators(aggregatorsResponse.data);
        } else {
          console.error("Failed to fetch aggregators:", aggregatorsResponse.error);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load sales settings");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle channel toggle
  const handleChannelToggle = async (channel: SalesChannel) => {
    try {
      const response = await updateSalesChannel(channel.id, {
        enabled: !channel.enabled,
      });

      if (response.success && response.data) {
        // Update local state
        setChannels((prev) =>
          prev.map((c) =>
            c.id === channel.id ? { ...c, enabled: response.data!.enabled } : c
          )
        );
      } else {
        console.error("Failed to update channel:", response.error);
        alert("Failed to update channel status");
      }
    } catch (err) {
      console.error("Error updating channel:", err);
      alert("Failed to update channel status");
    }
  };

  // Handle aggregator click
  const handleAggregatorClick = (agg: Aggregator) => {
    setSelectedAggregator(agg);
    setFormData({
      merchantId: agg.merchantId || "",
      apiKey: agg.apiKey || "",
      apiEndpoint: agg.apiEndpoint || "",
      callbackUrl: agg.callbackUrl || "",
    });
    setShowConnectModal(true);
  };

  // Handle save aggregator
  const handleSaveAggregator = async () => {
    if (!selectedAggregator) return;

    try {
      const response = await updateAggregator(selectedAggregator.id, {
        merchantId: formData.merchantId,
        apiKey: formData.apiKey,
        apiEndpoint: formData.apiEndpoint,
        callbackUrl: formData.callbackUrl,
        isConnected: true,
      });

      if (response.success && response.data) {
        // Update local state
        setAggregators((prev) =>
          prev.map((a) =>
            a.id === selectedAggregator.id ? response.data! : a
          )
        );
        setShowConnectModal(false);
        setShowSuccessModal(true);
      } else {
        console.error("Failed to update aggregator:", response.error);
        alert("Failed to connect aggregator");
      }
    } catch (err) {
      console.error("Error updating aggregator:", err);
      alert("Failed to connect aggregator");
    }
  };

  if (loading) {
    return (
      <div className="border rounded-lg bg-[#FFF9E8] p-4 sm:p-6">
        <p className="text-center text-gray-600">Loading sales settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg bg-[#FFF9E8] p-4 sm:p-6">
        <p className="text-center text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* ================= PAGE ================= */}
      <div className="border rounded-lg bg-[#FFF9E8] p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ===== LEFT: SALES CHANNELS ===== */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-4">
              Subscribed Sales Channels
            </h2>

            {channels.length === 0 ? (
              <div className="border rounded-lg bg-white p-6 text-center text-gray-600">
                No sales channels available
              </div>
            ) : (
              <div className="border rounded-lg bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#F7C948]">
                    <tr>
                      <th className="text-left px-4 py-3">Channel</th>
                      <th className="text-center px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channels.map((channel, index) => (
                      <tr
                        key={channel.id}
                        className={index % 2 ? "bg-[#FFF7E0]" : "bg-white"}
                      >
                        <td className="px-4 py-3">{channel.name}</td>
                        <td className="px-4 py-3 text-center">
                          <div
                            onClick={() => handleChannelToggle(channel)}
                            className={`relative inline-flex w-10 h-5 cursor-pointer rounded-full transition
                              ${
                                channel.enabled
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                          >
                            <span
                              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition
                                ${
                                  channel.enabled
                                    ? "right-0.5"
                                    : "left-0.5"
                                }`}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ===== RIGHT: ONLINE AGGREGATORS ===== */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-4">
              Online Aggregators
            </h2>

            {aggregators.length === 0 ? (
              <div className="border rounded-lg bg-white p-6 text-center text-gray-600">
                No aggregators available
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {aggregators.map((agg) => (
                  <div
                    key={agg.id}
                    onClick={() => handleAggregatorClick(agg)}
                    className={`cursor-pointer bg-white rounded-2xl shadow border-2 ${
                      agg.isConnected
                        ? "border-green-500"
                        : "border-transparent hover:border-[#F7C948]"
                    } flex items-center justify-center h-36 sm:h-40 relative`}
                  >
                    {agg.logo ? (
                      <img
                        src={agg.logo}
                        alt={agg.name}
                        className="h-20 object-contain"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-gray-700">
                        {agg.name}
                      </span>
                    )}
                    {agg.isConnected && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Connected
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= CONNECT MODAL ================= */}
      {showConnectModal && selectedAggregator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-lg w-full max-w-lg p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-500"
              onClick={() => setShowConnectModal(false)}
            >
              ✕
            </button>

            <h2 className="text-lg font-bold mb-6">
              Connect {selectedAggregator.name}
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">
                  Merchant ID <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded-md px-4 py-2"
                  value={formData.merchantId}
                  onChange={(e) =>
                    setFormData({ ...formData, merchantId: e.target.value })
                  }
                  placeholder="Enter merchant ID"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  API Key / Access Token <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  className="w-full border rounded-md px-4 py-2"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  placeholder="Enter API key"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Order API Endpoint <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded-md px-4 py-2"
                  value={formData.apiEndpoint}
                  onChange={(e) =>
                    setFormData({ ...formData, apiEndpoint: e.target.value })
                  }
                  placeholder="https://api.example.com/orders"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Callback URL <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border rounded-md px-4 py-2"
                  value={formData.callbackUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, callbackUrl: e.target.value })
                  }
                  placeholder="https://yourapp.com/webhook"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={() => setShowConnectModal(false)}
                className="border px-6 py-2 rounded-md w-full sm:w-auto"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveAggregator}
                className="bg-[#F7C948] px-6 py-2 rounded-md font-medium w-full sm:w-auto"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUCCESS MODAL ================= */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-lg p-8 text-center w-full max-w-sm relative">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-gray-400"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-2">Connected</h2>

            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-3xl">✓</span>
            </div>

            <p className="text-sm text-gray-600">
              Online Aggregator connected Successfully!
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default SalesSettingsPage;
