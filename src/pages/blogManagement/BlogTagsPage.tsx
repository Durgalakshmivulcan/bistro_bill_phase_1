import DashboardLayout from "../../layout/DashboardLayout";
import BlogNavTabs from "../../components/blogManagement/BlogNavTabs";
import BlogTagsTable from "../../components/blogManagement/BlogTagsTable";
import { useNavigate } from "react-router-dom";
import Select from "../../components/form/Select";
import { SearchInput } from "../../components/Common";
import { getBlogTags, BlogTag } from "../../services/blogService";
import { useState, useEffect, useCallback } from "react";

const BlogTagsPage = () => {
  const navigate = useNavigate();

  // Data state
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params: { search?: string; status?: string } = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter && statusFilter !== "Filter by Status") params.status = statusFilter;
      const response = await getBlogTags(params);
      if (response.success && response.data) {
        setTags(response.data.tags);
      } else {
        setError(response.error?.message || "Failed to load tags");
      }
    } catch (err) {
      setError("Failed to load tags. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#FFFDF5] min-h-screen space-y-6">
        <BlogNavTabs />

        {/* FILTERS */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <SearchInput
            placeholder="Search tags..."
            onSearch={setSearchQuery}
            className="w-full md:w-64"
          />

          <div className="flex flex-wrap gap-3">
            <div className="w-48">
              <Select
                value={statusFilter || "Filter by Status"}
                onChange={setStatusFilter}
                options={[
                  { label: "Filter by Status", value: "" },
                  { label: "Active", value: "Active" },
                  { label: "Inactive", value: "Inactive" },
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
              onClick={() => navigate("/blog-management/tags/create")}
              className="bg-black text-white px-4 py-2 rounded-md"
            >
              Add New
            </button>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadTags}
              className="text-red-700 underline text-sm ml-4"
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bb-primary"></div>
          </div>
        ) : (
          <BlogTagsTable tags={tags} onDeleted={loadTags} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default BlogTagsPage;
