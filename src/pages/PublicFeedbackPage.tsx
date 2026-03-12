import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Star } from "lucide-react";
import logo from "../assets/bistro-bill-logo.png";
import branchImage from "../assets/kitchenImg.png";
import successImg from "../assets/tick.png";
import {
  PublicFeedbackForm,
  getPublicFeedbackForm,
  submitPublicFeedbackResponse,
} from "../services/marketingService";

type ScreenStep = "welcome" | "form";

type CustomerFields = {
  name: string;
  phone: string;
  email: string;
};

export default function PublicFeedbackPage() {
  const { formId } = useParams<{ formId: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<PublicFeedbackForm | null>(null);
  const [step, setStep] = useState<ScreenStep>("welcome");
  const [showThanks, setShowThanks] = useState(false);
  const [customer, setCustomer] = useState<CustomerFields>({
    name: "",
    phone: "",
    email: "",
  });
  const [responses, setResponses] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadForm = async () => {
      if (!formId) return;
      try {
        setLoading(true);
        setError("");
        const res = await getPublicFeedbackForm(formId);
        if (res.success && res.data) {
          setForm(res.data);
        } else {
          setError(res.message || "Feedback form not found");
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load feedback form");
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [formId]);

  const firstBranchLabel = useMemo(() => {
    return form?.title || "Bistro Bill Branch";
  }, [form?.title]);

  const setQuestionResponse = (questionId: string, value: any) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleCheckboxOption = (questionId: string, option: string) => {
    const current: string[] = Array.isArray(responses[questionId]) ? responses[questionId] : [];
    const next = current.includes(option)
      ? current.filter((x) => x !== option)
      : [...current, option];
    setQuestionResponse(questionId, next);
  };

  const clearForm = () => {
    setCustomer({ name: "", phone: "", email: "" });
    setResponses({});
    setError("");
  };

  const validate = () => {
    if (!form) return false;
    if (!customer.name.trim() || !customer.phone.trim() || !customer.email.trim()) {
      setError("Customer name, phone number, and email are required.");
      return false;
    }

    for (const q of form.questions) {
      if (!q.required) continue;
      const value = responses[q.id];
      if (q.type === "checkbox") {
        if (!Array.isArray(value) || value.length === 0) {
          setError(`"${q.text}" is required.`);
          return false;
        }
      } else if (q.type === "rating") {
        if (!value || Number(value) < 1) {
          setError(`"${q.text}" is required.`);
          return false;
        }
      } else if (!value || String(value).trim() === "") {
        setError(`"${q.text}" is required.`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!formId || !form) return;
    if (!validate()) return;

    try {
      setSubmitting(true);
      setError("");

      const firstRatingQuestion = form.questions.find((q) => q.type === "rating");
      const overallRating = firstRatingQuestion ? Number(responses[firstRatingQuestion.id] || 0) : undefined;

      const result = await submitPublicFeedbackResponse(formId, {
        responses,
        rating: overallRating && overallRating > 0 ? overallRating : undefined,
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          email: customer.email.trim(),
        },
      });

      if (!result.success) {
        setError(result.message || "Failed to submit feedback.");
        return;
      }

      setShowThanks(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ECECEF] flex items-center justify-center p-4">
        <p className="text-gray-700">Loading feedback form...</p>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-[#ECECEF] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-gray-300 bg-white p-5 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#ECECEF] py-6 px-3">
      <div className="w-full max-w-md mx-auto">
        {step === "welcome" ? (
          <div className="rounded-xl border border-gray-300 bg-[#F3F3F5] overflow-hidden">
            <div className="h-3 bg-[#F4C62F]" />
            <div className="border-b border-gray-300 p-5 flex justify-center">
              <img src={logo} alt="Bistro Bill" className="h-10 object-contain" />
            </div>
            <div className="p-4 text-center">
              <img
                src={branchImage}
                alt="Branch"
                className="w-56 h-32 mx-auto rounded-xl object-cover"
              />
              <p className="mt-2 text-xl text-gray-700">{firstBranchLabel}</p>
            </div>
            <div className="px-4 pb-8">
              <p className="text-[22px] leading-tight text-gray-700 mb-4">Dear Customer,</p>
              <p className="text-[22px] leading-tight text-gray-700 mb-6">
                Thank you for dining with us! We deeply value your opinion and appreciate you
                taking the time to share your feedback. Your insights are essential in helping us
                maintain and improve the quality of our services.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => setStep("form")}
                  className="bg-[#F4C62F] text-black text-[24px] font-medium px-12 py-4 rounded-2xl shadow"
                >
                  Give Feedback
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-300 bg-[#F3F3F5] overflow-hidden">
            <div className="h-3 bg-[#F4C62F]" />
            <div className="border-b border-gray-300 p-4">
              <h1 className="text-[#111111] text-[28px] leading-tight font-semibold">{form.title}</h1>
            </div>
            <div className="border-b border-gray-300 p-4">
              <p className="text-[#3B3B3B] text-[18px] leading-snug">
                {form.description ||
                  "This form is designed to gather your valuable feedback. Your honest feedback helps us understand your experience and make necessary improvements."}
              </p>
            </div>

            <div className="border-b border-gray-300 p-4 space-y-4">
              <div>
                <label className="block text-[#313131] text-[14px] font-semibold mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={customer.name}
                  onChange={(e) => setCustomer((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Enter your Name"
                  className="w-full rounded-md border border-[#D3D3D3] bg-[#F4F4F5] text-[#333333] px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-[#313131] text-[14px] font-semibold mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  value={customer.phone}
                  onChange={(e) => setCustomer((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="Enter your Phone Number"
                  className="w-full rounded-md border border-[#D3D3D3] bg-[#F4F4F5] text-[#333333] px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-[#313131] text-[14px] font-semibold mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  value={customer.email}
                  onChange={(e) => setCustomer((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Enter your Email Address"
                  className="w-full rounded-md border border-[#D3D3D3] bg-[#F4F4F5] text-[#333333] px-3 py-2"
                />
              </div>
            </div>

            <div className="p-4 space-y-4 border-b border-gray-300">
              {form.questions.map((q) => (
                <div key={q.id} className="rounded-md border border-[#E7D390] bg-[#F5F4EF] p-3">
                  <p className="text-[#3B3B3B] text-[16px] mb-3">
                    {q.text} {q.required ? <span className="text-red-500">*</span> : null}
                  </p>

                  {q.type === "rating" && (
                    <div className="grid grid-cols-5 gap-2">
                      {(
                        q.options && q.options.length > 0
                          ? Array.from({ length: q.options.length }, (_, i) => i + 1)
                          : [1, 2, 3, 4, 5]
                      ).map((n) => {
                        const selected = Number(responses[q.id] || 0) >= n;
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setQuestionResponse(q.id, n)}
                            className="flex flex-col items-center text-[#3B3B3B]"
                          >
                            <span className="text-[18px]">{n}</span>
                            <Star
                              size={36}
                              className={selected ? "fill-[#F4C62F] text-[#F4C62F]" : "text-[#3B3B3B]"}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "multiple_choice" && (
                    <div className="space-y-2">
                      {(q.options || []).map((opt) => {
                        const checked = responses[q.id] === opt;
                        return (
                          <label key={opt} className="flex items-center gap-2 text-[16px] text-[#3B3B3B]">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => setQuestionResponse(q.id, checked ? "" : opt)}
                              className="h-5 w-5 accent-[#F4C62F]"
                            />
                            {opt}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "checkbox" && (
                    <div className="space-y-2">
                      {(q.options || []).map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-[16px] text-[#3B3B3B]">
                          <input
                            type="checkbox"
                            checked={Array.isArray(responses[q.id]) && responses[q.id].includes(opt)}
                            onChange={() => toggleCheckboxOption(q.id, opt)}
                            className="h-5 w-5 accent-[#F4C62F]"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "text" && (
                    <textarea
                      value={responses[q.id] || ""}
                      onChange={(e) => setQuestionResponse(q.id, e.target.value)}
                      placeholder="Type here..."
                      rows={3}
                      className="w-full rounded-md border border-[#D3D3D3] bg-[#F4F4F5] px-3 py-2 text-[#333333]"
                    />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="px-4 pb-2">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="p-4 flex items-center justify-between">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#F4C62F] text-black text-[22px] px-12 py-3 rounded-xl shadow disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
              <button
                onClick={clearForm}
                type="button"
                className="text-[#A57C00] text-[20px] font-medium"
              >
                Clear Form
              </button>
            </div>
          </div>
        )}
      </div>

      {showThanks && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center p-5 z-50">
          <div className="w-full max-w-md rounded-xl border border-gray-300 overflow-hidden bg-[#F5F5F7]">
            <div className="h-3 bg-[#F4C62F]" />
            <div className="p-7 text-center">
              <div className="flex justify-center mb-4">
                {successImg ? (
                  <img src={successImg} alt="Success" className="h-24 w-24 object-contain" />
                ) : (
                  <CheckCircle2 size={84} className="text-green-500" />
                )}
              </div>
              <h3 className="text-5xl font-semibold mb-4">Thank You!</h3>
              <p className="text-gray-700 text-[20px] leading-snug">
                Thank you for completing our feedback form! We appreciate your time and input,
                and we look forward to serving you again soon.
              </p>
              <button
                className="mt-6 bg-[#F4C62F] px-8 py-2 rounded-lg text-black font-medium"
                onClick={() => {
                  setShowThanks(false);
                  setStep("welcome");
                  clearForm();
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
