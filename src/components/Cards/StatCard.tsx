interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  iconBg: string;
}

const StatCard = ({ title, value, icon, iconBg }: StatCardProps) => {
  return (
    <div className="relative bg-bb-surface border border-bb-border rounded-xl p-4 shadow-sm flex items-center gap-4 flex-wrap min-h-30">
      
      {/* Icon */}
      <div
        className={`min-h-[50%] aspect-square rounded-xl flex items-center justify-center text-2xl ${iconBg}`}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex flex-col justify-center">
        <span className="text-xs text-bb-textSoft">{title}</span>
        <span className="text-lg font-semibold text-bb-text">{value}</span>
      </div>

    </div>
  );
};

export default StatCard;
