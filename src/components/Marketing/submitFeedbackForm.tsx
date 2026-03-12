import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Star } from "lucide-react";
import Input from "../form/Input";
import Select from "../form/Select";
import Textarea from "../form/Textarea";
import Modal from "../../components/ui/Modal";
import successImg from "../../assets/tick.png";
import {
  createFeedbackForm,
  FeedbackQuestion,
} from "../../services/marketingService";
import { getBranches } from "../../services/branchService";

type QuestionType = "rating" | "yesno" | "text" | "multiple" | "checkbox";

const questionTypeMap: Record<
  QuestionType,
  "text" | "rating" | "multiple_choice" | "checkbox"
> = {
  rating: "rating",
  yesno: "multiple_choice",
  text: "text",
  multiple: "multiple_choice",
  checkbox: "checkbox",
};

export default function SubmitFeedbackForm() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [description, setDescription] = useState("");
  const [branch, setBranch] = useState("");
  const [channel, setChannel] = useState("Select Channel");
  const [branchOptions, setBranchOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);

  const [draftText, setDraftText] = useState("");
  const [draftType, setDraftType] = useState<QuestionType>("rating");
  const [draftRequired, setDraftRequired] = useState(false);
  const [draftOptions, setDraftOptions] = useState("Option 1, Option 2");
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await getBranches({ status: "active" });
        if (res.success && res.data) {
          setBranchOptions([
            { label: "Select Branches", value: "" },
            ...res.data.branches.map((b) => ({ label: b.name, value: b.id })),
          ]);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };
    loadBranches();
  }, []);

  const typeOptions = useMemo(
    () => [
      { label: "Rating", value: "rating" },
      { label: "Yes / No", value: "yesno" },
      { label: "Text", value: "text" },
      { label: "Multiple Choice", value: "multiple" },
      { label: "Checkboxes", value: "checkbox" },
    ],
    []
  );

  const buildQuestion = (): FeedbackQuestion | null => {
    if (!draftText.trim()) {
      setError("Question text is required.");
      return null;
    }

    const base: FeedbackQuestion = {
      id: crypto.randomUUID(),
      type: questionTypeMap[draftType],
      text: draftText.trim(),
      required: draftRequired,
    };

    if (draftType === "yesno") {
      base.options = ["Yes", "No"];
    }

    if (draftType === "multiple" || draftType === "checkbox") {
      const opts = draftOptions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (opts.length < 2) {
        setError("Add at least 2 options for multiple choice / checkbox.");
        return null;
      }
      base.options = opts;
    }

    return base;
  };

  const addQuestion = () => {
    setError("");
    const q = buildQuestion();
    if (!q) return;
    setQuestions((prev) => [...prev, q]);
    setDraftText("");
    setDraftRequired(false);
    setDraftOptions("Option 1, Option 2");
    setDraftType("rating");
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!branch) {
      setError("Please select a branch.");
      return;
    }

    let payloadQuestions = [...questions];
    if (payloadQuestions.length === 0 && draftText.trim()) {
      const q = buildQuestion();
      if (!q) return;
      payloadQuestions = [q];
    }

    if (payloadQuestions.length === 0) {
      setError("Please add at least one question.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await createFeedbackForm({
        title,
        description: description || undefined,
        questions: payloadQuestions,
        status:
          status === "Active"
            ? "active"
            : status === "Inactive"
              ? "inactive"
              : undefined,
      });
      setShowSuccess(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          "Failed to create feedback form."
      );
      console.error("Failed to create feedback form:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-bb-bg min-h-screen p-6">
      <h1 className="text-[28px] font-bold mb-6">Create Feedback Form</h1>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-bb-bg border border-bb-coloredborder rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Title"
            required
            placeholder="Enter Title"
            value={title}
            onChange={setTitle}
          />
          <Select
            label="Status"
            required
            value={status}
            onChange={setStatus}
            options={[
              { label: "Select Status", value: "" },
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
            ]}
          />
        </div>

        <Textarea
          label="Description"
          placeholder="Type Here..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Branch"
            value={branch}
            onChange={setBranch}
            required
            options={
              branchOptions.length > 0
                ? branchOptions
                : [{ label: "Select Branches", value: "" }]
            }
          />
          <Select
            label="Channels"
            required
            value={channel}
            onChange={setChannel}
            options={[
              { label: "Select Channel", value: "Select Channel" },
              { label: "Dine In", value: "Dine In" },
              { label: "Take Away", value: "Take Away" },
              { label: "Online Order", value: "Online Order" },
            ]}
          />
        </div>

        <div className="border p-4 rounded-lg space-y-3">
          <h4 className="text-[#E1A500] font-medium">Questions</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              className="md:col-span-3 w-full border rounded px-3 py-2 bg-gray-100"
              placeholder="Untitled Question"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
            />
            <Select
              value={draftType}
              onChange={(v) => setDraftType(v as QuestionType)}
              options={typeOptions}
            />
          </div>

          {(draftType === "multiple" || draftType === "checkbox") && (
            <input
              className="w-full border rounded px-3 py-2 bg-gray-100"
              placeholder="Options separated by comma"
              value={draftOptions}
              onChange={(e) => setDraftOptions(e.target.value)}
            />
          )}

          {draftType === "rating" && (
            <div className="flex justify-between max-w-md px-2 py-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex flex-col items-center gap-1">
                  <span>{n}</span>
                  <Star size={22} />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draftRequired}
                onChange={(e) => setDraftRequired(e.target.checked)}
              />
              Required
            </label>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded border"
            >
              <Plus size={14} />
              Add Question
            </button>
          </div>

          {questions.length > 0 && (
            <div className="pt-2 space-y-2">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between bg-gray-50 border rounded px-3 py-2 text-sm"
                >
                  <span>
                    {idx + 1}. {q.text} ({q.type})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuestions((prev) => prev.filter((x) => x.id !== q.id))
                    }
                    className="text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button onClick={() => navigate(-1)} className="border px-4 py-2 rounded">
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={saving}
          className="bg-yellow-400 px-4 py-2 rounded disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create"}
        </button>
      </div>

      <Modal
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          navigate(-1);
        }}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Feedback Form Created</h2>
        <div className="flex justify-center mb-4">
          <img src={successImg} alt="success" className="w-16 h-16" />
        </div>
        <p className="text-sm text-gray-600">
          New feedback form has been created successfully.
        </p>
      </Modal>
    </div>
  );
}

