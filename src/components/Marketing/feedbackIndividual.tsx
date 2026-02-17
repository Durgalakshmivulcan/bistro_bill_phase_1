import { useState } from "react";
import StarRating from "../Common/StarRating";
import { Copy, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { FeedbackForm, FeedbackResponse } from "../../services/marketingService";

interface FeedbackIndividualProps {
  feedbackForm: FeedbackForm;
  responses: FeedbackResponse[];
}

export default function FeedbackIndividual({ feedbackForm, responses }: FeedbackIndividualProps) {
  const [index, setIndex] = useState(0);

  if (responses.length === 0) {
    return (
      <div className="bg-bb-bg border rounded-xl p-6 text-center text-gray-500">
        No individual responses available yet.
      </div>
    );
  }

  const r = responses[index];

  const handleCopyResponse = () => {
    const content = [
      `Customer: ${r.customer?.name || "Anonymous"}`,
      `Email: ${r.customer?.email || "—"}`,
      `Phone: ${r.customer?.phone || "—"}`,
      `Submitted: ${new Date(r.submittedAt).toLocaleString()}`,
      "",
      "Responses:",
      ...feedbackForm.questions.map((q) => {
        const answer = r.responses[q.id];
        let answerText = "—";
        if (Array.isArray(answer)) {
          answerText = answer.join(", ");
        } else if (answer !== undefined && answer !== null) {
          answerText = answer.toString();
        }
        return `${q.text}: ${answerText}`;
      }),
    ].join("\n");

    navigator.clipboard.writeText(content);
    alert("Response copied to clipboard!");
  };

  return (
    <div className="space-y-4">
      {/* PAGINATION + ACTIONS */}
      <div className="flex justify-between items-center">
        {/* LEFT: PAGINATION */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setIndex(index - 1)}
            disabled={index === 0}
            className="border rounded px-2 py-1 disabled:opacity-40"
          >
            <ChevronLeft size={14} />
          </button>

          <span className="bg-yellow-400 px-2 py-0.5 rounded font-medium">
            {index + 1}
          </span>

          <span className="text-gray-500">of</span>

          <span className="border px-2 py-0.5 rounded">
            {responses.length}
          </span>

          <button
            onClick={() => setIndex(index + 1)}
            disabled={index === responses.length - 1}
            className="border rounded px-2 py-1 disabled:opacity-40"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* RIGHT: ACTIONS */}
        <div className="flex gap-3 text-gray-500">
          <button onClick={handleCopyResponse} className="hover:text-black" title="Copy response">
            <Copy size={18} />
          </button>
          <button className="hover:text-red-500" title="Delete response (not implemented)">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* CUSTOMER DETAILS CARD */}
      <div className="bg-bb-bg border rounded-xl p-4 text-sm">
        <div className="font-bold mb-2">Customer Details</div>
        <div className="flex flex-wrap gap-8 text-gray-600">
          <div>
            <b>Customer Name:</b> {r.customer?.name || "Anonymous"}
          </div>
          <div>
            <b>Phone Number:</b> {r.customer?.phone || "—"}
          </div>
          <div>
            <b>Email Address:</b> {r.customer?.email || "—"}
          </div>
        </div>
      </div>

      {/* OVERALL RATING (if exists) */}
      {r.rating !== null && r.rating !== undefined && (
        <div className="bg-bb-bg border rounded-xl p-6 space-y-4">
          <p className="font-medium">Overall Rating</p>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s}>
                <StarRating value={s <= r.rating! ? s : 0} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INDIVIDUAL QUESTION RESPONSES */}
      {feedbackForm.questions.map((question) => {
        const answer = r.responses[question.id];

        return (
          <div key={question.id} className="bg-bb-bg border rounded-xl p-6 space-y-3">
            <p className="font-medium">{question.text}</p>

            {question.type === "rating" && typeof answer === "number" && (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s}>
                    <StarRating value={s <= answer ? s : 0} />
                  </div>
                ))}
              </div>
            )}

            {question.type === "multiple_choice" && typeof answer === "string" && (
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <input type="radio" checked readOnly />
                  <span>{answer}</span>
                </div>
              </div>
            )}

            {question.type === "checkbox" && Array.isArray(answer) && (
              <div className="space-y-1 text-sm">
                {question.options?.map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input type="checkbox" checked={answer.includes(option)} readOnly />
                    {option}
                  </label>
                ))}
              </div>
            )}

            {question.type === "text" && typeof answer === "string" && (
              <div className="border rounded p-3 bg-white text-sm text-gray-700">
                {answer || "—"}
              </div>
            )}

            {answer === undefined || answer === null ? (
              <div className="text-sm text-gray-400">No response</div>
            ) : null}
          </div>
        );
      })}

      {/* SUBMITTED TIME */}
      <div className="text-xs text-gray-500 text-right">
        Submitted {new Date(r.submittedAt).toLocaleString()}
      </div>
    </div>
  );
}
