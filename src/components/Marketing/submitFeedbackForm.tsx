import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../form/Input";
import Select from "../form/Select";
import Textarea from "../form/Textarea";
import {
  Trash2,
  Copy,
  Plus,
  Star,
  ToggleLeft,
  AlignLeft,
  List,
  CheckSquare,
  MoreVertical,
} from "lucide-react";
import Modal from "../../components/ui/Modal";
import successImg from "../../assets/tick.png";
import { createFeedbackForm } from "../../services/marketingService";
import { getBranches } from "../../services/branchService";

type QuestionType = "rating" | "yesno" | "text" | "multiple" | "checkbox";

export default function SubmitFeedbackForm() {
  const navigate = useNavigate();

  const [questionType, setQuestionType] = useState<QuestionType>("rating");
  const [required, setRequired] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [branchOptions, setBranchOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [description, setDescription] = useState("");
  const [completionMessage, setCompletionMessage] = useState("");
  const [branch, setBranch] = useState("Select Branches");
  const [channel, setChannel] = useState("Select Channel");
  const [questionText, setQuestionText] = useState("");

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await getBranches({ status: "Active" });
        if (res.success && res.data) {
          setBranchOptions([
            { label: "Select Branches", value: "Select Branches" },
            ...res.data.branches.map((b) => ({ label: b.name, value: b.id })),
          ]);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };
    loadBranches();
  }, []);

  const handleCreate = async () => {
    if (!title) return;
    try {
      setSaving(true);
      await createFeedbackForm({
        title,
        description: description || undefined,
        questions: questionText
          ? [{ id: crypto.randomUUID(), type: questionType === "yesno" ? "text" : questionType === "multiple" ? "multiple_choice" : questionType, text: questionText, required }]
          : [],
        status: status === "Active" ? "active" : status === "Inactive" ? "inactive" : undefined,
      });
      setShowSuccess(true);
    } catch (err) {
      console.error("Failed to create feedback form:", err);
    } finally {
      setSaving(false);
    }
  };
  const questionTypeOptions = [
    {
      label: (
        <div className="flex items-center gap-2">
          <Star size={14} /> Rating
        </div>
      ),
      value: "rating",
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <ToggleLeft size={14} /> Yes / No
        </div>
      ),
      value: "yesno",
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <AlignLeft size={14} /> Text
        </div>
      ),
      value: "text",
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <List size={14} /> Multiple Choice
        </div>
      ),
      value: "multiple",
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <CheckSquare size={14} /> Checkboxes
        </div>
      ),
      value: "checkbox",
    },
  ];
  return (
    <div className="bg-bb-bg min-h-screen p-6">
      <h1 className="text-[28px] font-bold mb-6">Create Feedback Form</h1>

      {/* FORM CARD */}
      <div className="bg-bb-bg border border-bb-coloredborder rounded-xl p-6 space-y-6">
        {/* BASIC DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Title" required placeholder="Enter Title" value={title} onChange={setTitle} />
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

        <Textarea label="Description" placeholder="Type Here..." value={description} onChange={(e) => setDescription(e.target.value)} />
        <Textarea label="Completion Message" placeholder="Type Here..." value={completionMessage} onChange={(e) => setCompletionMessage(e.target.value)} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Branch"
            value={branch}
            onChange={setBranch}
            required
            options={branchOptions.length > 0 ? branchOptions : [{ label: "Select Branches", value: "Select Branches" }]}
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

        {/* QUESTIONS */}
        <div className="border border-solid-bb-coloredborder p-2">
          <h4 className="text-[#E1A500]">Questions</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Question input – 3 parts */}
            <input
              className="md:col-span-3 w-full border rounded px-3 py-2 bg-gray-100"
              placeholder="Untitled Question"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
            />

            {/* Question type – 1 part */}
            <div className="md:col-span-1">
              <Select
                value={questionType}
                onChange={(v) => setQuestionType(v as QuestionType)}
                options={questionTypeOptions}
              />
            </div>
          </div>

          {/* DYNAMIC QUESTION BODY */}
          {questionType === "rating" && (
            <div className="space-y-3 p-3">
              {/* STAR COUNT SELECT */}
              <div className="w-[15%]">
                <Select
                  value="5"
                  options={[
                    { label: "No. of Stars", value: "" },
                    { label: "5", value: "5" },
                  ]}
                />
              </div>
              {/* STAR SCALE */}
              <div className="flex justify-between max-w-lg m-auto px-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="flex flex-col items-center gap-1">
                    {/* NUMBER */}
                    <span>{n}</span>

                    {/* STAR */}
                    <Star size={28} className="" strokeWidth={1.5} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {questionType === "yesno" && (
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Yes
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" /> No
              </label>
            </div>
          )}

          {questionType === "text" && (
            <div className="text-sm text-gray-400">
              User will enter a text response
            </div>
          )}

          {questionType === "multiple" && (
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="radio" /> Option 1
              </label>
              <button className="text-sm text-gray-500">+ Add Option</button>
            </div>
          )}

          {questionType === "checkbox" && (
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Option 1
              </label>
              <button className="text-sm text-gray-500">+ Add Option</button>
            </div>
          )}

          {/* QUESTION FOOTER */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex items-center justify-between pt-3 border-t">
            <div className="md:col-span-3 w-full"></div>
            <div className="md:col-span-1 w-full flex items-center gap-4">
              <button className="hover:text-black">
                <Copy size={18} />
              </button>

              <button className="hover:text-red-500">
                <Trash2 size={18} />
              </button>

              <div className="flex items-center gap-2 text-sm">
                Required
                <label className="relative inline-flex cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={required}
                    onChange={() => setRequired(!required)}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-checked:bg-yellow-400 rounded-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:rounded-full after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
              <MoreVertical className="cursor-pointer" />
              <button className="hover:text-black">
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => navigate(-1)}
          className="border px-4 py-2 rounded"
        >
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
