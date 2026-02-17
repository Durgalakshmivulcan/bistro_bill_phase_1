import StarRating from "../Common/StarRating";
import FeedbackBarChart from "../Common/BarChart";
import { FeedbackForm, FeedbackResponse } from "../../services/marketingService";

interface FeedbackSummaryProps {
  feedbackForm: FeedbackForm;
  responses: FeedbackResponse[];
}

export default function FeedbackSummary({ feedbackForm, responses }: FeedbackSummaryProps) {
  // Calculate average rating from responses
  const ratingsCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;
  let ratingCount = 0;

  responses.forEach((response) => {
    if (response.rating !== null && response.rating !== undefined) {
      const rating = Math.round(response.rating) as 1 | 2 | 3 | 4 | 5;
      if (rating >= 1 && rating <= 5) {
        ratingsCount[rating]++;
        totalRating += response.rating;
        ratingCount++;
      }
    }
  });

  const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : "0.00";

  // Find rating questions to display
  const ratingQuestions = feedbackForm.questions.filter((q) => q.type === "rating");

  // Calculate stats for each question
  const questionStats = feedbackForm.questions.map((question) => {
    const questionResponses = responses.filter(
      (r) => r.responses[question.id] !== undefined && r.responses[question.id] !== null
    );

    let stats: any = { questionId: question.id, responseCount: questionResponses.length };

    if (question.type === "rating") {
      // Calculate rating distribution
      const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let sum = 0;
      questionResponses.forEach((r) => {
        const val = Number(r.responses[question.id]);
        if (val >= 1 && val <= 5) {
          ratingDist[val as 1 | 2 | 3 | 4 | 5]++;
          sum += val;
        }
      });
      stats.distribution = ratingDist;
      stats.average = questionResponses.length > 0 ? (sum / questionResponses.length).toFixed(2) : "0.00";
    } else if (question.type === "multiple_choice" && question.options) {
      // Calculate option counts
      const optionCounts: Record<string, number> = {};
      question.options.forEach((opt) => (optionCounts[opt] = 0));

      questionResponses.forEach((r) => {
        const answer = r.responses[question.id];
        if (typeof answer === "string" && optionCounts[answer] !== undefined) {
          optionCounts[answer]++;
        }
      });
      stats.optionCounts = optionCounts;
    } else if (question.type === "checkbox" && question.options) {
      // Calculate checkbox counts (can select multiple)
      const optionCounts: Record<string, number> = {};
      question.options.forEach((opt) => (optionCounts[opt] = 0));

      questionResponses.forEach((r) => {
        const answers = r.responses[question.id];
        if (Array.isArray(answers)) {
          answers.forEach((ans) => {
            if (typeof ans === "string" && optionCounts[ans] !== undefined) {
              optionCounts[ans]++;
            }
          });
        }
      });
      stats.optionCounts = optionCounts;
    }

    return stats;
  });

  return (
    <div className="space-y-6">
      {/* Overall Average Rating (from response.rating field) */}
      {ratingCount > 0 && (
        <div className="bg-bb-bg border rounded-xl p-6 space-y-4">
          <div>
            <h3 className="text-grey font-[400]">Overall Rating</h3>
            <span className="text-sm text-yellow-500 font-medium">
              {ratingCount} Response{ratingCount !== 1 ? "s" : ""}
            </span>
          </div>

          {/* AVERAGE RATING */}
          <div className="border rounded-lg p-6 bg-[#FFF9EA] shadow-sm shadow-black/15">
            <h4 className="text-center font-medium mb-4">
              Average Rating ({averageRating})
            </h4>

            <div className="flex justify-center gap-8 text-sm text-gray-600 mb-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>

            <div className="flex justify-center">
              <StarRating value={parseFloat(averageRating)} />
            </div>
          </div>

          {/* RATING DISTRIBUTION BAR GRAPH */}
          <div className="border rounded-lg p-4 bg-[#FFFDF6]">
            <FeedbackBarChart
              labels={["1", "2", "3", "4", "5"]}
              values={[
                ratingsCount[1],
                ratingsCount[2],
                ratingsCount[3],
                ratingsCount[4],
                ratingsCount[5],
              ]}
            />
          </div>
        </div>
      )}

      {/* Individual Question Stats */}
      {feedbackForm.questions.map((question) => {
        const stats = questionStats.find((s) => s.questionId === question.id);
        if (!stats || stats.responseCount === 0) return null;

        return (
          <div key={question.id} className="bg-bb-bg border rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-grey font-[400]">{question.text}</h3>
              <span className="text-sm text-yellow-500 font-medium">
                {stats.responseCount} Response{stats.responseCount !== 1 ? "s" : ""}
              </span>
            </div>

            {question.type === "rating" && stats.distribution && (
              <>
                <div className="border rounded-lg p-6 bg-[#FFF9EA] shadow-sm shadow-black/15">
                  <h4 className="text-center font-medium mb-4">
                    Average Rating ({stats.average})
                  </h4>
                  <div className="flex justify-center gap-8 text-sm text-gray-600 mb-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n}>{n}</span>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <StarRating value={parseFloat(stats.average)} />
                  </div>
                </div>
                <div className="border rounded-lg p-4 bg-[#FFFDF6]">
                  <FeedbackBarChart
                    labels={["1", "2", "3", "4", "5"]}
                    values={[
                      stats.distribution[1],
                      stats.distribution[2],
                      stats.distribution[3],
                      stats.distribution[4],
                      stats.distribution[5],
                    ]}
                  />
                </div>
              </>
            )}

            {(question.type === "multiple_choice" || question.type === "checkbox") &&
              stats.optionCounts &&
              question.options && (
                <div className="border rounded-lg p-4 bg-[#FFFDF6]">
                  <FeedbackBarChart
                    labels={question.options}
                    values={question.options.map((opt) => stats.optionCounts[opt] || 0)}
                  />
                </div>
              )}

            {question.type === "text" && (
              <div className="text-sm text-gray-600">
                <p>Text responses are available in the "Individual" tab.</p>
              </div>
            )}
          </div>
        );
      })}

      {responses.length === 0 && (
        <div className="bg-bb-bg border rounded-xl p-6 text-center text-gray-500">
          No responses available for this feedback form yet.
        </div>
      )}
    </div>
  );
}
