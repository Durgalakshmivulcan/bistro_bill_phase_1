import Modal from "../ui/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onStartWalkthrough: () => void; // REQUIRED
}

const WelcomeAboardModal = ({
  open,
  onClose,
  onStartWalkthrough,
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

      <h2 className="text-lg font-semibold text-center mb-2">
        Welcome Aboard! 🎉
      </h2>

      <p className="text-sm text-center text-gray-500 mb-4">
        This tour will guide you through the key features and functionalities.
      </p>

      <div className="space-y-2">
        {/* 🔥 THIS MUST BE onStartWalkthrough */}
        <button
          onClick={onStartWalkthrough}
          className="w-full bg-bb-primary text-white py-2 rounded-md text-sm"
        >
          Give me a walkthrough
        </button>

        <button
          onClick={onClose}
          className="w-full border py-2 rounded-md text-sm"
        >
          I don’t need help
        </button>
      </div>
    </Modal>
  );
};

export default WelcomeAboardModal;
