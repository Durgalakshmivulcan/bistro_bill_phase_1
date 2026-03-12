import { useState, useEffect } from "react";
import { Search, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getFeedbackForms, FeedbackForm } from "../../services/marketingService";
import LoadingSpinner from "../Common/LoadingSpinner";
import Pagination from "../Common/Pagination";

export default function FeedbackResponsesList() {
  const navigate = useNavigate();
  const [feedbackForms, setFeedbackForms] = useState<FeedbackForm[]>([]);
  const [filteredForms, setFilteredForms] = useState<FeedbackForm[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchFeedbackForms();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredForms(feedbackForms);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredForms(
        feedbackForms.filter(
          (form) =>
            form.title.toLowerCase().includes(query) ||
            form.description?.toLowerCase().includes(query)
        )
      );
    }
    setCurrentPage(1);
  }, [searchQuery, feedbackForms]);

  const totalItems = filteredForms.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedForms = filteredForms.slice(startIndex, startIndex + itemsPerPage);

  const fetchFeedbackForms = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getFeedbackForms();
      if (response.success && response.data) {
        setFeedbackForms(response.data);
        setFilteredForms(response.data);
      } else {
        setError(response.message || "Failed to load feedback forms");
      }
    } catch (err) {
      console.error("Error fetching feedback forms:", err);
      setError("An error occurred while loading feedback forms");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-bb-bg min-h-screen p-6">
        <LoadingSpinner message="Loading feedback forms..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-bb-bg min-h-screen p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium mb-2">Error</p>
          <p>{error}</p>
          <button
            onClick={fetchFeedbackForms}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bb-bg min-h-screen p-6 space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Feedback Responses</h1>

        <div className="relative w-64">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            placeholder="Search here..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border rounded-md px-3 pr-10 py-2 text-sm"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-yellow-400">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Total Responses</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedForms.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  {searchQuery
                    ? "No feedback forms found matching your search"
                    : "No feedback forms available"}
                </td>
              </tr>
            ) : (
              paginatedForms.map((item, i) => (
                <tr
                  key={item.id}
                  className={i % 2 === 0 ? "bg-white" : "bg-[#FFF9ED]"}
                >
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xl">
                    {item.description || "—"}
                  </td>
                  <td className="px-4 py-3">{item.responseCount}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        navigate(`/marketing/feedback_responses/${item.id}`)
                      }
                      className="p-2 rounded hover:bg-gray-100"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </div>
  );
}
