import { useState, useEffect } from "react";
import Modal from "../../ui/Modal";
import {
  Truck,
  Clock,
  DollarSign,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  getDeliveryEstimates,
  dispatchDelivery,
} from "../../../services/orderService";
import type {
  DeliveryProvider,
  DeliveryEstimate,
  DeliveryInfo,
} from "../../../services/orderService";

interface DeliveryDispatchModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  onDispatchSuccess?: (delivery: DeliveryInfo) => void;
}

const PROVIDER_LABELS: Record<DeliveryProvider, string> = {
  dunzo: "Dunzo",
  porter: "Porter",
  internal: "Internal Delivery",
};

const PROVIDER_DESCRIPTIONS: Record<DeliveryProvider, string> = {
  dunzo: "Third-party delivery via Dunzo",
  porter: "Third-party delivery via Porter",
  internal: "Use your own delivery staff",
};

const DeliveryDispatchModal: React.FC<DeliveryDispatchModalProps> = ({
  open,
  onClose,
  orderId,
  onDispatchSuccess,
}) => {
  const [selectedProvider, setSelectedProvider] =
    useState<DeliveryProvider | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<
    "success" | "error" | null
  >(null);
  const [dispatchedDelivery, setDispatchedDelivery] =
    useState<DeliveryInfo | null>(null);
  const [estimates, setEstimates] = useState<DeliveryEstimate[]>([]);
  const [loadingEstimates, setLoadingEstimates] = useState(false);

  // Fetch delivery estimates from API when modal opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function fetchEstimates() {
      setLoadingEstimates(true);
      try {
        const res = await getDeliveryEstimates(orderId);
        if (!cancelled && res.success && res.data) {
          setEstimates(res.data.estimates);
        }
      } catch {
        // Estimates will remain empty; user sees empty state
      } finally {
        if (!cancelled) setLoadingEstimates(false);
      }
    }
    fetchEstimates();
    return () => { cancelled = true; };
  }, [open, orderId]);

  const handleDispatch = async () => {
    if (!selectedProvider) return;

    setDispatching(true);
    setDispatchResult(null);

    try {
      const res = await dispatchDelivery(orderId, { provider: selectedProvider });

      if (res.success && res.data) {
        setDispatchedDelivery(res.data.delivery);
        setDispatchResult("success");
        onDispatchSuccess?.(res.data.delivery);
      } else {
        setDispatchResult("error");
      }
    } catch {
      setDispatchResult("error");
    } finally {
      setDispatching(false);
    }
  };

  const handleClose = () => {
    setSelectedProvider(null);
    setDispatchResult(null);
    setDispatchedDelivery(null);
    setEstimates([]);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} className="w-[90%] max-w-lg p-6">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
        <Truck size={20} />
        Send for Delivery
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        Select a delivery partner to dispatch order #{orderId.slice(-6)}
      </p>

      {/* Success State */}
      {dispatchResult === "success" && dispatchedDelivery && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800">
                Delivery Dispatched!
              </p>
              <p className="text-sm text-green-700">
                Order assigned to {PROVIDER_LABELS[dispatchedDelivery.provider]}.
                ETA: {dispatchedDelivery.estimatedDeliveryTime}
              </p>
            </div>
          </div>

          {dispatchedDelivery.trackingUrl && (
            <a
              href={dispatchedDelivery.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink size={14} />
              Track Delivery Live
            </a>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleClose}
              className="bg-yellow-400 px-6 py-2 rounded font-medium text-sm hover:bg-yellow-500"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {dispatchResult === "error" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800">Dispatch Failed</p>
              <p className="text-sm text-red-700">
                Could not dispatch delivery. Please try again.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setDispatchResult(null)}
              className="border border-gray-300 px-6 py-2 rounded text-sm"
            >
              Try Again
            </button>
            <button
              onClick={handleClose}
              className="border border-gray-300 px-6 py-2 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Provider Selection (initial state) */}
      {dispatchResult === null && (
        <>
          {loadingEstimates ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading delivery options...</span>
            </div>
          ) : estimates.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No delivery providers available for this order.
            </div>
          ) : null}
          <div className="space-y-3 mb-5">
            {estimates.map((estimate) => (
              <label
                key={estimate.provider}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition ${
                  !estimate.available
                    ? "opacity-50 cursor-not-allowed bg-gray-50"
                    : selectedProvider === estimate.provider
                      ? "bg-yellow-50 border-yellow-400"
                      : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryProvider"
                  checked={selectedProvider === estimate.provider}
                  onChange={() =>
                    estimate.available &&
                    setSelectedProvider(estimate.provider)
                  }
                  disabled={!estimate.available}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {PROVIDER_LABELS[estimate.provider]}
                    </span>
                    {!estimate.available && (
                      <span className="text-xs text-red-500">Unavailable</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {PROVIDER_DESCRIPTIONS[estimate.provider]}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {estimate.estimatedTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={12} />
                      {estimate.estimatedCost > 0
                        ? `₹${estimate.estimatedCost}`
                        : "Free"}
                    </span>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="border border-gray-300 px-6 py-2 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleDispatch}
              disabled={!selectedProvider || dispatching}
              className="bg-yellow-400 px-6 py-2 rounded font-medium text-sm hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {dispatching ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Dispatching...
                </>
              ) : (
                "Confirm Delivery"
              )}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default DeliveryDispatchModal;
