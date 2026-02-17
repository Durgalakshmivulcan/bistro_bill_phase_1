import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getFeedbackForms,
  getFeedbackResponses,
  FeedbackForm,
  FeedbackResponse,
  FeedbackQuestion,
} from "../../../services/marketingService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import StarRating from "../../Common/StarRating";

/* ================= Helpers ================= */

function getDateRange(label: string): { startDate: string; endDate: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start = end;
  switch (label) {
    case "Yesterday": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      start = d.toISOString().split("T")[0];
      break;
    }
    case "Last 7 days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split("T")[0];
      break;
    }
    case "Last 30 days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      start = d.toISOString().split("T")[0];
      break;
    }
    case "Last 90 days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 90);
      start = d.toISOString().split("T")[0];
      break;
    }
    default:
      break;
  }
  return { startDate: start, endDate: end };
}

const COLORS = ["#FDC836", "#4CAF50", "#2196F3", "#FF5722", "#9C27B0", "#607D8B", "#E91E63", "#00BCD4"];

const DATE_OPTIONS = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "Last 90 days"];

/* ================= Types ================= */

interface FormWithResponses {
  form: FeedbackForm;
  responses: FeedbackResponse[];
}

/* ================= Component ================= */

export default function FeedbackResponseAnalytics() {
  const [formsData, setFormsData] = useState<FormWithResponses[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("Last 30 days");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getDateRange(dateFilter);

      // Fetch all feedback forms
      const formsResponse = await getFeedbackForms();
      if (!formsResponse.success || !formsResponse.data) {
        setError(formsResponse.message || "Failed to load feedback forms");
        return;
      }

      const forms = formsResponse.data;

      // Fetch responses for each form with date filter
      const allFormsData: FormWithResponses[] = [];
      for (const form of forms) {
        try {
          const responsesResponse = await getFeedbackResponses({
            formId: form.id,
            startDate,
            endDate,
          });
          allFormsData.push({
            form,
            responses:
              responsesResponse.success && responsesResponse.data
                ? responsesResponse.data
                : [],
          });
        } catch {
          allFormsData.push({ form, responses: [] });
        }
      }

      setFormsData(allFormsData);
    } catch {
      setError("Failed to load feedback analytics");
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  // All responses flattened
  const allResponses = useMemo(
    () => formsData.flatMap((fd) => fd.responses),
    [formsData]
  );

  // All forms
  const allForms = useMemo(() => formsData.map((fd) => fd.form), [formsData]);

  // Summary stats
  const totalForms = allForms.length;
  const activeForms = allForms.filter((f) => f.status === "active").length;
  const totalResponses = allResponses.length;
  const responsesWithRating = allResponses.filter(
    (r) => r.rating !== null && r.rating !== undefined
  );
  const averageRating =
    responsesWithRating.length > 0
      ? responsesWithRating.reduce((sum, r) => sum + (r.rating || 0), 0) /
        responsesWithRating.length
      : 0;

  // Average rating per question (across all forms)
  const ratingQuestionStats = useMemo(() => {
    const stats: {
      questionText: string;
      formTitle: string;
      average: number;
      count: number;
    }[] = [];

    formsData.forEach(({ form, responses }) => {
      const questions = form.questions as FeedbackQuestion[];
      questions
        .filter((q) => q.type === "rating")
        .forEach((question) => {
          let sum = 0;
          let count = 0;
          responses.forEach((r) => {
            const val = Number(r.responses[question.id]);
            if (!isNaN(val) && val >= 1 && val <= 5) {
              sum += val;
              count++;
            }
          });
          if (count > 0) {
            stats.push({
              questionText: question.text,
              formTitle: form.title,
              average: sum / count,
              count,
            });
          }
        });
    });

    return stats;
  }, [formsData]);

  // Response rate over time (group by day)
  const responseOverTime = useMemo(() => {
    const byDay: Record<string, number> = {};
    allResponses.forEach((r) => {
      const day = new Date(r.submittedAt).toISOString().split("T")[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        responses: count,
      }));
  }, [allResponses]);

  // Most common feedback themes (from multiple_choice and checkbox answers)
  const feedbackThemes = useMemo(() => {
    const themeCounts: Record<string, number> = {};

    formsData.forEach(({ form, responses }) => {
      const questions = form.questions as FeedbackQuestion[];
      questions
        .filter(
          (q) => q.type === "multiple_choice" || q.type === "checkbox"
        )
        .forEach((question) => {
          responses.forEach((r) => {
            const answer = r.responses[question.id];
            if (Array.isArray(answer)) {
              answer.forEach((a) => {
                if (typeof a === "string") {
                  themeCounts[a] = (themeCounts[a] || 0) + 1;
                }
              });
            } else if (typeof answer === "string" && answer) {
              themeCounts[answer] = (themeCounts[answer] || 0) + 1;
            }
          });
        });
    });

    return Object.entries(themeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [formsData]);

  // Rating distribution across all responses
  const ratingDistribution = useMemo(() => {
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allResponses.forEach((r) => {
      if (r.rating !== null && r.rating !== undefined) {
        const rating = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
        if (rating >= 1 && rating <= 5) {
          dist[rating]++;
        }
      }
    });
    return [1, 2, 3, 4, 5].map((star) => ({
      star: `${star} Star`,
      count: dist[star as 1 | 2 | 3 | 4 | 5],
    }));
  }, [allResponses]);

  // Responses per form (for pie chart)
  const responsesPerForm = useMemo(
    () =>
      formsData
        .filter((fd) => fd.responses.length > 0)
        .map((fd) => ({
          name:
            fd.form.title.length > 20
              ? fd.form.title.slice(0, 20) + "…"
              : fd.form.title,
          count: fd.responses.length,
        })),
    [formsData]
  );

  // CSV export
  const handleExportCSV = () => {
    if (allResponses.length === 0) return;

    // Gather all unique question texts across forms
    const allQuestions: { id: string; text: string; formTitle: string }[] = [];
    formsData.forEach(({ form }) => {
      (form.questions as FeedbackQuestion[]).forEach((q) => {
        allQuestions.push({ id: q.id, text: q.text, formTitle: form.title });
      });
    });

    const headers = [
      "Form Title",
      "Customer Name",
      "Email",
      "Phone",
      "Rating",
      "Submitted At",
      ...allQuestions.map((q) => `${q.formTitle}: ${q.text}`),
    ];

    const rows = formsData.flatMap(({ form, responses }) => {
      const questions = form.questions as FeedbackQuestion[];
      return responses.map((response) => {
        const baseRow = [
          form.title,
          response.customer?.name || "Anonymous",
          response.customer?.email || "",
          response.customer?.phone || "",
          response.rating?.toString() || "",
          new Date(response.submittedAt).toLocaleString(),
        ];

        // Fill answers for all questions (only this form's questions will have values)
        const answerRow = allQuestions.map((q) => {
          if (q.formTitle !== form.title) return "";
          const answer = response.responses[q.id];
          if (Array.isArray(answer)) return answer.join("; ");
          return answer?.toString() || "";
        });

        return [...baseRow, ...answerRow];
      });
    });

    const csvContent = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const { startDate, endDate } = getDateRange(dateFilter);
    link.download = `feedback-analytics-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-3 md:mx-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-bb-text">
          Feedback Response Analytics
        </h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bb-input bg-bb-bg text-sm"
          >
            {DATE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <button
            onClick={() => setDateFilter("Last 30 days")}
            className="bb-btn bg-[#F7C948] text-black border border-black rounded-md px-4"
          >
            Clear
          </button>
          <button
            onClick={handleExportCSV}
            disabled={allResponses.length === 0}
            className="bb-btn bg-bb-secondary text-white rounded-md hover:bg-black/90 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="text-center py-8 text-bb-textSoft">
          Loading feedback analytics...
        </div>
      )}
      {error && (
        <div className="text-center py-8 text-red-500">
          {error}
          <button
            onClick={loadData}
            className="ml-3 text-sm underline text-bb-primary"
          >
            Retry
          </button>
        </div>
      )}
      {!loading && !error && totalForms === 0 && (
        <div className="text-center py-8 text-bb-textSoft">
          No feedback forms available. Create a feedback form in the Marketing
          section to start collecting responses.
        </div>
      )}

      {!loading && !error && totalForms > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <SummaryCard title="Total Forms" value={String(totalForms)} />
            <SummaryCard title="Active Forms" value={String(activeForms)} />
            <SummaryCard
              title="Total Responses"
              value={String(totalResponses)}
            />
            <SummaryCard
              title="Avg Rating"
              value={averageRating > 0 ? averageRating.toFixed(2) : "N/A"}
            />
            <SummaryCard
              title="Avg Responses/Form"
              value={
                totalForms > 0
                  ? (totalResponses / totalForms).toFixed(1)
                  : "0"
              }
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Response Rate Over Time (Line Chart) */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-bb-text mb-3">
                Response Rate Over Time
              </h3>
              {responseOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={responseOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="responses"
                      stroke="#FDC836"
                      strokeWidth={2}
                      dot={{ fill: "#FDC836", r: 3 }}
                      name="Responses"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-bb-textSoft text-sm">
                  No response data available for this period
                </div>
              )}
            </div>

            {/* Rating Distribution (Bar Chart) */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-bb-text mb-3">
                Overall Rating Distribution
              </h3>
              {responsesWithRating.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={ratingDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="star" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill="#FDC836"
                      name="Responses"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-bb-textSoft text-sm">
                  No ratings available
                </div>
              )}
            </div>
          </div>

          {/* Second Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Responses Per Form (Pie Chart) */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-bb-text mb-3">
                Responses by Form
              </h3>
              {responsesPerForm.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={responsesPerForm}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                      }
                    >
                      {responsesPerForm.map((_, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | undefined) => [
                        value ?? 0,
                        "Responses",
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-bb-textSoft text-sm">
                  No response data available
                </div>
              )}
            </div>

            {/* Most Common Feedback Themes */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-bb-text mb-3">
                Most Common Feedback Themes
              </h3>
              {feedbackThemes.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={feedbackThemes}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11 }}
                      width={120}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill="#4CAF50"
                      name="Occurrences"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-bb-textSoft text-sm">
                  No multiple-choice or checkbox data available
                </div>
              )}
            </div>
          </div>

          {/* Average Rating Per Question */}
          {ratingQuestionStats.length > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-bb-text mb-3">
                Average Rating Per Question
              </h3>
              <div className="space-y-3">
                {ratingQuestionStats.map((stat, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      i % 2 === 0 ? "bg-[#FFFBEA]" : "bg-white"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-bb-text truncate">
                        {stat.questionText}
                      </p>
                      <p className="text-xs text-bb-textSoft">{stat.formTitle}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <StarRating value={stat.average} />
                      <span className="text-sm font-semibold text-bb-text min-w-[40px] text-right">
                        {stat.average.toFixed(2)}
                      </span>
                      <span className="text-xs text-bb-textSoft">
                        ({stat.count} responses)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forms Table */}
          <div className="bg-white border rounded-lg overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[1fr_100px_100px_120px_100px] bg-[#F7C948] px-4 py-2 text-sm font-medium">
                <div>Form Title</div>
                <div>Status</div>
                <div>Responses</div>
                <div>Avg Rating</div>
                <div>Created</div>
              </div>
              {formsData.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-bb-textSoft">
                  No feedback forms found
                </div>
              )}
              {formsData.map(({ form, responses }, i) => {
                const formRatings = responses.filter(
                  (r) => r.rating !== null && r.rating !== undefined
                );
                const formAvgRating =
                  formRatings.length > 0
                    ? formRatings.reduce(
                        (sum, r) => sum + (r.rating || 0),
                        0
                      ) / formRatings.length
                    : 0;

                return (
                  <div
                    key={form.id}
                    className={`grid grid-cols-[1fr_100px_100px_120px_100px] px-4 py-2 text-sm border-t ${
                      i % 2 ? "bg-[#FFFBEA]" : ""
                    }`}
                  >
                    <div className="font-medium truncate">{form.title}</div>
                    <div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          form.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {form.status}
                      </span>
                    </div>
                    <div>{responses.length}</div>
                    <div>
                      {formAvgRating > 0 ? formAvgRating.toFixed(2) : "N/A"}
                    </div>
                    <div className="text-bb-textSoft">
                      {new Date(form.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ================= Sub-Components ================= */

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white border rounded-lg p-3">
      <div className="text-xs text-bb-textSoft">{title}</div>
      <div className="text-lg font-semibold text-bb-text mt-1">{value}</div>
    </div>
  );
}
