interface SummaryCardProps {
  title: string;
  value: number;
  icon: string;
}

const SummaryCard = ({ title, value, icon }: SummaryCardProps) => {
  return (
    <div className="bg-white border border-bb-border rounded-lg p-4 flex gap-3 items-center flex-wrap">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-xs text-bb-textSoft">{title}</div>
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </div>
  );
};

export default SummaryCard;
