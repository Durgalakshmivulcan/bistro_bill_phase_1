import { useState } from "react";
import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/ui/Modal";
import { deleteBlogApi, Blog } from "../../services/blogService";
import { getBlogImage, removeBlogImage } from "../../utils/blogImageStore";

// Images
import deleteConfirmImg from "../../assets/deleteConformImg.png";
import deleteSuccessImg from "../../assets/tick.png";

interface BlogsTableProps {
  blogs: Blog[];
  onDeleted?: () => void;
}

const BlogsTable = ({ blogs, onDeleted }: BlogsTableProps) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  // ---------------- HANDLERS ----------------

  const handleDeleteClick = (id: string) => {
    setSelectedBlog(id);
    setOpenId(null);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedBlog) return;

    setDeleting(true);
    try {
      const response = await deleteBlogApi(selectedBlog);
      setDeleting(false);

      if (response.success) {
        removeBlogImage(selectedBlog);
        setShowConfirm(false);
        setShowSuccess(true);
        onDeleted?.();
      } else {
        alert(response.error?.message || "Failed to delete blog");
        setShowConfirm(false);
      }
    } catch (err: any) {
      setDeleting(false);
      alert(err.message || "Failed to delete blog");
      setShowConfirm(false);
    }
  };

  // ---------------- RENDER ----------------

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-lg border">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-yellow-400">
            <tr>
              <th className="px-4 py-3">Sl. No.</th>
              <th className="px-4 py-3">Blog Category</th>
              <th className="px-4 py-3">Blog Title</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Created Date</th>
              <th className="px-4 py-3">Publish Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {blogs.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-gray-500">
                  No blogs found. Try adjusting your filters.
                </td>
              </tr>
            ) : (
              blogs.map((blog, index) => (
              <tr
                key={blog.id}
                className="border-b odd:bg-white even:bg-[#FFF8E7]"
              >
                <td className="px-4 py-3">{index + 1}</td>

                <td className="px-4 py-3">{blog.category.name}</td>

                <td className="px-4 py-3 font-medium">{blog.title}</td>

                <td className="px-4 py-3 text-sm">
                  {blog.authorStaff
                    ? `${blog.authorStaff.firstName} ${blog.authorStaff.lastName}`
                    : <span className="text-gray-400">-</span>}
                </td>

                <td className="px-4 py-3">
                  {blog.tags && blog.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {blog.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>

                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                  <p className="line-clamp-2">{blog.excerpt || blog.content}</p>
                </td>

                <td className="px-4 py-3">
                  {getBlogImage(blog.id) || blog.featuredImage ? (
                    <img
                      src={getBlogImage(blog.id) || (blog.featuredImage as string)}
                      alt={blog.featuredImageAlt || blog.title}
                      className="w-16 h-12 object-cover rounded"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">No image</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  {new Date(blog.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>

                <td className="px-4 py-3">
                  {blog.publishDate ? (
                    <span className="text-sm">
                      {new Date(blog.publishDate).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  ) : blog.publishedAt ? (
                    <span className="text-sm text-gray-500">
                      {new Date(blog.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      blog.status === "Published"
                        ? "bg-green-100 text-green-700"
                        : blog.status === "Scheduled"
                          ? "bg-blue-100 text-blue-700"
                          : blog.status === "Draft"
                            ? "bg-gray-200 text-gray-700"
                            : "bg-red-100 text-red-600"
                    }`}
                  >
                    {blog.status}
                  </span>
                </td>

                <td className="px-4 py-3 text-center relative">
                  <button
                    onClick={() =>
                      setOpenId(openId === blog.id ? null : blog.id)
                    }
                  >
                    <MoreVertical size={18} />
                  </button>

                  {openId === blog.id && (
                    <div className="absolute right-4 top-10 w-36 bg-white border rounded-md shadow z-20">
                      <button
                        onClick={() =>
                          navigate(`/blog-management/view/${blog.id}`)
                        }
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        <Eye size={14} /> View
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/blog-management/edit/${blog.id}`)
                        }
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        <Pencil size={14} /> Edit
                      </button>

                      <button
                        onClick={() => handleDeleteClick(blog.id)}
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

      {/* ---------------- CONFIRM DELETE MODAL ---------------- */}
      {showConfirm && (
        <Modal
          open={showConfirm}
          onClose={() => setShowConfirm(false)}
          className="w-[90%] max-w-md p-6 text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Delete Blog</h2>

          <div className="flex justify-center mb-4">
            <img
              src={deleteConfirmImg}
              alt="confirm delete"
              className="w-16 h-16"
            />
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to delete this blog? This action cannot be
            undone.
          </p>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="border px-6 py-2 rounded"
              disabled={deleting}
            >
              Cancel
            </button>

            <button
              onClick={confirmDelete}
              className="bg-yellow-400 px-6 py-2 rounded font-medium"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </Modal>
      )}

      {/* ---------------- SUCCESS MODAL ---------------- */}
      {showSuccess && (
        <Modal
          open={showSuccess}
          onClose={() => setShowSuccess(false)}
          className="w-[90%] max-w-md p-6 text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Blog Deleted</h2>

          <div className="flex justify-center mb-4">
            <img src={deleteSuccessImg} alt="success" className="w-16 h-16" />
          </div>

          <p className="text-sm text-gray-600">
            The blog has been deleted successfully.
          </p>
        </Modal>
      )}
    </>
  );
};

export default BlogsTable;
