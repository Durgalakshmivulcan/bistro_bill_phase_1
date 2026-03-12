import Modal from "../ui/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onFinished?: () => void; // ⭐ NEW
}


const FishedModal = ({
  open,
  onClose,
}: Props) => {
  return (
    <Modal open={open} onClose={onClose} className="w-[420px] p-4">
      <div className="rounded-lg overflow-hidden mb-4">
        <img
          src="/images/welcome-food.jpg"
          alt="Welcome"
          className="w-full h-44 object-cover"
        />
      </div>

      <h2 className="text-lg font-bold text-center mb-2">
        Product Tour Completed!
      </h2>

      <p className="text-sm text-center text-gray-500 mb-4">
        Thank you for exploring the features of our POS system. If you have any questions or need assistance, please contact the Bistro bill sales team. We’re here to support your operations!
      </p>

      <div className="space-y-2">
        {/* 🔥 THIS MUST BE onStartWalkthrough */}
        <button
        //   onClick={onStartWalkthrough}
          className="w-full bg-bb-primary text-black py-2 rounded-md text-sm"
        >
          Contact Sales Team
        </button>
      </div>
    </Modal>
  );
};

export default FishedModal;
