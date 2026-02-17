type CheckboxProps = {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
};

const Checkbox = ({ label, checked = false, onChange }: CheckboxProps) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="
          h-4 w-4
          accent-yellow-400
          cursor-pointer
        "
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
};

export default Checkbox;
