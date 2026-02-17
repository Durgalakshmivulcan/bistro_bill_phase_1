import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  category: "global" | "pos" | "forms";
  handler: () => void;
}

const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);

export function getModifierLabel(): string {
  return isMac ? "Cmd" : "Ctrl";
}

export function formatShortcut(shortcut: Pick<KeyboardShortcut, "key" | "ctrl" | "shift" | "alt">): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push(getModifierLabel());
  if (shortcut.alt) parts.push("Alt");
  if (shortcut.shift) parts.push("Shift");
  parts.push(shortcut.key.toUpperCase());
  return parts.join("+");
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || (el as HTMLElement).isContentEditable;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl
          ? isMac
            ? e.metaKey
            : e.ctrlKey
          : true;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          // Allow Ctrl+shortcuts even when input focused (except Esc which always works)
          if (shortcut.key === "Escape" || shortcut.ctrl || !isInputFocused()) {
            e.preventDefault();
            e.stopPropagation();
            shortcut.handler();
            return;
          }
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
