import DashboardLayout from "../../layout/DashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import { useRef, useState, useEffect, useMemo } from "react";
import Modal from "../../components/ui/Modal";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

import Input from "../../components/form/Input";
import Select from "../../components/form/Select";

// Images
import successImg from "../../assets/tick.png";
import publishConfirmImg from "../../assets/publishConfirmImg.png";
import unpublishConfirmImg from "../../assets/publishConfirmImg.png";
import draftSuccessImg from "../../assets/saveDraft.png";

// API
import {
  getBlog,
  createBlogApi,
  updateBlogApi,
  getBlogCategories,
  getBlogTags,
  BlogCategory,
  BlogTag,
} from "../../services/blogService";
import { getStaff, Staff } from "../../services/staffService";

type SuccessType = "create" | "edit" | "publish" | "draft" | "unpublish" | "schedule" | null;

const BLOG_LIST_ROUTE = "/blog-management";

/** Strip HTML tags to get plain text for excerpts and validation */
function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.trim() || "";
}

export default function BlogFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // MODES
  const isEditMode = Boolean(id);
  const isViewMode = window.location.pathname.includes("/view");

  // FORM STATE
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Draft");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [publishDate, setPublishDate] = useState("");

  // DATA STATE
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [tagsList, setTagsList] = useState<BlogTag[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // UI STATE
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<SuccessType>(null);
  const [error, setError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  // Rich text editor configuration
  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ],
    }),
    []
  );

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "link",
    "image",
  ];

  // Fetch categories, staff, tags and blog data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);

      try {
        // Fetch categories, staff, and tags in parallel
        const [catResponse, staffResponse, tagsResponse] = await Promise.all([
          getBlogCategories({ status: "active" }),
          getStaff({ status: "active" }),
          getBlogTags({ status: "active" }),
        ]);

        if (catResponse.success && catResponse.data) {
          setCategories(catResponse.data.categories);
        }
        if (staffResponse.success && staffResponse.data) {
          setStaffList(staffResponse.data.staff);
        }
        if (tagsResponse.success && tagsResponse.data) {
          setTagsList(tagsResponse.data.tags);
        }

        // Fetch blog data in edit/view mode
        if (id) {
          const blogResponse = await getBlog(id);
          if (blogResponse.success && blogResponse.data) {
            const blog = blogResponse.data.blog;
            setTitle(blog.title);
            setCategoryId(blog.category.id);
            setAuthorId(blog.authorId || "");
            setSelectedTagIds(blog.tags.map((t) => t.id));
            setDescription(blog.content);
            setStatus(blog.status);
            setImagePreview(blog.featuredImage || null);
            setImageAlt(blog.featuredImageAlt || "");
            if (blog.publishDate) {
              // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
              const dt = new Date(blog.publishDate);
              const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
              setPublishDate(local);
            }
          } else {
            setError("Blog not found");
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      }

      setLoadingData(false);
    };

    fetchData();
  }, [id]);

  // ---------------- HANDLERS ----------------

  const validateForm = () => {
    if (!title || !categoryId || !stripHtml(description)) {
      setError("Please fill all required fields.");
      return false;
    }
    setError("");
    return true;
  };

  const handleCreateOrUpdate = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setError("");

    const plainText = stripHtml(description);

    // Validate scheduled date
    if (status === "Scheduled" && !publishDate) {
      setError("Please select a scheduled publish date.");
      return;
    }
    if (status === "Scheduled" && publishDate) {
      const scheduledTime = new Date(publishDate).getTime();
      if (scheduledTime <= Date.now()) {
        setError("Scheduled publish date must be in the future.");
        return;
      }
    }

    const data: any = {
      title,
      categoryId,
      content: description,
      excerpt: plainText.substring(0, 200),
      status,
      authorId: authorId || undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      featuredImageAlt: imageAlt || undefined,
      publishDate: status === "Scheduled" && publishDate
        ? new Date(publishDate).toISOString()
        : status === "Scheduled" ? undefined : null,
    };

    if (imageFile) {
      data.featuredImageFile = imageFile;
    } else if (imagePreview) {
      data.featuredImage = imagePreview;
    }

    try {
      let response;
      if (isEditMode && id) {
        response = await updateBlogApi(id, data);
      } else {
        response = await createBlogApi(data);
      }

      setSubmitting(false);

      if (response.success) {
        setSuccessType(
          status === "Scheduled" ? "schedule" : isEditMode ? "edit" : "create"
        );
        setShowSuccess(true);
      } else {
        setError(response.error?.message || "Failed to save blog");
      }
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || "Failed to save blog");
    }
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setError("");

    const plainText = stripHtml(description);
    const data: any = {
      title,
      categoryId,
      content: description,
      excerpt: plainText.substring(0, 200),
      status: "Draft",
      authorId: authorId || undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      featuredImageAlt: imageAlt || undefined,
    };

    if (imageFile) {
      data.featuredImageFile = imageFile;
    } else if (imagePreview) {
      data.featuredImage = imagePreview;
    }

    try {
      let response;
      if (isEditMode && id) {
        response = await updateBlogApi(id, data);
      } else {
        response = await createBlogApi(data);
      }

      setSubmitting(false);

      if (response.success) {
        setStatus("Draft");
        setSuccessType("draft");
        setShowSuccess(true);
      } else {
        setError(response.error?.message || "Failed to save draft");
      }
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || "Failed to save draft");
    }
  };

  const handlePublishToggle = () => {
    setShowConfirm(true);
  };

  const confirmPublishToggle = async () => {
    if (!id) return;

    const newStatus = status === "Published" ? "Draft" : "Published";

    setSubmitting(true);
    try {
      const response = await updateBlogApi(id, { status: newStatus });
      setSubmitting(false);

      if (response.success) {
        setStatus(newStatus);
        setShowConfirm(false);
        setSuccessType(newStatus === "Published" ? "publish" : "unpublish");
        setShowSuccess(true);
      } else {
        setError(response.error?.message || "Failed to update status");
        setShowConfirm(false);
      }
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || "Failed to update status");
      setShowConfirm(false);
    }
  };

  // ---------------- SUCCESS HELPERS ----------------

  const getSuccessTitle = () => {
    switch (successType) {
      case "create":
        return "Blog Created";
      case "edit":
        return "Changes Saved";
      case "publish":
        return "Blog Published";
      case "draft":
        return "Saved as Draft";
      case "unpublish":
        return "Blog Unpublished";
      case "schedule":
        return "Blog Scheduled";
      default:
        return "Success";
    }
  };

  const getSuccessMessage = () => {
    switch (successType) {
      case "create":
        return "Your blog has been created successfully.";
      case "edit":
        return "Your changes have been saved successfully.";
      case "publish":
        return "Your blog is now live.";
      case "draft":
        return "Your blog has been saved as draft.";
      case "unpublish":
        return "Your blog has been unpublished.";
      case "schedule":
        return publishDate
          ? `Your blog is scheduled to publish on ${new Date(publishDate).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}.`
          : "Your blog has been scheduled for publication.";
      default:
        return "";
    }
  };

  // ---------------- RENDER ----------------

  if (loadingData) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-[#FFFDF5] min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#FFFDF5] min-h-screen">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold">
              {isViewMode
                ? "View Blog"
                : isEditMode
                  ? "Edit Blog"
                  : "Create New Blog"}
            </h1>
          </div>

          {/* FORM GRID */}
          <div className="bg-white rounded-xl border p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT — IMAGE */}
            <div className="space-y-3">
              <label className="font-medium text-sm">
                Featured Image
              </label>

              <div className="border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center text-center p-4 relative">
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt={imageAlt || "Blog featured image"}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {!isViewMode && (
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        &times;
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isViewMode}
                      onClick={() => fileRef.current?.click()}
                      className="bg-yellow-400 px-6 py-2 rounded font-medium"
                    >
                      Upload Image
                    </button>

                    <p className="text-xs text-gray-500 mt-4 max-w-xs">
                      Recommended size 400x260 to 600x300 pixels. JPG or PNG
                      only. Max 5MB.
                    </p>
                  </>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/png, image/jpeg"
                className="hidden"
                disabled={isViewMode}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      setError("Image must be less than 5MB");
                      return;
                    }
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
              />

              <Input
                label="Image Alt Text"
                placeholder="Describe the image for accessibility"
                disabled={isViewMode}
                value={imageAlt}
                onChange={(value) => setImageAlt(value)}
              />
            </div>

            {/* RIGHT — FORM */}
            <div className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Input
                label="Blog Title"
                required
                disabled={isViewMode}
                value={title}
                onChange={(value) => setTitle(value)}
              />

              <Select
                label="Category Name"
                required
                disabled={isViewMode}
                value={categoryId}
                options={[
                  {
                    label: categories.length === 0 ? "No categories available" : "Select Blog Category",
                    value: "",
                  },
                  ...categories.map((cat) => ({
                    label: cat.name,
                    value: cat.id,
                  })),
                ]}
                onChange={(value) => setCategoryId(value)}
              />

              <Select
                label="Author"
                disabled={isViewMode}
                value={authorId}
                options={[
                  {
                    label: staffList.length === 0 ? "No staff available" : "Select Author",
                    value: "",
                  },
                  ...staffList.map((s) => ({
                    label: `${s.firstName} ${s.lastName}`,
                    value: s.id,
                  })),
                ]}
                onChange={(value) => setAuthorId(value)}
              />

              {/* Tags Multi-Select */}
              <div>
                <label className="text-sm font-bold">Tags</label>
                <div className="mt-1 border border-bb-coloredborder rounded-md bg-bb-bg px-3 py-2 min-h-[40px]">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedTagIds.map((tagId) => {
                      const tag = tagsList.find((t) => t.id === tagId);
                      return tag ? (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs"
                        >
                          {tag.name}
                          {!isViewMode && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedTagIds((prev) =>
                                  prev.filter((id) => id !== tag.id)
                                )
                              }
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              &times;
                            </button>
                          )}
                        </span>
                      ) : null;
                    })}
                  </div>
                  {!isViewMode && (
                    <select
                      className="w-full bg-transparent text-sm outline-none"
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && !selectedTagIds.includes(val)) {
                          setSelectedTagIds((prev) => [...prev, val]);
                        }
                      }}
                    >
                      <option value="">
                        {tagsList.length === 0
                          ? "No tags available"
                          : "Add a tag..."}
                      </option>
                      {tagsList
                        .filter((t) => !selectedTagIds.includes(t.id))
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Content <span className="text-red-500">*</span>
                </label>

                {isViewMode ? (
                  <div
                    className="w-full border rounded-md px-4 py-2 text-sm min-h-[200px] prose prose-sm max-w-none bg-gray-50"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                ) : (
                  <ReactQuill
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Write your blog content here..."
                    className="bg-white rounded-md [&_.ql-editor]:min-h-[200px]"
                  />
                )}
              </div>

              <Select
                label="Status"
                disabled={isViewMode}
                value={status}
                options={[
                  {
                    label: "Published",
                    value: "Published",
                  },
                  { label: "Draft", value: "Draft" },
                  { label: "Scheduled", value: "Scheduled" },
                ]}
                onChange={(value) => {
                  setStatus(value);
                  if (value !== "Scheduled") {
                    setPublishDate("");
                  }
                }}
              />

              {status === "Scheduled" && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Scheduled Publish Date <span className="text-red-500">*</span>
                  </label>
                  {isViewMode ? (
                    <p className="text-sm text-gray-700 bg-gray-50 border rounded-md px-4 py-2">
                      {publishDate
                        ? new Date(publishDate).toLocaleString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Not set"}
                    </p>
                  ) : (
                    <input
                      type="datetime-local"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16)}
                      className="w-full border border-bb-coloredborder rounded-md bg-bb-bg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  )}
                  {publishDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      This blog will be automatically published on{" "}
                      {new Date(publishDate).toLocaleString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col md:flex-row justify-end gap-4">
            <button
              onClick={() => navigate(BLOG_LIST_ROUTE)}
              className="border px-6 py-2 rounded"
            >
              Cancel
            </button>

            {!isViewMode && !isEditMode && (
              <button
                onClick={handleSaveDraft}
                className="bg-black text-white px-6 py-2 rounded"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save as Draft"}
              </button>
            )}

            {!isViewMode && (
              <button
                onClick={handleCreateOrUpdate}
                className="bg-yellow-400 px-6 py-2 rounded font-medium"
                disabled={submitting}
              >
                {submitting ? "Saving..." : isEditMode ? "Save Changes" : "Publish"}
              </button>
            )}
             {(isEditMode || isViewMode) && (
              <button
                onClick={handlePublishToggle}
                className={`px-6 py-2 rounded font-medium ${
                  status === "Published"
                    ? "bg-black text-white"
                    : "bg-black text-white"
                }`}
                disabled={submitting}
              >
                {status === "Published" ? "Unpublish" : "Publish"}
              </button>
            )}
          </div>
        </div>

        {/* CONFIRM MODAL */}
        {showConfirm && (
          <Modal
            open={showConfirm}
            onClose={() => setShowConfirm(false)}
            className="w-[90%] max-w-md p-6 text-center z-[9999]"
          >
            <h2 className="text-2xl font-bold mb-4">
              {status === "Published" ? "Unpublish Blog" : "Publish Blog"}
            </h2>

            <div className="flex justify-center mb-4">
              <img
                src={
                  status === "Published"
                    ? unpublishConfirmImg
                    : publishConfirmImg
                }
                className="w-16 h-16"
              />
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to{" "}
              {status === "Published" ? "unpublish" : "publish"} this blog?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="border px-6 py-2 rounded"
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                onClick={confirmPublishToggle}
                className="bg-yellow-400 px-6 py-2 rounded font-medium"
                disabled={submitting}
              >
                {submitting ? "Processing..." : "Yes"}
              </button>
            </div>
          </Modal>
        )}

        {/* SUCCESS MODAL */}
        {showSuccess && successType && (
          <Modal
            open={showSuccess}
            onClose={() => {
              setShowSuccess(false);
              navigate(BLOG_LIST_ROUTE);
            }}
            className="w-[90%] max-w-md p-8 text-center z-[9999]"
          >
            <h2 className="text-2xl font-bold mb-4">
              {successType === "draft" ? "Draft Saved" : getSuccessTitle()}
            </h2>

            <div className="flex justify-center mb-4">
              <img
                src={successType === "draft" ? draftSuccessImg : successImg}
                alt="success"
                className="w-20 h-20"
              />
            </div>

            <p className="text-sm text-gray-600">
              {successType === "draft"
                ? "Blog saved successfully!"
                : getSuccessMessage()}
            </p>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
