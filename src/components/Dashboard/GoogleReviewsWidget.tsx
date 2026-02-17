import { useEffect, useState } from 'react';
import {
  getGoogleReviews,
  replyToGoogleReview,
  type GoogleReview,
  type GoogleReviewsResponse,
} from '../../services/reviewService';

const GoogleReviewsWidget = () => {
  const [data, setData] = useState<GoogleReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getGoogleReviews({ limit: 5 });
        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError(response.error?.message || 'Failed to load reviews');
        }
      } catch (err) {
        setError('An error occurred while loading reviews');
        console.error('Google Reviews error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      setSubmittingReply(true);
      const response = await replyToGoogleReview(reviewId, replyText.trim());
      if (response.success) {
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            reviews: prev.reviews.map(r =>
              r.id === reviewId
                ? { ...r, replyText: replyText.trim(), repliedAt: new Date().toISOString() }
                : r
            ),
            unrespondedCount: Math.max(0, prev.unrespondedCount - 1),
          };
        });
        setReplyingId(null);
        setReplyText('');
      }
    } catch (err) {
      console.error('Failed to reply to review:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`text-sm ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            &#9733;
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-bb-card p-6">
        <h3 className="text-lg font-semibold text-bb-text mb-4">Google Reviews</h3>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <div className="h-8 w-8 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-bb-card p-6">
        <h3 className="text-lg font-semibold text-bb-text mb-4">Google Reviews</h3>
        <p className="text-bb-danger text-sm">{error}</p>
      </div>
    );
  }

  if (!data || data.reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-bb-card p-6">
        <h3 className="text-lg font-semibold text-bb-text mb-4">Google Reviews</h3>
        <p className="text-bb-textSoft text-sm">No Google reviews available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-bb-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-bb-text">Google Reviews</h3>
          {data.unrespondedCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              {data.unrespondedCount} unresponded
            </span>
          )}
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-2 bg-yellow-50 rounded-lg">
          <div className="text-lg font-bold text-yellow-700">
            {data.averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-1">
            {renderStars(Math.round(data.averageRating))}
          </div>
          <div className="text-xs text-yellow-600 mt-0.5">Avg Rating</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-700">{data.totalCount}</div>
          <div className="text-xs text-blue-600">Total Reviews</div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {data.reviews.map((review: GoogleReview) => {
          const isUnresponded = !review.replyText;

          return (
            <div
              key={review.id}
              className={`p-3 rounded-lg border ${
                isUnresponded
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-bb-text truncate">
                      {review.reviewerName}
                    </span>
                    {renderStars(review.rating)}
                    <span className="text-xs text-bb-textSoft">{formatDate(review.publishedAt)}</span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-bb-textSoft line-clamp-2">{review.comment}</p>
                  )}
                  {review.replyText && (
                    <div className="mt-2 pl-3 border-l-2 border-bb-primary">
                      <p className="text-xs text-bb-textSoft italic">{review.replyText}</p>
                    </div>
                  )}
                </div>
                {isUnresponded && replyingId !== review.id && (
                  <button
                    onClick={() => {
                      setReplyingId(review.id);
                      setReplyText('');
                    }}
                    className="px-3 py-1 text-xs font-medium text-bb-textSoft bg-white border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap flex-shrink-0"
                  >
                    Reply
                  </button>
                )}
              </div>

              {/* Reply Input */}
              {replyingId === review.id && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-bb-primary"
                  />
                  <button
                    onClick={() => handleReply(review.id)}
                    disabled={submittingReply || !replyText.trim()}
                    className="px-3 py-1 text-xs font-medium text-white bg-bb-primary rounded hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReply ? 'Sending...' : 'Send'}
                  </button>
                  <button
                    onClick={() => {
                      setReplyingId(null);
                      setReplyText('');
                    }}
                    className="px-2 py-1 text-xs text-bb-textSoft hover:text-bb-text"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-bb-textSoft">
        <span>Showing {data.reviews.length} of {data.totalCount} reviews</span>
        <a href="/marketing/feedback" className="text-bb-primary hover:underline font-medium">
          View All Reviews
        </a>
      </div>
    </div>
  );
};

export default GoogleReviewsWidget;
