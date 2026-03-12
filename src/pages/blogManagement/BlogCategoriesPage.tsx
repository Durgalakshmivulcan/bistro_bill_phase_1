import DashboardLayout from "../../layout/DashboardLayout";
import BlogNavTabs from "../../components/blogManagement/BlogNavTabs";
import BlogCategoriesTable from "../../components/blogManagement/BlogCategoriesTable";
import { useNavigate } from "react-router-dom";
import Select from "../../components/form/Select";
import { SearchInput } from "../../components/Common";
import { getBlogCategories, BlogCategory } from "../../services/blogService";
import {
  getBusinessOwners,
  BusinessOwnerListItem,
} from "../../services/superAdminService";
import { getSelectedBoId, setSelectedBoId } from "../../services/saReportContext";
import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";

const BlogCategoriesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.userType === "SuperAdmin";

  // Data state
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedBo, setSelectedBo] = useState<string>(getSelectedBoId() || "");
  const [boList, setBoList] = useState<BusinessOwnerListItem[]>([]);
  const [boLoading, setBoLoading] = useState(false);

  useEffect(() => {
    const loadBusinessOwners = async () => {
      if (!isSuperAdmin) return;
      setBoLoading(true);
      try {
        const res = await getBusinessOwners({ limit: 100 });
        if (res.success && res.data) {
          setBoList(res.data.businessOwners);
        }
      } finally {
        setBoLoading(false);
      }
    };
    loadBusinessOwners();
  }, [isSuperAdmin]);

  const loadCategories = useCallback(async () => {
    if (isSuperAdmin && !selectedBo) {
      setCategories([]);
      setLoading(false);
      setError("Select a restaurant to load categories.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const params: { search?: string; status?: string } = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter && statusFilter !== "Filter by Status") params.status = statusFilter;
      const response = await getBlogCategories(params);
      if (response.success && response.data) {
        setCategories(response.data.categories);
      } else {
        setError(response.error?.message || "Failed to load categories");
      }
    } catch (err) {
      setError("Failed to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, isSuperAdmin, selectedBo]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
  };

  const handleBusinessOwnerChange = (boId: string) => {
    setSelectedBo(boId);
    setSelectedBoId(boId || null);
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#FFFDF5] min-h-screen space-y-6">
        <BlogNavTabs />

        {isSuperAdmin && (
          <div className="bg-white border rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Context
            </label>
            <select
              value={selectedBo}
              onChange={(e) => handleBusinessOwnerChange(e.target.value)}
              className="w-full md:w-80 border rounded-md px-3 py-2 text-sm bg-white"
              disabled={boLoading}
            >
              <option value="">-- Select a Restaurant --</option>
              {boList.map((bo) => (
                <option key={bo.id} value={bo.id}>
                  {bo.restaurantName} ({bo.ownerName})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* FILTERS */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <SearchInput
            placeholder="Search categories..."
            onSearch={setSearchQuery}
            className="w-full md:w-64"
          />

          <div className="flex flex-wrap gap-3">
            {/* STATUS FILTER USING CUSTOM SELECT */}
            <div className="w-48">
              <Select
                value={statusFilter || ""}
                onChange={setStatusFilter}
                options={[
                  {
                    label: "Filter by Status",
                    value: "",
                  },
                  {
                    label: "Active",
                    value: "active",
                  },
                  {
                    label: "Inactive",
                    value: "inactive",
                  },
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
                navigate("/blog-management/categories/create")
              }
              disabled={isSuperAdmin && !selectedBo}
              title={isSuperAdmin && !selectedBo ? "Select a restaurant first" : undefined}
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
              onClick={loadCategories}
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
          <BlogCategoriesTable categories={categories} onDeleted={loadCategories} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default BlogCategoriesPage;
