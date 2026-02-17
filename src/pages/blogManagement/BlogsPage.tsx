import DashboardLayout from "../../layout/DashboardLayout";
import BlogNavTabs from "../../components/blogManagement/BlogNavTabs";
import BlogsTable from "../../components/blogManagement/BlogsTable";
import { useNavigate } from "react-router-dom";
import Select from "../../components/form/Select";
import { SearchInput } from "../../components/Common";
import { getBlogs, getBlogTags, Blog, BlogTag } from "../../services/blogService";
import { getStaff, Staff } from "../../services/staffService";
import { useState, useEffect, useCallback } from "react";

const BlogsPage = () => {
  const navigate = useNavigate();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  // Data state
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown data for filters
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [tagsList, setTagsList] = useState<BlogTag[]>([]);

  // Load staff and tags for filter dropdowns
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [staffRes, tagsRes] = await Promise.all([
          getStaff({ status: "active" }),
          getBlogTags({ status: "active" }),
        ]);
        if (staffRes.success && staffRes.data) {
          setStaffList(staffRes.data.staff);
        }
        if (tagsRes.success && tagsRes.data) {
          setTagsList(tagsRes.data.tags);
        }
      } catch (err) {
        // Non-critical — filters just won't show options
      }
    };
    loadFilterData();
  }, []);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params: { status?: string; search?: string; sort?: string; authorId?: string; tagId?: string } = {};
    if (statusFilter && statusFilter !== "Filter by Status") {
      params.status = statusFilter;
    }
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    if (dateFilter === "Newest") {
      params.sort = "newest";
    } else if (dateFilter === "Oldest") {
      params.sort = "oldest";
    }
    if (authorFilter && authorFilter !== "Filter by Author") {
      params.authorId = authorFilter;
    }
    if (tagFilter && tagFilter !== "Filter by Tag") {
      params.tagId = tagFilter;
    }

    try {
      const response = await getBlogs(params);

      if (response.success && response.data) {
        setBlogs(response.data.blogs);
      } else {
        setError(response.error?.message || "Failed to load blogs");
        setBlogs([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load blogs");
      setBlogs([]);
    }
    setLoading(false);
  }, [searchQuery, statusFilter, dateFilter, authorFilter, tagFilter]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setDateFilter("");
    setStatusFilter("");
    setAuthorFilter("");
    setTagFilter("");
  };

  const handleBlogDeleted = () => {
    fetchBlogs();
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#FFFDF5] min-h-screen space-y-6">
        <BlogNavTabs />

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <SearchInput
            placeholder="Search blogs..."
            onSearch={setSearchQuery}
            className="w-full lg:w-64"
          />

          <div className="flex gap-3 flex-wrap">
            {/* CREATED DATE FILTER */}
            <div className="w-56">
              <Select
                value={dateFilter || "Filter by Created Date"}
                onChange={setDateFilter}
                options={[
                  {
                    label: "Filter by Created Date",
                    value: "",
                  },
                  {
                    label: "Newest First",
                    value: "Newest",
                  },
                  {
                    label: "Oldest First",
                    value: "Oldest",
                  },
                ]}
              />
            </div>

            {/* STATUS FILTER */}
            <div className="w-48">
              <Select
                value={statusFilter || "Filter by Status"}
                onChange={setStatusFilter}
                options={[
                  {
                    label: "Filter by Status",
                    value: "",
                  },
                  {
                    label: "Published",
                    value: "Published",
                  },
                  {
                    label: "Draft",
                    value: "Draft",
                  },
                  {
                    label: "Scheduled",
                    value: "Scheduled",
                  },
                ]}
              />
            </div>

            {/* AUTHOR FILTER */}
            <div className="w-48">
              <Select
                value={authorFilter || "Filter by Author"}
                onChange={setAuthorFilter}
                options={[
                  {
                    label: "Filter by Author",
                    value: "",
                  },
                  ...staffList.map((s) => ({
                    label: `${s.firstName} ${s.lastName}`,
                    value: s.id,
                  })),
                ]}
              />
            </div>

            {/* TAG FILTER */}
            <div className="w-48">
              <Select
                value={tagFilter || "Filter by Tag"}
                onChange={setTagFilter}
                options={[
                  {
                    label: "Filter by Tag",
                    value: "",
                  },
                  ...tagsList.map((t) => ({
                    label: t.name,
                    value: t.id,
                  })),
                ]}
              />
            </div>

            <button
              onClick={handleClearFilters}
              className="bg-yellow-400 px-4 py-2 rounded-md"
            >
              Clear
            </button>

            <button
              onClick={() =>
                navigate("/blog-management/create")
              }
              className="bg-black text-white px-4 py-2 rounded-md"
            >
              Add New
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
            <span className="ml-3 text-gray-600">Loading blogs...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Blog Table */}
        {!loading && !error && (
          <BlogsTable blogs={blogs} onDeleted={handleBlogDeleted} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default BlogsPage;
