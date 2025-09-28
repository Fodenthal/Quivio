"use client";

import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { StoredSubmissionRecord } from "@/utils/questionSubmission";

const ACCEPTABLE_ANSWER_DELIMITER = /\r?\n|\s*,\s*/;
const INPUT_CLASS =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 transition";
const TEXTAREA_CLASS =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 transition";
const RANGE_CLASS =
  "w-full h-2 cursor-pointer accent-indigo-400";

const STATUS_STYLES: Record<StoredSubmissionRecord["status"], { label: string; className: string }> = {
  pending: {
    label: "Pending review",
    className: "bg-amber-400/15 text-amber-200 border border-amber-400/30",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-400/15 text-emerald-200 border border-emerald-400/30",
  },
  rejected: {
    label: "Needs revision",
    className: "bg-rose-400/15 text-rose-200 border border-rose-400/30",
  },
};

interface SingleQuestionFormState {
  topic: string;
  category: string;
  difficulty: number;
  question: string;
  correctAnswer: string;
  acceptableAnswersText: string;
  externalSource: string;
  externalId: string;
  imageUrl: string;
}

interface SingleQuestionValidationErrors {
  topic?: string;
  category?: string;
  difficulty?: string;
  question?: string;
  correctAnswer?: string;
  acceptableAnswers?: string;
  externalSource?: string;
  externalId?: string;
  imageUrl?: string;
  general?: string;
}

interface BulkUploadSummary {
  batchId: string;
  fileName: string;
  totalRows: number;
  accepted: number;
  rejected: number;
  stored: StoredSubmissionRecord[];
  invalidRows: {
    rowNumber: number;
    errors: Record<string, string>;
  }[];
}

const createInitialSingleFormState = (): SingleQuestionFormState => ({
  topic: "",
  category: "",
  difficulty: 2,
  question: "",
  correctAnswer: "",
  acceptableAnswersText: "",
  externalSource: "",
  externalId: "",
  imageUrl: "",
});

const isValidUrl = (value: string) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const formatSubmittedAt = (timestamp: string) => {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return timestamp;
  }
};

