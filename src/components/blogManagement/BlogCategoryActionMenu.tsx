import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";

const BlogCategoryActionMenu = ({ id }: { id: number }) => {
  const navigate = useNavigate();

  return (
    <div className="absolute right-0 top-6 bg-white border rounded-md shadow-md w-32">
      <button
        onClick={() =>
          navigate(`/blog-management/categories/${id}/edit`)
        }
        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
      >
        <Pencil size={16} /> Edit
      </button>

      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
        <Trash2 size={16} /> Delete
      </button>
    </div>
  );
};

export default BlogCategoryActionMenu;
