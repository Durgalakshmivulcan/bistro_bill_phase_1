import Modal from "../../ui/Modal";
import TickIcon from "../../../assets/tick.png";

interface Props {
  open: boolean;
  onClose: () => void;
}

const ProfileModule = ({ open, onClose }: Props) => {
  return (
    <Modal open={open} onClose={onClose} className="w-[320px] p-6">
      <div className="flex flex-col items-center text-center gap-3">
        {/* ✅ Tick Image */}
       
        <img
        src={TickIcon}
        alt="Password changed successfully"
        className="w-10 h-10"
        />

        <h2 className="text-base font-semibold">
          Profile Updated
        </h2>

        <p className="text-sm text-gray-500">
          Profile updated successfully
        </p>
      </div>
    </Modal>
  );
};

export default ProfileModule;
