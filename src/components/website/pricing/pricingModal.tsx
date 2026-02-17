type Props = {
  open: boolean;
  title: string;
  features: string[];
  actionLabel: string;
  onClose: () => void;
};

export default function PricingFeaturesModal({
  open,
  title,
  features,
  actionLabel,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h3 className="font-semibold text-lg mb-4">{title}</h3>

        <ul className="space-y-2 text-sm max-h-[400px] overflow-y-auto">
          {features.map((f) => (
            <li key={f}>• {f}</li>
          ))}
        </ul>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded"
          >
            Cancel
          </button>
          <button className="px-4 py-2 text-sm bg-[#FDC836] rounded">
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
