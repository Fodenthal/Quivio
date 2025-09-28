export interface QuestionSubmissionInput {
  topic: string;
  category: string;
  difficulty: number;
  question: string;
  correctAnswer: string;
  acceptableAnswers: string[];
  externalSource?: string | null;
  externalId?: string | null;
  imageUrl?: string | null;
}

export interface NormalizedQuestionSubmission {
  topic: string;
  category: string;
  difficulty: number;
  question: string;
  correctAnswer: string;
  acceptableAnswers: string[];
  externalSource: string | null;
  externalId: string | null;
  image: { url: string; source?: string | null } | null;
}

export type SubmissionValidationErrors = Partial<Record<keyof QuestionSubmissionInput | "acceptableAnswers", string>>;

export interface ValidationResult {
  success: boolean;
  errors: SubmissionValidationErrors;
  submission?: NormalizedQuestionSubmission;
}

const isUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const validateSubmission = (payload: QuestionSubmissionInput): ValidationResult => {
  const errors: SubmissionValidationErrors = {};
  const trim = (value: string) => value.trim();

  const topic = trim(payload.topic ?? "");
  const category = trim(payload.category ?? "");
  const question = trim(payload.question ?? "");
  const correctAnswer = trim(payload.correctAnswer ?? "");
  const difficulty = Number(payload.difficulty ?? 0);
  const acceptableAnswers = Array.isArray(payload.acceptableAnswers)
    ? payload.acceptableAnswers.map(trim).filter(Boolean)
    : [];

  if (!topic) {
    errors.topic = "Topic is required";
  }

  if (!category) {
    errors.category = "Category is required";
  }

  if (!question) {
    errors.question = "Question text is required";
  }

  if (!correctAnswer) {
    errors.correctAnswer = "Correct answer is required";
  }

  if (!Number.isFinite(difficulty) || difficulty < 1 || difficulty > 5) {
    errors.difficulty = "Difficulty must be between 1 and 5";
  }

  if (acceptableAnswers.length === 0) {
    errors.acceptableAnswers = "Provide at least one acceptable answer";
  }

  const externalSource = payload.externalSource ? trim(payload.externalSource) : "";
  if (externalSource && !isUrl(externalSource)) {
    errors.externalSource = "External source must be a valid URL";
  }

  const externalId = payload.externalId ? trim(payload.externalId) : "";

  const imageUrl = payload.imageUrl ? trim(payload.imageUrl) : "";
  if (imageUrl && !isUrl(imageUrl)) {
    errors.imageUrl = "Image URL must be a valid http(s) link";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    errors: {},
    submission: {
      topic,
      category,
      difficulty,
      question,
      correctAnswer,
      acceptableAnswers,
      externalSource: externalSource || null,
      externalId: externalId || null,
      image: imageUrl ? { url: imageUrl, source: "uploader" } : null,
    },
  };
};

export interface BulkRowValidation {
  rowNumber: number;
  errors: SubmissionValidationErrors;
}

export interface BulkValidationResult {
  validSubmissions: NormalizedQuestionSubmission[];
  invalidRows: BulkRowValidation[];
}

export const validateBulkSubmissions = (
  submissions: QuestionSubmissionInput[],
): BulkValidationResult => {
  const validSubmissions: NormalizedQuestionSubmission[] = [];
  const invalidRows: BulkRowValidation[] = [];

  submissions.forEach((submission, index) => {
    const result = validateSubmission(submission);
    if (result.success && result.submission) {
      validSubmissions.push(result.submission);
    } else {
      invalidRows.push({
        rowNumber: index + 1,
        errors: result.errors,
      });
    }
  });

  return { validSubmissions, invalidRows };
};

export const deserializeAcceptableAnswers = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry).trim()).filter(Boolean);
      }
    } catch {
      const parts = value.split(/\r?\n|\s*,\s*/);
      return parts.map((entry) => entry.trim()).filter(Boolean);
    }
  }

  return [];
};

export const mapBulkRecordToSubmission = (record: Record<string, unknown>): QuestionSubmissionInput => ({
  topic: String(record.topic ?? ""),
  category: String(record.category ?? ""),
  difficulty: Number(record.difficulty ?? 0),
  question: String(record.question ?? ""),
  correctAnswer: String(record.correct_answer ?? record.correctAnswer ?? ""),
  acceptableAnswers: deserializeAcceptableAnswers(
    record.acceptable_answers ?? record.acceptableAnswers ?? []
  ),
  externalSource: record.external_source ? String(record.external_source) : null,
  externalId: record.external_id ? String(record.external_id) : record.externalId ? String(record.externalId) : null,
  imageUrl: record.image_url ? String(record.image_url) : record.imageUrl ? String(record.imageUrl) : null,
});

export interface StoredSubmissionRecord extends NormalizedQuestionSubmission {
  id: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  origin: "single" | "bulk";
  batchId: string | null;
  notes?: string | null;
}

export interface StoreResult {
  stored: StoredSubmissionRecord[];
  failed?: BulkRowValidation[];
}
