import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import { getBlogRevisions, restoreBlogRevision, BlogRevision } from "../../services/blogService";

const EditBlogPage = () => {
  const { id } = useParams<{ id: string }>();
  const [showHistory, setShowHistory] = useState(false);
  const [revisions, setRevisions] = useState<BlogRevision[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [revisionError, setRevisionError] = useState<string | null>(null);

  const loadRevisions = useCallback(async () => {
    if (!id) return;
    setLoadingRevisions(true);
    setRevisionError(null);
    try {
      const response = await getBlogRevisions(id);
      if (response.success && response.data) {
        setRevisions(response.data.revisions);
      } else {
        setRevisionError(response.error?.message || "Failed to load revisions");
      }
    } catch {
      setRevisionError("Failed to load revisions");
    } finally {
      setLoadingRevisions(false);
    }
  }, [id]);

  const handleViewHistory = () => {
    setShowHistory(true);
    loadRevisions();
  };

  const handleRestore = async (revisionId: string) => {
    if (!id) return;
    setRestoringId(revisionId);
    try {
      const response = await restoreBlogRevision(id, revisionId);
      if (response.success) {
        setShowHistory(false);
        window.location.reload();
      } else {
        setRevisionError(response.error?.message || "Failed to restore revision");
      }
    } catch {
      setRevisionError("Failed to restore revision");
    } finally {
      setRestoringId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#FFFDF5] min-h-screen">
        <div className="max-w-4xl space-y-6">

          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold">
              Edit Blog
            </h1>
            <button
              onClick={handleViewHistory}
              className="border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View History
            </button>
          </div>

          <div className="space-y-4">
            <input
              defaultValue="Top POS Industry Trends"
              className="w-full border rounded-md px-4 py-2"
            />

            <select className="w-full border rounded-md px-4 py-2">
              <option>Industry Trends</option>
              <option>POS Integration</option>
            </select>

            <textarea
              defaultValue="Stay ahead of the curve with the latest POS trends..."
              rows={5}
              className="w-full border rounded-md px-4 py-2"
            />

            <input type="file" />

            <select className="w-full border rounded-md px-4 py-2">
              <option>Published</option>
              <option>Draft</option>
              <option>Inactive</option>
            </select>
          </div>

          <div className="flex justify-between items-center">
            <button className="bg-black text-white px-6 py-2 rounded-md">
              Deactivate
            </button>

            <div className="flex gap-4">
              <button className="border px-6 py-2 rounded-md">
                Cancel
              </button>
              <button className="bg-yellow-400 px-6 py-2 rounded-md">
                Update
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Revision History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-semibold">Revision History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {loadingRevisions && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse border rounded-lg p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              )}

              {revisionError && (
                <div className="text-center py-8">
                  <p className="text-red-500 text-sm">{revisionError}</p>
                  <button
                    onClick={loadRevisions}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!loadingRevisions && !revisionError && revisions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No revision history available yet.</p>
                  <p className="text-gray-400 text-sm mt-1">Revisions are created each time the blog is updated.</p>
                </div>
              )}

              {!loadingRevisions && revisions.length > 0 && (
                <div className="space-y-3">
                  {revisions.map((revision, index) => (
                    <div key={revision.id} className="border rounded-lg p-4 hover:border-gray-400 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{revision.title}</span>
                            {index === 0 && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Latest</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>{formatDate(revision.createdAt)}</span>
                            <span>by {revision.authorName}</span>
                          </div>
                          {revision.excerpt && (
                            <p className="text-xs text-gray-400 mt-1 truncate">{revision.excerpt}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRestore(revision.id)}
                          disabled={restoringId === revision.id}
                          className="ml-4 text-sm border border-gray-300 px-3 py-1 rounded hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                        >
                          {restoringId === revision.id ? "Restoring..." : "Restore"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t p-4 text-xs text-gray-400 text-center">
              Showing up to 20 most recent revisions
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EditBlogPage;
