import { useNavigate } from "react-router-dom";
import { MoreVertical, Pencil, Trash2, Eye } from "lucide-react";
import { useState } from "react";
import Modal from "../../components/ui/Modal";
import { deleteBlogCategoryApi, BlogCategory } from "../../services/blogService";

// Images
import deleteConfirmImg from "../../assets/deleteConformImg.png";
import deleteSuccessImg from "../../assets/deleteSuccessImg.png";

interface BlogCategoriesTableProps {
  categories: BlogCategory[];
  onDeleted: () => void;
}

const BlogCategoriesTable = ({ categories, onDeleted }: BlogCategoriesTableProps) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleteItem, setDeleteItem] = useState<BlogCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const navigate = useNavigate();

  // ---------------- HANDLERS ----------------

  const handleDeleteClick = (item: BlogCategory) => {
    setOpenId(null);
    setDeleteItem(item);
    setDeleteError("");
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    try {
      setDeleting(true);
      setDeleteError("");
      const response = await deleteBlogCategoryApi(deleteItem.id);
      if (response.success) {
        setShowConfirm(false);
        setShowSuccess(true);
      } else {
        setDeleteError(response.error?.message || "Failed to delete category");
      }
    } catch (err) {
      setDeleteError("Failed to delete category. It may have associated blogs.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setDeleteItem(null);
    onDeleted();
  };

  // ---------------- RENDER ----------------

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-lg border">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-yellow-400">
            <tr className="text-left font-medium">
              <th className="px-4 py-3">Category Name</th>
              <th className="px-4 py-3">Blogs</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  No categories found. Try adjusting your filters.
                </td>
              </tr>
            ) : (
              categories.map((item) => (
              <tr
                key={item.id}
                className="border-t odd:bg-white even:bg-[#FFF8E7]"
              >
                <td className="px-4 py-3 font-medium">{item.name}</td>

                <td className="px-4 py-3">{item.blogsCount}</td>

                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      item.status === "Active"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>

                <td className="px-4 py-3 text-center relative">
                  <button
                    onClick={() =>
                      setOpenId(openId === item.id ? null : item.id)
                    }
                  >
                    <MoreVertical size={18} />
                  </button>

                  {openId === item.id && (
                    <div className="absolute right-4 top-8 w-36 bg-white border rounded-md shadow z-20">
                      <button
                        onClick={() =>
                          navigate(
                            `/blog-management/categories/${item.id}/view`,
                          )
                        }
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        <Eye size={14} /> View
                      </button>

                      <button
                        onClick={() =>
                          navigate(
                            `/blog-management/categories/${item.id}/edit`,
                          )
                        }
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        <Pencil size={14} /> Edit
                      </button>

                      <button
                        onClick={() => handleDeleteClick(item)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DELETE CONFIRM MODAL */}
      {showConfirm && deleteItem && (
        <Modal
          open={showConfirm}
          onClose={() => {
            setShowConfirm(false);
            setDeleteItem(null);
          }}
          className="w-[90%] max-w-md p-6 text-center z-[9999]"
        >
          <h2 className="text-2xl font-bold mb-4">Delete</h2>

          <div className="flex justify-center mb-4">
            <img src={deleteConfirmImg} alt="delete" className="w-16 h-16" />
          </div>

          <p className="text-sm text-gray-600 mb-6">
            This action cannot be undone.
            <br />
            Do you want to proceed with deleting{" "}
            <span className="font-medium">{deleteItem.name}</span>?
          </p>

          {deleteError && (
            <p className="text-red-600 text-sm mb-4">{deleteError}</p>
          )}

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setShowConfirm(false);
                setDeleteItem(null);
              }}
              className="border px-6 py-2 rounded"
              disabled={deleting}
            >
              Cancel
            </button>

            <button
              onClick={confirmDelete}
              className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Yes"}
            </button>
          </div>
        </Modal>
      )}

      {/* DELETE SUCCESS MODAL */}
      {showSuccess && deleteItem && (
        <Modal
          open={showSuccess}
          onClose={handleSuccessClose}
          className="w-[90%] max-w-md p-6 text-center z-[9999]"
        >
          <h2 className="text-2xl font-bold mb-4">Deleted!</h2>

          <div className="flex justify-center mb-4">
            <img src={deleteSuccessImg} alt="success" className="w-16 h-16" />
          </div>

          <p className="text-sm text-gray-600">
            Blog category <span className="font-medium">{deleteItem.name}</span>{" "}
            has been successfully deleted.
          </p>
        </Modal>
      )}
    </>
  );
};

export default BlogCategoriesTable;
