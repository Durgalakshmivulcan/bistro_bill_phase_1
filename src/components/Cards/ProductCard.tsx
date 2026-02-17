import { useState } from "react";
import { Eye } from "lucide-react";
import Actions from "../form/ActionButtons";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/ui/Modal";
import ProductQuickViewModal from "../Catalog/products/ProductQuickViewModal";
import favoriteImg from "../../assets/favorite.png";
import deleteImg from "../../assets/deleteConformImg.png";
import conformDeleteImg from "../../assets/deleteSuccessImg.png";
import successImg from "../../assets/tick.png";
import { usePermissions } from "../../hooks/usePermissions";

interface ProductCardProps {
  id?: number;
  name: string;
  price: number | string;
  image?: string;
  imageUrl?: string;
  onDelete?: (id: number) => void;
}

const TIME_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
  "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM",
  "10:00 PM", "10:30 PM"
];

const CHANNELS = [
  "Dine In",
  "Take Away",
  "Swiggy",
  "Zomato",
  "Uber Eats",
  "Subscription",
  "Catering"
];

const ProductCard = ({
  id,
  name,
  price,
  image,
  imageUrl,
  onDelete,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { canUpdate, canDelete } = usePermissions('catalog');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletedOpen, setDeletedOpen] = useState(false);
  const [favouriteOpen, setFavouriteOpen] = useState(false);

  /* ---------------- UNAVAILABLE STATES ---------------- */
  const [unavailableChannelOpen, setUnavailableChannelOpen] = useState(false);
  const [unavailableTimeOpen, setUnavailableTimeOpen] = useState(false);
  const [unavailableSuccessOpen, setUnavailableSuccessOpen] = useState(false);

  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);

  const imgSrc = imageUrl || image || "/placeholder.jpg";

  /* ---------------- DELETE ---------------- */
  const handleDeleteConfirm = () => {
    if (id !== undefined) {
      onDelete?.(id);
    }

    setDeleteOpen(false);
    setDeletedOpen(true);

    setTimeout(() => {
      setDeletedOpen(false);
    }, 2000);
  };

  /* ---------------- FAVORITE ---------------- */
  const handleFavourite = () => {
    setFavouriteOpen(true);
    setTimeout(() => {
      setFavouriteOpen(false);
    }, 2000);
  };

  /* ---------------- UNAVAILABLE FLOW ---------------- */
  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const toggleTime = (time: string) => {
    setSelectedTimes((prev) =>
      prev.includes(time)
        ? prev.filter((t) => t !== time)
        : [...prev, time]
    );
  };

  const handleUnavailableSave = () => {
    setUnavailableTimeOpen(false);
    setUnavailableSuccessOpen(true);

    setTimeout(() => {
      setUnavailableSuccessOpen(false);
      setSelectedChannels([]);
      setSelectedTimes([]);
    }, 2000);
  };

  return (
    <>
      {/* ================= CARD ================= */}
      <div className="relative bg-white border border-bb-border rounded-lg p-3 flex gap-3 flex-wrap">
        {/* Image with eye icon overlay */}
        <div className="relative group">
          <img
            src={imgSrc}
            alt={name}
            className="w-16 h-12 rounded object-cover bg-gray-100"
          />
          <button
            onClick={() => id !== undefined && setQuickViewOpen(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            title="Quick View"
          >
            <Eye size={16} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="text-sm font-medium">{name}</div>
          <div className="text-xs text-bb-textSoft">
            Price : {typeof price === "number" ? `₹ ${price}` : price}
          </div>
        </div>

        {/* Menu Button */}
        <Actions
          actions={[
            "view",
            ...(canUpdate ? ["edit" as const] : []),
            ...(canUpdate ? ["unavailable" as const] : []),
            ...(canDelete ? ["delete" as const] : []),
            "favourite",
          ]}
          onView={() => {
            if (id !== undefined) {
              setQuickViewOpen(true);
            }
          }}
          onEdit={
            canUpdate
              ? () => {
                  if (id !== undefined) {
                    navigate(`/catalog/products/edit/${id}`);
                  }
                }
              : undefined
          }
          onDelete={canDelete ? () => setDeleteOpen(true) : undefined}
          onFavourite={handleFavourite}
          onUnavailable={
            canUpdate ? () => setUnavailableChannelOpen(true) : undefined
          }
        />
      </div>

      {/* ================= UNAVAILABLE - CHANNEL SELECT ================= */}
      <Modal
        open={unavailableChannelOpen}
        onClose={() => setUnavailableChannelOpen(false)}
        className="w-[90%] max-w-md p-8"
      >
        <h2 className="text-xl font-bold mb-4 text-center">
          Mark Unavailable
        </h2>

        <p className="text-sm text-gray-600 mb-4 text-center">
          Select the channels where you want this product to be unavailable.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {CHANNELS.map((channel) => (
            <label
              key={channel}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedChannels.includes(channel)}
                onChange={() => toggleChannel(channel)}
              />
              {channel}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setUnavailableChannelOpen(false)}
            className="border border-black px-6 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              setUnavailableChannelOpen(false);
              setUnavailableTimeOpen(true);
            }}
            className="bg-yellow-400 px-8 py-2 rounded font-medium"
            disabled={selectedChannels.length === 0}
          >
            Next
          </button>
        </div>
      </Modal>

      {/* ================= UNAVAILABLE - TIME SELECT ================= */}
      <Modal
        open={unavailableTimeOpen}
        onClose={() => setUnavailableTimeOpen(false)}
        className="w-[95%] max-w-lg p-8"
      >
        <h2 className="text-xl font-bold mb-4 text-center">
          Mark Unavailable
        </h2>

        <p className="text-sm text-gray-600 mb-4 text-center">
          Select the time slots where you want this product to be unavailable.
        </p>

        <div className="grid grid-cols-4 gap-2 mb-6">
          {TIME_SLOTS.map((time) => (
            <button
              key={time}
              onClick={() => toggleTime(time)}
              className={`text-xs px-2 py-2 rounded border transition ${
                selectedTimes.includes(time)
                  ? "bg-yellow-400 border-black font-medium"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              {time}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setUnavailableTimeOpen(false)}
            className="border border-black px-6 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleUnavailableSave}
            className="bg-yellow-400 px-8 py-2 rounded font-medium"
            disabled={selectedTimes.length === 0}
          >
            Save
          </button>
        </div>
      </Modal>

      {/* ================= UNAVAILABLE SUCCESS ================= */}
      <Modal
        open={unavailableSuccessOpen}
        onClose={() => setUnavailableSuccessOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">
          Saved Changes
        </h2>

        <div className="flex justify-center mb-4">
          <img src={successImg} alt="Success" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          Product marked as unavailable successfully.
        </p>
      </Modal>

      {/* 🔴 DELETE CONFIRM MODAL */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Delete</h2>

        <div className="flex justify-center mb-4">
          <img src={deleteImg} alt="Delete" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600 mb-6">
          This action cannot be undone. <br />
          Do you want to proceed with deletion?
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setDeleteOpen(false)}
            className="border border-black px-6 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleDeleteConfirm}
            className="bg-yellow-400 px-8 py-2 rounded font-medium"
          >
            Yes
          </button>
        </div>
      </Modal>

      {/* 🔵 DELETE SUCCESS MODAL */}
      <Modal
        open={deletedOpen}
        onClose={() => setDeletedOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">Deleted!</h2>

        <div className="flex justify-center mb-4">
          <img src={conformDeleteImg} alt="Delete" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          Product has been successfully removed.
        </p>
      </Modal>

      {/* ⭐ FAVORITE SUCCESS MODAL */}
      <Modal
        open={favouriteOpen}
        onClose={() => setFavouriteOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">
          Marked as Favorite
        </h2>

        <div className="flex justify-center mb-4">
          <img src={favoriteImg} alt="Favorite" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          Product successfully added to favorites!
        </p>
      </Modal>

      {/* 👁 PRODUCT QUICK VIEW MODAL */}
      {id !== undefined && (
        <ProductQuickViewModal
          open={quickViewOpen}
          productId={id}
          onClose={() => setQuickViewOpen(false)}
          onDelete={onDelete}
        />
      )}
    </>
  );
};

export default ProductCard;
