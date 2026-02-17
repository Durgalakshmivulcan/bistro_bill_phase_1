import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import Modal from "../components/ui/Modal";
import {
  getGoogleReviews,
  replyToGoogleReview,
  type GoogleReview,
} from "../services/reviewService";

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={`${
            star <= rating ? "bi-star-fill text-yellow-400" : "bi-star text-gray-300"
          } text-sm`}
        />
      ))}
    </div>
  );
};

const Reviews = () => {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [unrespondedCount, setUnrespondedCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Reply modal state
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<GoogleReview | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getGoogleReviews({ limit, offset });
      if (response.success && response.data) {
        setReviews(response.data.reviews);
        setTotalCount(response.data.totalCount);
        setAverageRating(response.data.averageRating);
        setUnrespondedCount(response.data.unrespondedCount);
      } else {
        setError(response.error?.message || "Failed to fetch reviews.");
      }
    } catch {
      setError("Failed to fetch reviews.");
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const openReplyModal = (review: GoogleReview) => {
    setSelectedReview(review);
    setReplyText(review.replyText || "");
    setReplyError(null);
    setReplyModalOpen(true);
  };

  const handleReplySubmit = async () => {
    if (!selectedReview || !replyText.trim()) return;
    setReplySubmitting(true);
    setReplyError(null);
    try {
      const response = await replyToGoogleReview(selectedReview.id, replyText.trim());
      if (response.success) {
        setReplyModalOpen(false);
        await fetchReviews();
      } else {
        setReplyError(response.error?.message || "Failed to submit reply.");
      }
    } catch {
      setReplyError("Failed to submit reply.");
    } finally {
      setReplySubmitting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <DashboardLayout>
      <div className="p-6 bg-bb-bg min-h-screen space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <i className="bi-star-fill text-2xl text-bb-primary" />
          <h1 className="text-2xl font-bold text-bb-text">Google Reviews</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-bb-card p-5">
            <p className="text-sm text-bb-textSoft">Total Reviews</p>
            <p className="text-2xl font-bold text-bb-text mt-1">{totalCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-bb-card p-5">
            <p className="text-sm text-bb-textSoft">Average Rating</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-bb-text">
                {averageRating > 0 ? averageRating.toFixed(1) : "—"}
              </p>
              {averageRating > 0 && <StarRating rating={Math.round(averageRating)} />}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-bb-card p-5">
            <p className="text-sm text-bb-textSoft">Awaiting Reply</p>
            <p className="text-2xl font-bold text-bb-primary mt-1">
              {unrespondedCount}
            </p>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-xl shadow-bb-card p-6">
          <h2 className="text-lg font-semibold text-bb-text mb-4">Reviews</h2>

          {loading ? (
            <p className="text-bb-textSoft text-sm">Loading reviews...</p>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-bb-danger text-sm">{error}</p>
              <button
                onClick={fetchReviews}
                className="mt-3 px-4 py-2 bg-bb-primary text-bb-text text-sm font-medium rounded-lg hover:bg-yellow-500 transition"
              >
                Retry
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <i className="bi-star text-5xl text-gray-300" />
              <h3 className="text-lg font-medium text-bb-text mt-4 mb-2">
                No Reviews Yet
              </h3>
              <p className="text-bb-textSoft text-sm max-w-md mx-auto">
                Google reviews will appear here once customers start reviewing your
                business.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border border-gray-100 rounded-lg p-4 hover:bg-bb-bg transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-full bg-bb-primary/20 flex items-center justify-center">
                            <span className="text-sm font-semibold text-bb-text">
                              {review.reviewerName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-bb-text">
                              {review.reviewerName}
                            </p>
                            <p className="text-xs text-bb-textSoft">
                              {new Date(review.publishedAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} />
                        {review.comment && (
                          <p className="text-sm text-bb-text mt-2">
                            {review.comment}
                          </p>
                        )}

                        {/* Existing Reply */}
                        {review.replyText && (
                          <div className="mt-3 pl-4 border-l-2 border-bb-primary/40">
                            <p className="text-xs font-medium text-bb-textSoft mb-1">
                              Your reply
                              {review.repliedAt &&
                                ` · ${new Date(review.repliedAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}`}
                            </p>
                            <p className="text-sm text-bb-text">{review.replyText}</p>
                          </div>
                        )}
                      </div>

                      {/* Reply Button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => openReplyModal(review)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                            review.replyText
                              ? "border border-gray-200 text-bb-text hover:bg-gray-50"
                              : "bg-bb-primary text-bb-text hover:bg-yellow-500"
                          }`}
                        >
                          {review.replyText ? "Edit Reply" : "Reply"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                  <p className="text-sm text-bb-textSoft">
                    Showing {offset + 1}–{Math.min(offset + limit, totalCount)} of{" "}
                    {totalCount} reviews
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                      disabled={currentPage <= 1}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setOffset(offset + limit)}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      <Modal
        open={replyModalOpen}
        onClose={() => setReplyModalOpen(false)}
        className="w-full max-w-lg"
      >
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-bb-text">
            {selectedReview?.replyText ? "Edit Reply" : "Reply to Review"}
          </h2>

          {selectedReview && (
            <div className="bg-bb-bg rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-bb-text">
                  {selectedReview.reviewerName}
                </p>
                <StarRating rating={selectedReview.rating} />
              </div>
              {selectedReview.comment && (
                <p className="text-sm text-bb-textSoft">{selectedReview.comment}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-bb-text mb-1">
              Your Reply
            </label>
            <textarea
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bb-primary focus:border-transparent resize-none"
            />
          </div>

          {replyError && (
            <p className="text-sm text-bb-danger">{replyError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setReplyModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-bb-text hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleReplySubmit}
              disabled={replySubmitting || !replyText.trim()}
              className="flex-1 px-4 py-2 bg-bb-primary text-bb-text rounded-lg text-sm font-medium hover:bg-yellow-500 transition disabled:opacity-50"
            >
              {replySubmitting ? "Submitting..." : "Submit Reply"}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Reviews;
