import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { Datawalkthroughmodal } from "./datawalkthroughmodal";

interface Props {
  open: boolean;
  onClose: () => void;
  onBackToWelcome: () => void;
  onFinished?: () => void; // ⭐ NEW
}


const WalkthroughModal = ({
  open,
  onClose,
  onBackToWelcome,
  onFinished,
}: Props) => {

  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open || !Datawalkthroughmodal.length) return null;

  const current = Datawalkthroughmodal[step];

  
  return (
    <Modal open={open} onClose={onClose} className="w-[250px] p-4">
      {/* Image */}
      <div className="rounded-lg overflow-hidden mb-3">
        <img
          src={current.image}
          alt={current.title || ""}
          className="w-full h-[100px] object-cover"
        />
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-yellow-600 text-center">
        {current.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-gray-500 text-center mt-1 mb-4">
        {current.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <button
  onClick={() => {
    if (step === 0) {
      onBackToWelcome(); // 👈 go to welcome
    } else {
      setStep((prev) => prev - 1);
    }
  }}
  className="px-4 py-2 border rounded-md text-sm disabled:opacity-40"
>
  Back
</button>


        {step === Datawalkthroughmodal.length - 1 ? (
           <button
    onClick={() => onFinished?.()}
            className="px-4 py-2 bg-bb-primary text-black rounded-md text-sm"
          >
            Finish
          </button>
        ) : (
          <button
            onClick={() => setStep(step + 1)}
            className="px-4 py-2 bg-bb-primary text-black rounded-md text-sm"
          >
            Next
          </button>
        )}
      </div>
    </Modal>
  );
};

export default WalkthroughModal;
