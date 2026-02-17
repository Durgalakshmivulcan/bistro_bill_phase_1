import { ChevronDown } from "lucide-react";

interface AccordionItemProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  rightAction?: React.ReactNode;
  children?: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  isOpen,
  onToggle,
  rightAction,
  children,
}) => {
  return (
    <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
      
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="
          w-full
          px-4 py-3
          bg-[#FFE08A]
          text-[#655016]
          font-medium text-sm
          hover:bg-[#ffdb70]
          transition
          flex items-center justify-between
        "
      >
        {/* Title */}
        <span className="text-left">{title}</span>

        {/* Right action + Chevron */}
        <div className="flex items-center gap-2">
          {rightAction && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center"
            >
              {rightAction}
            </div>
          )}

          <ChevronDown
            size={18}
            className={`transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="bg-white px-4 py-4 text-sm text-gray-700">
          {children}
        </div>
      )}
    </div>
  );
};

export default AccordionItem;
