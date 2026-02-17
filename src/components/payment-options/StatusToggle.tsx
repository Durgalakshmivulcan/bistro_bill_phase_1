type Props = {
  enabled: boolean;
  onChange: () => void;
};

const StatusToggle: React.FC<Props> = ({ enabled, onChange }) => {
  return (
    <div
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={`w-10 h-5 rounded-full relative cursor-pointer transition
        ${enabled ? "bg-green-500" : "bg-gray-300"}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition
          ${enabled ? "right-0.5" : "left-0.5"}`}
      />
    </div>
  );
};

export default StatusToggle;
