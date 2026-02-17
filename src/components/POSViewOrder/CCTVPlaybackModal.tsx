import { useState, useEffect } from "react";
import { Camera, ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import Modal from "../ui/Modal";
import { getOrderFootage, type FootageLink } from "../../services/cctvService";

interface CCTVPlaybackModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber?: string;
}

const CCTVPlaybackModal: React.FC<CCTVPlaybackModalProps> = ({
  open,
  onClose,
  orderId,
  orderNumber,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [footageLinks, setFootageLinks] = useState<FootageLink[]>([]);
  const [selectedFootage, setSelectedFootage] = useState<FootageLink | null>(null);

  useEffect(() => {
    if (open && orderId) {
      fetchFootage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderId]);

  async function fetchFootage() {
    setLoading(true);
    setError(null);
    try {
      const response = await getOrderFootage(orderId);
      if (response.success && response.data) {
        const successLinks = response.data.footage.filter((f) => f.success);
        setFootageLinks(successLinks);
        if (successLinks.length > 0) {
          setSelectedFootage(successLinks[0]);
        }
      } else {
        setError(response.message || "Failed to fetch footage");
      }
    } catch {
      setError("Failed to fetch CCTV footage");
    } finally {
      setLoading(false);
    }
  }

  function formatTime(isoStr?: string) {
    if (!isoStr) return "N/A";
    return new Date(isoStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="w-[95%] max-w-3xl p-6"
    >
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
        <Camera size={20} />
        CCTV Footage
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        {orderNumber ? `Order #${orderNumber}` : `Order ${orderId}`}
      </p>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 size={24} className="animate-spin mr-2" />
          Loading footage...
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center py-8 text-gray-500">
          <AlertCircle size={32} className="text-red-400 mb-2" />
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button
            onClick={fetchFootage}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && footageLinks.length === 0 && (
        <div className="flex flex-col items-center py-8 text-gray-500">
          <Camera size={32} className="text-gray-300 mb-2" />
          <p className="text-sm">No CCTV footage available for this order</p>
          <p className="text-xs text-gray-400 mt-1">
            Cameras may not be configured for this branch
          </p>
        </div>
      )}

      {/* Footage Content */}
      {!loading && !error && footageLinks.length > 0 && (
        <div className="space-y-4">
          {/* Camera Selector */}
          {footageLinks.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {footageLinks.map((footage, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedFootage(footage)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                    selectedFootage === footage
                      ? "bg-yellow-100 border-yellow-400 text-yellow-800 font-medium"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Camera size={12} className="inline mr-1" />
                  {footage.cameraName || `Camera ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* Video Player / Playback Area */}
          {selectedFootage && (
            <div className="space-y-3">
              <div className="bg-black rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
                {selectedFootage.playbackUrl ? (
                  <video
                    key={selectedFootage.playbackUrl}
                    controls
                    className="w-full h-full"
                    poster=""
                  >
                    <source src={selectedFootage.playbackUrl} type="video/mp4" />
                    <p className="text-white text-sm p-4 text-center">
                      Your browser does not support video playback.
                      <br />
                      <a
                        href={selectedFootage.playbackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline mt-2 inline-block"
                      >
                        Open in external player
                      </a>
                    </p>
                  </video>
                ) : (
                  <p className="text-gray-400 text-sm">No playback URL available</p>
                )}
              </div>

              {/* Footage Details */}
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                <div>
                  <span className="font-medium text-gray-800">Camera:</span>{" "}
                  {selectedFootage.cameraName}
                </div>
                <div>
                  <span className="font-medium text-gray-800">Location:</span>{" "}
                  {selectedFootage.cameraLocation}
                </div>
                <div>
                  <span className="font-medium text-gray-800">Start:</span>{" "}
                  {formatTime(selectedFootage.startTime)}
                </div>
                <div>
                  <span className="font-medium text-gray-800">End:</span>{" "}
                  {formatTime(selectedFootage.endTime)}
                </div>
              </div>

              {/* Open in External Player */}
              {selectedFootage.playbackUrl && (
                <a
                  href={selectedFootage.playbackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <ExternalLink size={12} />
                  Open in external player
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default CCTVPlaybackModal;
