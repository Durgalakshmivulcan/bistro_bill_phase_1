type TextareaProps = {
  label: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  value?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

const Textarea = ({
  label,
  required = false,
  placeholder,
  rows = 4,
  value,
  disabled = false,
  onChange,
}: TextareaProps) => {
  return (
    <div className="space-y-1">
      <label className="font-bold">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <textarea
        rows={rows}
        placeholder={placeholder || `Enter ${label}`}
        value={value}
        disabled={disabled}
        onChange={onChange}
        className="
          w-full
          border
          rounded-md
          px-3
          py-2
          bg-bb-bg
          resize-none
          focus:outline-none
          focus:ring-1
          focus:ring-yellow-400
          disabled:opacity-60
          disabled:cursor-not-allowed
        "
      />
    </div>
  );
};

export default Textarea;