export const QuestionUploadPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [singleFormState, setSingleFormState] = useState<SingleQuestionFormState>(
    createInitialSingleFormState,
  );
  const [singleFormErrors, setSingleFormErrors] = useState<SingleQuestionValidationErrors>({});
  const [singleSubmitStatus, setSingleSubmitStatus] = useState<string | null>(null);
  const [singleSubmitError, setSingleSubmitError] = useState<string | null>(null);
  const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);

  const [bulkUploadSummary, setBulkUploadSummary] = useState<BulkUploadSummary | null>(null);
  const [bulkUploadError, setBulkUploadError] = useState<string | null>(null);
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);

  const [history, setHistory] = useState<StoredSubmissionRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const bulkInputRef = useRef<HTMLInputElement | null>(null);

  const acceptableAnswersPreview = useMemo(() => {
    const trimmed = singleFormState.acceptableAnswersText.trim();
    if (!trimmed) return [];
    return Array.from(
      new Set(
        trimmed
          .split(ACCEPTABLE_ANSWER_DELIMITER)
          .map((entry) => entry.trim())
          .filter(Boolean),
      ),
    );
  }, [singleFormState.acceptableAnswersText]);

  const difficultyLabel = useMemo(() => {
    switch (singleFormState.difficulty) {
      case 1:
        return "Very Easy";
      case 2:
        return "Easy";
      case 3:
        return "Medium";
      case 4:
        return "Hard";
      case 5:
        return "Very Hard";
      default:
        return "Medium";
    }
  }, [singleFormState.difficulty]);

  const refreshHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await fetch("/api/question-uploads?limit=15", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load submission history");
      }
      const data = await response.json();
      setHistory(data.submissions ?? []);
    } catch (error) {
      console.error("Unable to refresh submission history", error);
      setHistoryError("Could not load your recent submissions. Try again later.");
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  const handleSingleFormChange = <K extends keyof SingleQuestionFormState>(
    key: K,
    value: SingleQuestionFormState[K],
  ) => {
    setSingleFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSingleFormErrors((prev) => ({ ...prev, [key]: undefined, general: undefined }));
    setSingleSubmitStatus(null);
    setSingleSubmitError(null);
  };

  const validateSingleForm = (state: SingleQuestionFormState): SingleQuestionValidationErrors => {
    const errors: SingleQuestionValidationErrors = {};

    if (!state.topic.trim()) {
      errors.topic = "Topic is required";
    }

    if (!state.category.trim()) {
      errors.category = "Category is required";
    }

    if (!state.question.trim()) {
      errors.question = "Question text is required";
    }

    if (!state.correctAnswer.trim()) {
      errors.correctAnswer = "Correct answer is required";
    }

    if (state.difficulty < 1 || state.difficulty > 5) {
      errors.difficulty = "Difficulty must be between 1 and 5";
    }

    if (!acceptableAnswersPreview.length) {
      errors.acceptableAnswers = "Provide at least one acceptable answer";
    }

    if (state.externalSource.trim() && !isValidUrl(state.externalSource.trim())) {
      errors.externalSource = "External source must be a valid URL";
    }

    if (state.imageUrl.trim() && !isValidUrl(state.imageUrl.trim())) {
      errors.imageUrl = "Image URL must be a valid http(s) link";
    }

    return errors;
  };

  const handleSingleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateSingleForm(singleFormState);
    if (Object.keys(validationErrors).length > 0) {
      setSingleFormErrors(validationErrors);
      setSingleSubmitStatus(null);
      return;
    }

    const payload = {
      topic: singleFormState.topic.trim(),
      category: singleFormState.category.trim(),
      difficulty: singleFormState.difficulty,
      question: singleFormState.question.trim(),
      correctAnswer: singleFormState.correctAnswer.trim(),
      acceptableAnswers: acceptableAnswersPreview,
      externalSource: singleFormState.externalSource.trim() || null,
      externalId: singleFormState.externalId.trim() || null,
      imageUrl: singleFormState.imageUrl.trim() || null,
    };

    setIsSubmittingSingle(true);
    setSingleSubmitStatus(null);
    setSingleSubmitError(null);

    try {
      const response = await fetch("/api/question-uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 400 && data?.issues) {
        setSingleFormErrors((prev) => ({ ...prev, ...data.issues }));
        setSingleSubmitError("Please address the highlighted fields and try again.");
        return;
      }

      if (!response.ok) {
        setSingleSubmitError(data?.error ?? "Something went wrong while saving your question.");
        return;
      }

      const storedRecord: StoredSubmissionRecord | undefined = data?.stored?.[0];
      if (storedRecord) {
        const status = STATUS_STYLES[storedRecord.status] ?? STATUS_STYLES.pending;
        setSingleSubmitStatus(
          `Queued for review. Tracking ID #${storedRecord.id} (${status.label}).`,
        );
      } else {
        setSingleSubmitStatus("Queued for review. We'll email you once it's approved.");
      }

      setSingleFormState(createInitialSingleFormState());
      setSingleFormErrors({});
      void refreshHistory();
    } catch (error) {
      console.error("Failed to upload question", error);
      setSingleSubmitError("We couldn't reach the staging service. Please try again.");
    } finally {
      setIsSubmittingSingle(false);
    }
  };

  const handleDownloadTemplate = (type: "csv" | "json") => {
    const csvTemplate = `topic,category,difficulty,question,correct_answer,acceptable_answers,external_source,external_id,image_url\n`;
    const jsonTemplate = `[{\n  "topic": "Science",\n  "category": "Space",\n  "difficulty": 2,\n  "question": "What planet is known as the Red Planet?",\n  "correct_answer": "Mars",\n  "acceptable_answers": ["Mars", "The Red Planet"],\n  "external_source": "",\n  "external_id": "",\n  "image_url": ""\n}]`;

    const content = type === "csv" ? csvTemplate : jsonTemplate;
    const mime = type === "csv" ? "text/csv" : "application/json";
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = type === "csv" ? "quivio-question-template.csv" : "quivio-question-template.json";
    link.click();

    URL.revokeObjectURL(url);
  };

  const uploadBulkFile = async (file: File | null) => {
    if (!file) {
      setBulkUploadSummary(null);
      setBulkUploadError(null);
      return;
    }

    setIsUploadingBulk(true);
    setBulkUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/question-uploads/bulk", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok && response.status !== 207) {
        setBulkUploadSummary(null);
        setBulkUploadError(data?.error ?? "Bulk upload failed.");
        return;
      }

      const summary: BulkUploadSummary = {
        batchId: data.batchId,
        fileName: file.name,
        totalRows: data.totalRows ?? 0,
        accepted: data.accepted ?? 0,
        rejected: data.rejected ?? 0,
        stored: data.stored ?? [],
        invalidRows: data.invalidRows ?? [],
      };

      setBulkUploadSummary(summary);
      setBulkUploadError(null);
      void refreshHistory();
    } catch (error) {
      console.error("Bulk upload failed", error);
      setBulkUploadSummary(null);
      setBulkUploadError("We hit an error while parsing that file. Give it another shot.");
    } finally {
      setIsUploadingBulk(false);
    }
  };

  const handleBulkInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    void uploadBulkFile(file);
    if (bulkInputRef.current) {
      bulkInputRef.current.value = "";
    }
  };

  const handleBulkDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] ?? null;
    void uploadBulkFile(file);
  };

  const resetBulkUpload = () => {
    setBulkUploadSummary(null);
    setBulkUploadError(null);
    if (bulkInputRef.current) {
      bulkInputRef.current.value = "";
    }
  };

  const renderHistory = () => {
    if (isHistoryLoading) {
      return <p className="px-6 pb-6 text-sm text-white/70">Loading your recent submissions…</p>;
    }

    if (historyError) {
      return <p className="px-6 pb-6 text-sm text-rose-200">{historyError}</p>;
    }

    if (history.length === 0) {
      return (
        <p className="px-6 pb-6 text-sm text-white/60">
          Once you start sending questions, they will show up here with moderation status updates.
        </p>
      );
    }

    return (
      <div className="px-6 pb-6 space-y-4">
        {history.map((entry) => {
          const statusStyle = STATUS_STYLES[entry.status] ?? STATUS_STYLES.pending;
          return (
            <article
              key={`${entry.id}-${entry.submittedAt}`}
              className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle.className}`}>
                      {statusStyle.label}
                    </span>
                    <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-xs text-indigo-100">
                      {entry.origin === "single" ? "Single" : "Bulk"}
                    </span>
                    {entry.batchId && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                        Batch {entry.batchId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  <p className="text-base font-semibold text-white line-clamp-2">{entry.question}</p>
                  <p className="text-sm text-white/70">
                    <span className="font-medium text-white">Topic:</span> {entry.topic} ·
                    <span className="ml-1 font-medium text-white">Category:</span> {entry.category} ·
                    <span className="ml-1 font-medium text-white">Difficulty:</span> {entry.difficulty}
                  </p>
                </div>
                <div className="text-right text-xs text-white/50">
                  <p>Submitted {formatSubmittedAt(entry.submittedAt)}</p>
                  {entry.notes && <p className="mt-2 text-rose-200">{entry.notes}</p>}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <section className="bg-white/5 border border-white/10 rounded-2xl shadow-glass overflow-hidden">
      <div className="border-b border-white/10 bg-white/5 px-6 py-5">
        <h2 className="text-2xl font-semibold text-white">Contribute Questions</h2>
        <p className="mt-2 text-sm text-white/70">
          Share your best trivia with the community. Submit single questions for quick edits or upload a whole batch once you have a set ready.
        </p>
      </div>

      <div className="px-6 pt-4">
        <div className="flex gap-2 border-b border-white/10">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === "single"
                ? "bg-indigo-500/20 text-indigo-200 border border-white/10 border-b-transparent"
                : "text-white/60 hover:text-white"
            }`}
            onClick={() => setActiveTab("single")}
          >
            Single Question
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === "bulk"
                ? "bg-indigo-500/20 text-indigo-200 border border-white/10 border-b-transparent"
                : "text-white/60 hover:text-white"
            }`}
            onClick={() => setActiveTab("bulk")}
          >
            Bulk Upload
          </button>
        </div>
      </div>

      {activeTab === "single" ? (
        <form className="px-6 pb-8 pt-6 space-y-6" onSubmit={handleSingleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">Topic *</span>
              <input
                type="text"
                value={singleFormState.topic}
                onChange={(event) => handleSingleFormChange("topic", event.target.value)}
                className={INPUT_CLASS}
                placeholder="e.g. Solar System"
              />
              {singleFormErrors.topic && (
                <span className="text-xs text-red-300">{singleFormErrors.topic}</span>
              )}
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">Category *</span>
              <input
                type="text"
                value={singleFormState.category}
                onChange={(event) => handleSingleFormChange("category", event.target.value)}
                className={INPUT_CLASS}
                placeholder="e.g. Science & Nature"
              />
              {singleFormErrors.category && (
                <span className="text-xs text-red-300">{singleFormErrors.category}</span>
              )}
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-white">Question *</span>
            <textarea
              value={singleFormState.question}
              onChange={(event) => handleSingleFormChange("question", event.target.value)}
              className={`${TEXTAREA_CLASS} min-h-[120px]`}
              placeholder="Ask something interesting..."
            />
            {singleFormErrors.question && (
              <span className="text-xs text-red-300">{singleFormErrors.question}</span>
            )}
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">Correct Answer *</span>
              <input
                type="text"
                value={singleFormState.correctAnswer}
                onChange={(event) => handleSingleFormChange("correctAnswer", event.target.value)}
                className={INPUT_CLASS}
                placeholder="e.g. Mars"
              />
              {singleFormErrors.correctAnswer && (
                <span className="text-xs text-red-300">{singleFormErrors.correctAnswer}</span>
              )}
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">Difficulty: {difficultyLabel}</span>
              <input
                type="range"
                min={1}
                max={5}
                value={singleFormState.difficulty}
                onChange={(event) => handleSingleFormChange("difficulty", Number(event.target.value))}
                className={RANGE_CLASS}
              />
              {singleFormErrors.difficulty && (
                <span className="text-xs text-red-300">{singleFormErrors.difficulty}</span>
              )}
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-white">Acceptable Answers *</span>
            <textarea
              value={singleFormState.acceptableAnswersText}
              onChange={(event) => handleSingleFormChange("acceptableAnswersText", event.target.value)}
              className={`${TEXTAREA_CLASS} min-h-[100px]`}
              placeholder="Comma or newline separated alternatives"
            />
            {singleFormErrors.acceptableAnswers && (
              <span className="text-xs text-red-300">{singleFormErrors.acceptableAnswers}</span>
            )}
          </label>

          <details className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <summary className="cursor-pointer text-white">Optional metadata</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wide text-white/60">External Source URL</span>
                <input
                  type="url"
                  value={singleFormState.externalSource}
                  onChange={(event) => handleSingleFormChange("externalSource", event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="https://example.com/trivia"
                />
                {singleFormErrors.externalSource && (
                  <span className="text-xs text-red-300">{singleFormErrors.externalSource}</span>
                )}
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wide text-white/60">External ID</span>
                <input
                  type="text"
                  value={singleFormState.externalId}
                  onChange={(event) => handleSingleFormChange("externalId", event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Source identifier"
                />
                {singleFormErrors.externalId && (
                  <span className="text-xs text-red-300">{singleFormErrors.externalId}</span>
                )}
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wide text-white/60">Image URL</span>
                <input
                  type="url"
                  value={singleFormState.imageUrl}
                  onChange={(event) => handleSingleFormChange("imageUrl", event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="https://images.com/mars.jpg"
                />
                {singleFormErrors.imageUrl && (
                  <span className="text-xs text-red-300">{singleFormErrors.imageUrl}</span>
                )}
              </label>
            </div>
          </details>

          {acceptableAnswersPreview.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Preview</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {acceptableAnswersPreview.map((answer) => (
                  <li key={answer} className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs text-indigo-100">
                    {answer}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/60">
              Submissions land in the staging queue first so we can sanity check before going live.
            </p>
            <button
              type="submit"
              disabled={isSubmittingSingle}
              className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingSingle ? "Saving…" : "Save question draft"}
            </button>
          </div>

          {singleSubmitError && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {singleSubmitError}
            </div>
          )}

          {singleSubmitStatus && (
            <div className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
              {singleSubmitStatus}
            </div>
          )}
        </form>
      ) : (
        <div className="px-6 pb-8 pt-6 space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-base font-semibold text-white">Bulk upload basics</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/70">
              <li>Use CSV or JSON with the headers/keys shown in our template.</li>
              <li>Keep difficulty between 1-5 and make sure acceptable answers are arrays.</li>
              <li>We validate everything in staging and send you a report for fixes.</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleDownloadTemplate("csv")}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 hover:text-white"
              >
                Download CSV template
              </button>
              <button
                type="button"
                onClick={() => handleDownloadTemplate("json")}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 hover:text-white"
              >
                Download JSON template
              </button>
            </div>
          </div>

          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleBulkDrop}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-indigo-400/60 bg-indigo-500/10 px-6 py-12 text-center text-white/80 transition hover:border-indigo-300 hover:bg-indigo-500/20"
          >
            <input
              ref={bulkInputRef}
              type="file"
              accept=".csv,.json,application/json,text/csv"
              className="hidden"
              onChange={handleBulkInput}
            />
            <span className="text-base font-semibold">Drop your file here or click to browse</span>
            <span className="text-xs text-white/60">CSV or JSON (max 5MB). One header row, UTF-8 please.</span>
            {isUploadingBulk && <span className="text-xs text-indigo-200">Uploading & validating…</span>}
          </label>

          {(bulkUploadSummary || bulkUploadError) && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
              {bulkUploadSummary ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{bulkUploadSummary.fileName}</p>
                      <p className="text-xs text-white/60">
                        Batch {bulkUploadSummary.batchId.slice(0, 8)} · {bulkUploadSummary.accepted} accepted · {bulkUploadSummary.rejected} flagged
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetBulkUpload}
                      className="text-xs text-indigo-200 hover:text-indigo-100"
                    >
                      Remove
                    </button>
                  </div>

                  <dl className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                      <dt className="text-xs uppercase tracking-wide text-white/60">Rows processed</dt>
                      <dd className="text-lg font-semibold text-white">{bulkUploadSummary.totalRows}</dd>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                      <dt className="text-xs uppercase tracking-wide text-lime-200/80">Queued</dt>
                      <dd className="text-lg font-semibold text-lime-200">{bulkUploadSummary.accepted}</dd>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                      <dt className="text-xs uppercase tracking-wide text-amber-200/80">Needs fixes</dt>
                      <dd className="text-lg font-semibold text-amber-200">{bulkUploadSummary.rejected}</dd>
                    </div>
                  </dl>

                  {bulkUploadSummary.invalidRows.length > 0 && (
                    <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                      <p className="font-semibold">Rows to revisit:</p>
                      <ul className="mt-2 space-y-2">
                        {bulkUploadSummary.invalidRows.map((row) => (
                          <li key={`row-${row.rowNumber}`}>
                            <span className="font-semibold">Row {row.rowNumber}:</span>
                            <span className="ml-2">
                              {Object.values(row.errors)
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-white/60">
                    Staged rows show up below once the moderator queue picks them up. Fix flagged entries and upload them again when ready.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-rose-200">{bulkUploadError}</p>
              )}
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
            <p className="font-semibold text-white">Coming soon:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Auto-detect duplicates and suggest edits before you upload.</li>
              <li>Email notifications the moment a moderator approves your batch.</li>
              <li>Founders leaderboard to unlock new trivia modes with 100 approvals.</li>
            </ul>
          </div>
        </div>
      )}

      <div className="border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-white">Submission history</h3>
            <p className="text-xs text-white/60">Your last few uploads and where they are in the moderation pipeline.</p>
          </div>
          <button
            type="button"
            onClick={() => void refreshHistory()}
            className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/70 transition hover:text-white"
          >
            Refresh
          </button>
        </div>
        {renderHistory()}
      </div>
    </section>
  );
};
