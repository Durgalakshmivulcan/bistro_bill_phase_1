import React from "react";
import { ActivityItem as Item } from "../../types/orderActivity";
import { Check } from "lucide-react";

type Props = {
  item: Item;
  isLast: boolean;
};

const ActivityItem: React.FC<Props> = ({ item, isLast }) => {
  const isCompleted = item.completed;

  return (
    <div className="flex gap-4">
      {/* Indicator */}
      <div className="flex flex-col items-center">
        {/* Circle */}
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center
            ${
              isCompleted
                ? "bg-yellow-400 text-black"
                : "border border-gray-300 bg-white"
            }`}
        >
          {isCompleted && <Check size={14} />}
        </div>

        {/* Vertical line */}
        {!isLast && (
          <div
            className={`w-px flex-1 mt-1
              ${isCompleted ? "bg-gray-300" : "bg-gray-200"}`}
          />
        )}
      </div>

      {/* Content */}
      <div className="pb-6">
        <p
          className={`text-sm font-medium
            ${isCompleted ? "text-gray-800" : "text-gray-400"}`}
        >
          {item.title}
        </p>

        {item.description && (
          <p className="text-xs text-gray-500 mt-1">
            {item.description}
          </p>
        )}

        {item.time && (
          <p className="text-xs text-gray-400 mt-1">
            {item.time}
          </p>
        )}
      </div>
    </div>
  );
};

export default ActivityItem;
