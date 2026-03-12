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

      <h2 className="text-lg font-bold text-center mb-2">
        Welcome Aboard! 🎉
      </h2>

      <p className="text-sm text-center text-gray-500 mb-4">
        This tour will guide you through the key features and functionalities we offer, ensuring you have a smooth and successful start.
      </p>

      <div className="space-y-2">
        {/* 🔥 THIS MUST BE onStartWalkthrough */}
        <button
          onClick={onStartWalkthrough}
          className="w-full bg-bb-primary text-black py-2 rounded-md text-sm"
        >
          Give me a walkthrough
        </button>

        <button
          onClick={onClose}
          className="w-full border py-2 rounded-md text-sm"
        >
          I don’t need help, I'll do it myself
        </button>
      </div>
    </Modal>
  );
};

export default WelcomeAboardModal;
