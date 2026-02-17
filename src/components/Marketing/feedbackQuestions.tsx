import StarRating from "../Common/StarRating";
import { useState, useMemo } from "react";
import { FeedbackForm, FeedbackResponse } from "../../services/marketingService";

interface FeedbackQuestionsProps {
  feedbackForm: FeedbackForm;
  responses: FeedbackResponse[];
}

export default function FeedbackQuestions({ feedbackForm, responses }: FeedbackQuestionsProps) {
  const [index, setIndex] = useState(0);

  // Calculate stats for each question
  const questionStats = useMemo(() => {
    return feedbackForm.questions.map((question) => {
      const questionResponses = responses.filter(
        (r) => r.responses[question.id] !== undefined && r.responses[question.id] !== null
      );

      let stats: any = {
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        responseCount: questionResponses.length,
      };

      if (question.type === "rating") {
        // Calculate rating distribution
        const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        questionResponses.forEach((r) => {
          const val = Number(r.responses[question.id]);
          if (val >= 1 && val <= 5) {
            ratingDist[val as 1 | 2 | 3 | 4 | 5]++;
          }
        });
        stats.distribution = ratingDist;
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
        stats.options = question.options;
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
        stats.options = question.options;
      } else if (question.type === "text") {
        // Collect all text responses
        stats.textResponses = questionResponses
          .map((r) => r.responses[question.id])
          .filter((text) => typeof text === "string" && text.trim() !== "");
      }

      return stats;
    });
  }, [feedbackForm.questions, responses]);

  if (feedbackForm.questions.length === 0) {
    return (
      <div className="bg-bb-bg border rounded-xl p-6 text-center text-gray-500">
        No questions in this feedback form.
      </div>
    );
  }

  const question = feedbackForm.questions[index];
  const stats = questionStats[index];

  return (
    <div className="space-y-4">
      {/* TOP CONTROLS */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* QUESTION SELECT */}
        <select
          className="border rounded px-3 py-1 text-sm bg-bb-bg min-w-[300px]"
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
        >
          {feedbackForm.questions.map((q, i) => (
            <option key={i} value={i}>
              {q.text}
            </option>
          ))}
        </select>

        {/* PAGINATION */}
        <div className="flex items-center gap-2 text-sm">
          <button
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
            className="border px-2 rounded disabled:opacity-40"
          >
            ◀
          </button>

          <span className="px-2 bg-yellow-400 rounded text-sm font-medium">
            {index + 1}
          </span>

          <span>of</span>

          <span className="border px-2 rounded">{feedbackForm.questions.length}</span>

          <button
            disabled={index === feedbackForm.questions.length - 1}
            onClick={() => setIndex(index + 1)}
            className="border px-2 rounded disabled:opacity-40"
          >
            ▶
          </button>
        </div>
      </div>

      {/* QUESTION CARD */}
      <div className="bg-bb-bg border rounded-xl p-6 space-y-4">
        <div>
          <p className="font-medium">{question.text}</p>
          <p className="text-sm text-yellow-600 mt-1">
            {stats.responseCount} Response{stats.responseCount !== 1 ? "s" : ""}
          </p>
        </div>

        {/* ⭐ RATING QUESTION */}
        {question.type === "rating" && stats.distribution && (
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((starLevel) => (
              <div key={starLevel} className="flex items-center gap-6">
                <div className="w-[40%]">
                  <StarRating value={starLevel} />
                </div>
                <span className="text-sm font-medium">
                  {stats.distribution[starLevel]} Response
                  {stats.distribution[starLevel] !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* MULTIPLE CHOICE / CHECKBOX QUESTION */}
        {(question.type === "multiple_choice" || question.type === "checkbox") &&
          stats.optionCounts &&
          stats.options && (
            <div className="space-y-2 text-sm">
              {stats.options.map((option: string) => (
                <div key={option} className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-700">{option}</span>
                  <span className="font-medium">
                    {stats.optionCounts[option]} Response
                    {stats.optionCounts[option] !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}

        {/* TEXT QUESTION */}
        {question.type === "text" && stats.textResponses && (
          <div className="space-y-2">
            {stats.textResponses.length === 0 ? (
              <p className="text-sm text-gray-500">No text responses yet.</p>
            ) : (
              stats.textResponses.map((text: string, i: number) => (
                <div key={i} className="border rounded p-3 bg-white text-sm text-gray-700">
                  {text}
                </div>
              ))
            )}
          </div>
        )}

        {stats.responseCount === 0 && (
          <p className="text-sm text-gray-500">No responses for this question yet.</p>
        )}
      </div>
    </div>
  );
}
