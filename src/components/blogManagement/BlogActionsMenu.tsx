import { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  blogId: number;
}

const BlogActionsMenu = ({ blogId }: Props) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}>
        <MoreVertical size={18} />
      </button>

      {open && (
        <div className="absolute right-6 top-8 w-32 bg-white border rounded-md shadow z-20">
          <button
            onClick={() =>
              navigate(`/blog-management/edit/${blogId}`)
            }
            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
          >
            <Pencil size={14} /> Edit
          </button>

          <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default BlogActionsMenu;
