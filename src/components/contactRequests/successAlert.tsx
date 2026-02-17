import TickImg from "../../assets/tick.png";

type Props = {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export default function SuccessAlert({
  open,
  title,
  message,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 text-center relative">

        {/* ICON */}
        <div className="flex justify-center mb-4">
          <img
            src={TickImg}
            alt="success"
            className="w-14 h-14"
          />
        </div>

        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-gray-600 mt-2">{message}</p>

        <button
          onClick={onClose}
          className="mt-6 bg-[#FDC836] px-6 py-2 rounded-md text-sm font-medium"
        >
          OK
        </button>
      </div>
    </div>
  );
}
