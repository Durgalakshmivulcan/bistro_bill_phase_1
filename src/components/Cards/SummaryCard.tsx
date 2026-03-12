interface SummaryCardProps {
  title: string;
  value: number;
  icon: string;
}

const SummaryCard = ({ title, value, icon }: SummaryCardProps) => {
  const isImageIcon =
    icon.startsWith("data:image/") ||
    /(\.png|\.jpe?g|\.svg|\.webp|\.gif)(\?.*)?$/i.test(icon);

  return (
    <div className="bg-white border border-bb-border rounded-lg p-4 flex gap-3 items-center flex-wrap">
      <div className="flex items-center justify-center w-10 h-10">
        {isImageIcon ? (
          <img src={icon} alt={`${title} icon`} className="w-10 h-10 object-contain" />
        ) : (
          <span className="text-3xl">{icon}</span>
        )}
      </div>
      <div>
        <div className="text-xs text-bb-textSoft">{title}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </div>
  );
};

export default SummaryCard;
