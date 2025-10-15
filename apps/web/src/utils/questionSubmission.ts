export interface QuestionSubmissionInput {
  topic?: string | null;
  category?: string | null;
  difficulty?: number | null;
  difficultyBand?: string | null;
  question: string;
  correctAnswer: string;
  acceptableAnswers?: string[] | null;
  externalSource?: string | null;
  externalId?: string | null;
  imageUrl?: string | null;
  roundTimeSeconds?: number | null;
  familyId?: string | null;
  templateId?: string | null;
  paramValues?: Record<string, unknown> | null;
  paramsHash?: string | null;
  contentHash?: string | null;
  generationSource?: string | null;
}

export interface NormalizedQuestionImage {
  url: string;
  source?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  size?: number | null;
  bucket?: string | null;
  path?: string | null;
  sha256?: string | null;
  originalUrl?: string | null;
  storageKey?: string | null;
  blurDataUrl?: string | null;
}

export interface NormalizedQuestionSubmission {
  topic: string | null;
  category: string | null;
  difficulty: number | null;
  difficultyBand: string | null;
  question: string;
  correctAnswer: string;
  acceptableAnswers: string[];
  externalSource: string | null;
  externalId: string | null;
  image: NormalizedQuestionImage | null;
  roundTimeMs: number;
  familyId: string | null;
  templateId: string | null;
  paramValues: Record<string, unknown> | null;
  paramsHash: string | null;
  contentHash: string | null;
  generationSource: string | null;
}

export type SubmissionValidationErrors = Partial<
  Record<keyof QuestionSubmissionInput | "acceptableAnswers", string>
>;

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

  const DEFAULT_ROUND_TIME_MS = 20000;

  const topic = trim(payload.topic ?? "");
  const category = trim(payload.category ?? "");
  const question = trim(payload.question ?? "");
  const correctAnswer = trim(payload.correctAnswer ?? "");
  const difficulty = Number(payload.difficulty ?? 0);
  const acceptableAnswers = Array.isArray(payload.acceptableAnswers)
    ? payload.acceptableAnswers.map(trim).filter(Boolean)
    : [];

  if (!question) {
    errors.question = "Question text is required";
  }

  if (!correctAnswer) {
    errors.correctAnswer = "Correct answer is required";
  }

  if (payload.difficulty !== undefined && payload.difficulty !== null) {
    if (!Number.isFinite(difficulty) || difficulty < 1 || difficulty > 5) {
      errors.difficulty = "Difficulty must be between 1 and 5";
    }
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

  const familyId = payload.familyId ? trim(payload.familyId) : "";
  const templateId = payload.templateId ? trim(payload.templateId) : "";
  const difficultyBand = payload.difficultyBand ? trim(payload.difficultyBand) : "";
  const paramsHash = payload.paramsHash ? trim(payload.paramsHash) : "";
  const contentHash = payload.contentHash ? trim(payload.contentHash) : "";
  const generationSource = payload.generationSource ? trim(payload.generationSource) : "";

  let roundTimeMs = DEFAULT_ROUND_TIME_MS;
  if (payload.roundTimeSeconds !== undefined && payload.roundTimeSeconds !== null) {
    const seconds = Number(payload.roundTimeSeconds);
    if (!Number.isFinite(seconds) || seconds < 5 || seconds > 900) {
      errors.roundTimeSeconds = "Round time must be between 5 and 900 seconds";
    } else {
      roundTimeMs = Math.round(seconds * 1000);
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const normalizedAcceptableAnswers = acceptableAnswers.length > 0
    ? acceptableAnswers
    : [correctAnswer];

  return {
    success: true,
    errors: {},
    submission: {
      topic: topic || null,
      category: category || null,
      difficulty: payload.difficulty !== undefined && payload.difficulty !== null
        ? Math.min(Math.max(difficulty, 1), 5)
        : null,
      question,
      correctAnswer,
      acceptableAnswers: normalizedAcceptableAnswers,
      externalSource: externalSource || null,
      externalId: externalId || null,
      image: imageUrl
        ? {
            url: imageUrl,
            originalUrl: imageUrl,
            source: "url",
          }
        : null,
      roundTimeMs,
      familyId: familyId || null,
      templateId: templateId || null,
      paramValues: payload.paramValues ?? null,
      paramsHash: paramsHash || null,
      contentHash: contentHash || null,
      difficultyBand: difficultyBand || null,
      generationSource: generationSource || null,
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
  topic: record.topic ? String(record.topic) : null,
  category: record.category ? String(record.category) : null,
  difficulty: record.difficulty !== undefined && record.difficulty !== null
    ? Number(record.difficulty)
    : null,
  question: String(record.question ?? ""),
  correctAnswer: String(record.correct_answer ?? record.correctAnswer ?? ""),
  acceptableAnswers: deserializeAcceptableAnswers(
    record.acceptable_answers ?? record.acceptableAnswers ?? []
  ),
  externalSource: record.external_source ? String(record.external_source) : null,
  externalId: record.external_id ? String(record.external_id) : record.externalId ? String(record.externalId) : null,
  imageUrl: record.image_url ? String(record.image_url) : record.imageUrl ? String(record.imageUrl) : null,
  roundTimeSeconds: record.round_time_ms !== undefined && record.round_time_ms !== null
    ? Number(record.round_time_ms) / 1000
    : null,
  familyId: record.family_id ? String(record.family_id) : null,
  templateId: record.template_id ? String(record.template_id) : null,
  paramValues: typeof record.param_values === "object" && record.param_values !== null
    ? (record.param_values as Record<string, unknown>)
    : null,
  paramsHash: record.params_hash ? String(record.params_hash) : null,
  contentHash: record.content_hash ? String(record.content_hash) : null,
  difficultyBand: record.difficulty_band ? String(record.difficulty_band) : null,
  generationSource: record.generation_source ? String(record.generation_source) : null,
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
