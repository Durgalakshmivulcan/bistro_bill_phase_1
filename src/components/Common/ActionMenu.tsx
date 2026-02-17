import React, { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import successIcon from "../../assets/deleteSuccessImg.png";
import deleteIcon from "../../assets/deleteConformImg.png";

type Props = {
  onEdit?: () => void;
  onDelete?: () => Promise<void> | void;
};

const ActionMenu: React.FC<Props> = ({ onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* DELETE FLOW */
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete",
      html: `
        <div style="display:flex; justify-content:center; margin:16px 0;">
          <img src="${deleteIcon}" style="width:48px; height:48px;" />
        </div>
        <p style="font-size:14px; color:#6b7280; text-align:center;">
          This action cannot be undone. Do you want to proceed with deletion?
        </p>
      `,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes",
      reverseButtons: true,
      buttonsStyling: false,
      didOpen: () => {
        const confirm = Swal.getConfirmButton();
        const cancel = Swal.getCancelButton();
        const actions = Swal.getActions();

        if (actions) {
          actions.style.display = "flex";
          actions.style.justifyContent = "center";
          actions.style.gap = "12px"; // ✅ SPACE
          actions.style.flexWrap = "wrap"; // ✅ RESPONSIVE
        }

        if (confirm) {
          confirm.style.background = "#facc15";
          confirm.style.color = "#000";
          confirm.style.padding = "8px 26px";
          confirm.style.border = "none";
          confirm.style.borderRadius = "4px";
          confirm.style.fontWeight = "500";
          confirm.style.minWidth = "90px";
        }

        if (cancel) {
          cancel.style.background = "#fff";
          cancel.style.color = "#6b7280";
          cancel.style.padding = "8px 22px";
          cancel.style.border = "1px solid #d1d5db";
          cancel.style.borderRadius = "4px";
          cancel.style.fontWeight = "500";
          cancel.style.minWidth = "90px";
        }
      },
    });

    if (!result.isConfirmed) return;

    await onDelete?.();

    await Swal.fire({
      title: "Deleted!",
      html: `
        <div style="display:flex; justify-content:center; margin:16px 0;">
          <img src="${successIcon}" style="width:56px; height:56px;" />
        </div>
        <p style="font-size:14px; color:#6b7280; text-align:center;">
          Tax has been successfully removed.
        </p>
      `,
      confirmButtonText: "OK",
      buttonsStyling: false,
      didOpen: () => {
        const confirm = Swal.getConfirmButton();
        const actions = Swal.getActions();

        if (actions) {
          actions.style.display = "flex";
          actions.style.justifyContent = "center";
        }

        if (confirm) {
          confirm.style.background = "#facc15";
          confirm.style.color = "#000";
          confirm.style.padding = "8px 28px";
          confirm.style.border = "none";
          confirm.style.borderRadius = "4px";
          confirm.style.fontWeight = "500";
          confirm.style.minWidth = "100px";
        }
      },
    });

    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        className="text-xl px-2"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((s) => !s);
        }}
      >
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-50">
          <button
            onClick={() => {
              onEdit?.();
              setOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
          >
            <Pencil size={16} /> Edit
          </button>

          <button
            onClick={handleDelete}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
          >
            <Trash2 size={16} /> Move to Trash
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
