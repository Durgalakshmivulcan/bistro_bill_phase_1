import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import FeedbackTabs from "./feedbackTabs";
import FeedbackSummary from "./feedbackSummary";
import FeedbackQuestions from "./feedbackQuestions";
import FeedbackIndividual from "./feedbackIndividual";
import {
  getFeedbackForms,
  getFeedbackResponses,
  FeedbackForm,
  FeedbackResponse,
} from "../../services/marketingService";
import LoadingSpinner from "../Common/LoadingSpinner";

export default function FeedbackResponsesPage() {
  const { id: formId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("Summary");
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm | null>(null);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (formId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, startDate, endDate]);

  const fetchData = async () => {
    if (!formId) return;

    try {
      setLoading(true);
      setError("");

      // Fetch feedback form details
      const formsResponse = await getFeedbackForms();
      if (formsResponse.success && formsResponse.data) {
        const form = formsResponse.data.find((f) => f.id === formId);
        if (form) {
          setFeedbackForm(form);
        } else {
          setError("Feedback form not found");
          setLoading(false);
          return;
        }
      }

      // Fetch feedback responses with date filters
      const responsesResponse = await getFeedbackResponses({
        formId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (responsesResponse.success && responsesResponse.data) {
        setResponses(responsesResponse.data);
      } else {
        setError(responsesResponse.message || "Failed to load responses");
      }
    } catch (err) {
      console.error("Error fetching feedback data:", err);
      setError("An error occurred while loading feedback data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!feedbackForm || responses.length === 0) return;

    // Prepare CSV headers
    const headers = ["Customer Name", "Email", "Phone", "Rating", "Submitted At"];
    feedbackForm.questions.forEach((q) => {
      headers.push(q.text);
    });

    // Prepare CSV rows
    const rows = responses.map((response) => {
      const row = [
        response.customer?.name || "Anonymous",
        response.customer?.email || "—",
        response.customer?.phone || "—",
        response.rating?.toString() || "—",
        new Date(response.submittedAt).toLocaleString(),
      ];

      // Add question responses
      feedbackForm.questions.forEach((q) => {
        const answer = response.responses[q.id];
        if (Array.isArray(answer)) {
          row.push(answer.join(", "));
        } else {
          row.push(answer?.toString() || "—");
        }
      });

      return row;
    });

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${feedbackForm.title.replace(/\s+/g, "_")}_responses.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="bg-bb-bg min-h-screen p-6">
        <LoadingSpinner message="Loading feedback responses..." />
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
            onClick={fetchData}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!feedbackForm) {
    return (
      <div className="bg-bb-bg min-h-screen p-6">
        <p className="text-gray-500">Feedback form not found</p>
      </div>
    );
  }

  return (
    <div className="bg-bb-bg min-h-screen p-6 space-y-6">
      <h1 className="text-[35px] font-semibold">{feedbackForm.title}</h1>

      {/* Date Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="flex justify-between items-center">
        <span className="text-yellow-600 font-medium">
          {responses.length} Response{responses.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={handleExportCSV}
          disabled={responses.length === 0}
          className="bg-yellow-400 px-4 py-2 rounded text-sm hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Download CSV
        </button>
      </div>

      <FeedbackTabs active={activeTab} setActive={setActiveTab} />

      {activeTab === "Summary" && (
        <FeedbackSummary
          feedbackForm={feedbackForm}
          responses={responses}
        />
      )}
      {activeTab === "Questions" && (
        <FeedbackQuestions
          feedbackForm={feedbackForm}
          responses={responses}
        />
      )}
      {activeTab === "Individual" && (
        <FeedbackIndividual
          feedbackForm={feedbackForm}
          responses={responses}
        />
      )}
    </div>
  );
}
