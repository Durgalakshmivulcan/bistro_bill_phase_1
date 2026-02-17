import { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AllergyActionMenuProps {
  id: number;
}

const AllergyActionMenu = ({ id }: AllergyActionMenuProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative inline-block text-right">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open actions"
        className="p-1"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-32 bg-white border rounded-md shadow z-30">
          <button
            onClick={() => {
              setOpen(false);
              navigate(`/master-data/allergies/edit/${id}`);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
          >
            <Pencil size={14} />
            Edit
          </button>

          <button
            onClick={() => {
              setOpen(false);
              // delete logic later
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default AllergyActionMenu;
