import { X } from "lucide-react";
import { useEffect } from "react";
import { getModifierLabel } from "../../hooks/useKeyboardShortcuts";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const mod = getModifierLabel();

const SHORTCUT_SECTIONS = [
  {
    title: "Global",
    shortcuts: [
      { keys: `${mod}+K`, description: "Focus search" },
      { keys: `${mod}+/`, description: "Show keyboard shortcuts" },
      { keys: "Esc", description: "Close modal / panel" },
    ],
  },
  {
    title: "Point of Sale",
    shortcuts: [
      { keys: `${mod}+N`, description: "New order" },
      { keys: `${mod}+S`, description: "Save draft order" },
      { keys: `${mod}+P`, description: "Print current order" },
    ],
  },
  {
    title: "Forms",
    shortcuts: [
      { keys: `${mod}+S`, description: "Save form" },
      { keys: "Esc", description: "Cancel / close" },
    ],
  },
];

const KeyboardShortcutsModal = ({ open, onClose }: KeyboardShortcutsModalProps) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-lg z-10 w-[95%] max-w-lg p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-black"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h2>

        <div className="space-y-5 max-h-[60vh] overflow-y-auto">
          {SHORTCUT_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-medium text-bb-textSoft uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.keys + shortcut.description}
                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50"
                  >
                    <span className="text-sm text-bb-text">
                      {shortcut.description}
                    </span>
                    <kbd className="inline-flex items-center gap-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded px-2 py-1 text-gray-600">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-bb-textSoft mt-4 text-center">
          Press <kbd className="bg-gray-100 border border-gray-300 rounded px-1.5 py-0.5 text-xs font-mono">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
