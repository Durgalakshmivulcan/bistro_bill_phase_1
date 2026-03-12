import { Upload } from "lucide-react";

type FileUploadInputProps = {
  label: string;
  required?: boolean;
  placeholder?: string;
  onChange?: (file: File | null) => void;
  hidePreview?: boolean;
  buttonLabel?: string;
  accept?: string;
  buttonClass?: string;
  disabled?: boolean;
};

export default function FileUploadInput({
  label,
  required = false,
  placeholder = "Upload file",
  onChange,
  accept,
  disabled = false,
}: FileUploadInputProps) {
  return (
    <div className="space-y-1">
      {/* LABEL */}
      <label className="font-bold text-sm">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* CUSTOM FILE INPUT */}
      <label className={`flex items-center gap-2 border rounded-md px-3 py-2 bg-bb-bg text-sm text-bb-textSoft transition ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-yellow-400"
      }`}>
        <Upload size={16} />
        <span>{placeholder}</span>

        <input
          type="file"
          className="hidden"
          accept={accept}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.files?.[0] || null)}
        />
      </label>
    </div>
  );
}
