import React from "react";
import type { StatItem } from "../data/dashboard";

type Props = {
  stat: StatItem;
};

const StatCard: React.FC<Props> = ({ stat }) => {
  return (
    <div className="bg-white border border-borderLight rounded-xl shadow-card px-4 py-3 flex items-center gap-3">
      <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center">
        <span className="text-gray-400 text-xl">🖼</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-textMuted uppercase tracking-wide">
          {stat.label}
        </span>
        <span className="text-lg font-semibold">{stat.value}</span>
      </div>
    </div>
  );
};

export default StatCard;
