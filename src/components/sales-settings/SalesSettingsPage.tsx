import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import Modal from "../ui/Modal";
import uberEatsLogo from "../../assets/uber-eats.svg";
import swiggyLogo from "../../assets/swiggy.svg";
import zomatoLogo from "../../assets/zomato.svg";
import { showConnectedSweetAlert } from "../../utils/swalAlerts";

const SalesSettingsPage = () => {
  const [channels, setChannels] = useState([
    { id: "dine-in-1", name: "Dine In", enabled: true },
    { id: "take-away", name: "Take Away", enabled: true },
    { id: "dine-in-2", name: "Dine In", enabled: true },
    { id: "subscription-meal", name: "Subscription Meal", enabled: true },
    { id: "catering", name: "Catering Orders", enabled: true },
    { id: "reservations", name: "Reservations", enabled: true },
  ]);

  const [aggregators, setAggregators] = useState([
    { id: "uber-eats", name: "Uber Eats", logo: uberEatsLogo, isConnected: false },
    { id: "swiggy", name: "Swiggy", logo: swiggyLogo, isConnected: true },
    { id: "zomato", name: "Zomato", logo: zomatoLogo, isConnected: false },
  ]);

  const [openConnectModal, setOpenConnectModal] = useState(false);
  const [selectedAggId, setSelectedAggId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    merchantId: "",
    apiKey: "",
    apiEndpoint: "",
    callbackUrl: "",
    status: "active",
  });

  const selectedAggregator = useMemo(
    () => aggregators.find((a) => a.id === selectedAggId) || null,
    [aggregators, selectedAggId]
  );

  const presets: Record<string, typeof formData> = {
    swiggy: {
      merchantId: "SWG1234567890",
      apiKey: "AK8Hf87k3JfG2h8D51N1gQ0xP9h8sG9z",
      apiEndpoint: "https://api.swiggy.com/v1/orders",
      callbackUrl: "https://bistrobillpos.com/api/swiggy/order-status-update",
      status: "active",
    },
    zomato: {
      merchantId: "ZOM1234567890",
      apiKey: "ZM8Hf87k3JfG2h8D51N1gQ0xP9h8sG9z",
      apiEndpoint: "https://api.zomato.com/v1/orders",
      callbackUrl: "https://bistrobillpos.com/api/zomato/order-status-update",
      status: "active",
    },
    "uber-eats": {
      merchantId: "UBE1234567890",
      apiKey: "UE8Hf87k3JfG2h8D51N1gQ0xP9h8sG9z",
      apiEndpoint: "https://api.ubereats.com/v1/orders",
      callbackUrl: "https://bistrobillpos.com/api/ubereats/order-status-update",
      status: "active",
    },
  };

  const openAggregatorModal = (id: string) => {
    setSelectedAggId(id);
    setFormData(presets[id] || presets.swiggy);
    setOpenConnectModal(true);
  };

  const closeAggregatorModal = () => {
    setOpenConnectModal(false);
  };

  const handleSaveAggregator = async () => {
    if (!selectedAggId) return;
    setAggregators((prev) =>
      prev.map((a) => (a.id === selectedAggId ? { ...a, isConnected: true } : a))
    );
    setOpenConnectModal(false);
    await showConnectedSweetAlert();
  };

  const handleChannelToggle = (id: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  return (
    <>
      {/* ================= PAGE ================= */}
      <div className="bg-[#FFFBF3] border border-[#EADFC2] rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-[#EADFC2]">
          {/* ===== LEFT: SALES CHANNELS ===== */}
          <div className="p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6">
              Subscribed Sales Channels
            </h2>

            <div className="bg-white rounded-md border border-[#EADFC2] overflow-hidden shadow-sm max-w-md">
              <table className="w-full text-sm">
                <thead className="bg-yellow-400 text-black">
                  <tr>
                    <th className="text-left px-6 py-4 font-medium">Channel</th>
                    <th className="text-left px-6 py-4 font-medium w-40">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map((channel, index) => (
                    <tr
                      key={channel.id}
                      className={index % 2 ? "bg-[#FFF9E8]" : "bg-white"}
                    >
                      <td className="px-6 py-4">{channel.name}</td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleChannelToggle(channel.id)}
                          aria-pressed={channel.enabled}
                          className={`relative inline-flex w-10 h-5 cursor-pointer rounded-full transition ${
                            channel.enabled ? "bg-[#75B800]" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                              channel.enabled ? "right-0.5" : "left-0.5"
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== RIGHT: ONLINE AGGREGATORS ===== */}
          <div className="p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6">
              Online Aggregators
            </h2>

            <div className="grid grid-cols-2 gap-8 sm:gap-10">
              {aggregators.map((agg) => (
                <div
                  key={agg.id}
                  onClick={() => openAggregatorModal(agg.id)}
                  className={`cursor-pointer bg-white rounded-3xl shadow-md border-4 ${
                    agg.id === selectedAggId || agg.isConnected
                      ? "border-[#F7C948]"
                      : "border-transparent"
                  } flex items-center justify-center w-40 h-40 sm:w-44 sm:h-44`}
                >
                  <img
                    src={agg.logo}
                    alt={agg.name}
                    className="h-24 w-24 sm:h-28 sm:w-28 object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {openConnectModal && selectedAggregator && (
        <Modal open={openConnectModal} onClose={closeAggregatorModal}>
          <div className="w-[760px] px-10 py-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">
              Connect {selectedAggregator.name} Online Aggregators
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">
                  Merchant ID:{" "}
                  <span className="font-normal text-gray-600">
                    (Unique Identifier provided by {selectedAggregator.name})
                  </span>{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full h-[46px] border border-gray-200 rounded-md px-4"
                  value={formData.merchantId}
                  onChange={(e) => setFormData({ ...formData, merchantId: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  API Key / Access Token:{" "}
                  <span className="font-normal text-gray-600">
                    (Security Credentials for authentication)
                  </span>{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full h-[46px] border border-gray-200 rounded-md px-4"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Order Management API Endpoint:{" "}
                  <span className="font-normal text-gray-600">
                    (Enter the API URL for order Management)
                  </span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full h-[46px] border border-gray-200 rounded-md px-4"
                  value={formData.apiEndpoint}
                  onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Order Update Callback URL:{" "}
                  <span className="font-normal text-gray-600">
                    (Enter the URL for sending order status updates)
                  </span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full h-[46px] border border-gray-200 rounded-md px-4"
                  value={formData.callbackUrl}
                  onChange={(e) => setFormData({ ...formData, callbackUrl: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Status <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-[46px] border border-gray-200 rounded-md px-4 pr-10 appearance-none bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-10">
              <button
                onClick={closeAggregatorModal}
                className="px-8 h-[44px] border border-black rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAggregator}
                className="px-10 h-[44px] bg-yellow-400 rounded-md text-sm font-medium hover:bg-yellow-500"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default SalesSettingsPage;
