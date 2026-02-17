type TextareaProps = {
  label: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

const Textarea = ({
  label,
  required = false,
  placeholder,
  rows = 4,
  value,
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
        "
      />
    </div>
  );
};

export default Textarea;
