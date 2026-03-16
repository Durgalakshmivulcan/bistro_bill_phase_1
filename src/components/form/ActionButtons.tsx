import {
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Star,
  Mail,
  Download,
  FileText,
  RefreshCcw,
  Clock, // ✅ UNAVAILABLE ICON
  Package, // ✅ ADJUST STOCK ICON
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

type ActionType =
  | "view"
  | "edit"
  | "delete"
  | "resend"
  | "updateStatus"
  | "favourite"
  | "download"
  | "logs"        // ✅ ADD THIS
  | "unavailable"
  | "adjustStock";
  interface ActionsMenuProps {
    actions: ActionType[];
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onFavourite?: () => void;
    onResend?: () => void;
    onDownload?: () => void;
    onUpdateStatus?: () => void;
    onUnavailable?: () => void;
    onAdjustStock?: () => void;
    onLogs?: () => void; // ✅ ADD THIS
  }

  export default function ActionsMenu({
    actions,
    onView,
    onEdit,
    onDelete,
    onResend,
    onFavourite,
    onDownload,
    onUpdateStatus,
    onUnavailable,
    onAdjustStock,
    onLogs, // ✅ ADD THIS
  }: ActionsMenuProps){
      const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const closeAndRun = (fn?: () => void) => {
    setOpen(false);
    fn?.();
  };

  return (
    <div ref={ref} className="relative inline-block">
      <MoreVertical
        size={16}
        className="cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      />

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow z-50">
          {actions.includes("view") && (
            <button
              onClick={() => closeAndRun(onView)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full"
            >
              <Eye size={14} /> View
            </button>
          )}

          {actions.includes("edit") && (
            <button
              onClick={() => closeAndRun(onEdit)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full"
            >
              <Pencil size={14} /> Edit
            </button>
          )}

          {actions.includes("unavailable") && (
            <button
              onClick={() => closeAndRun(onUnavailable)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full"
            >
              <Clock size={14} /> Mark Unavailable
            </button>
          )}

          {actions.includes("adjustStock") && (
            <button
              onClick={() => closeAndRun(onAdjustStock)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full"
            >
              <Package size={14} /> Adjust Stock
            </button>
          )}

          {actions.includes("updateStatus") && (
            <button
              onClick={() => closeAndRun(onUpdateStatus)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full"
            >
              <RefreshCcw size={14} /> Update Status
            </button>
          )}

          {actions.includes("delete") && (
            <button
              onClick={() => closeAndRun(onDelete)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}

          {actions.includes("favourite") && (
            <button
              onClick={() => closeAndRun(onFavourite)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full"
            >
              <Star size={14} /> Favorite
            </button>
          )}

          {actions.includes("resend") && (
            <button
              onClick={() => closeAndRun(onResend)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full"
            >
              <Mail size={14} /> Resend
            </button>
          )}

          {actions.includes("download") && (
            <button
              onClick={() => closeAndRun(onDownload)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full"
            >
              <Download size={14} /> Download
            </button>
          )}

          {actions.includes("logs") && (
            <button
              onClick={() => closeAndRun(onLogs)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full"
            >
              <FileText size={14} /> Logs &amp; Transactions
            </button>
          )}
        </div>
      )}
    </div>
  );
}
