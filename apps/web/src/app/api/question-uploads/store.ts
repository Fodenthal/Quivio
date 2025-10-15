import { randomUUID } from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  NormalizedQuestionSubmission,
  StoredSubmissionRecord,
  StoreResult,
  deserializeAcceptableAnswers,
} from "@/utils/questionSubmission";

const TABLE_NAME = process.env.QUESTION_STAGING_TABLE ?? "questions_staging";
const FALLBACK_TOPIC = "General";
const FALLBACK_CATEGORY = "Community";
const FALLBACK_DIFFICULTY = 3;
const FALLBACK_ROUND_TIME_MS = 20000;

interface MemoryStore {
  submissions: StoredSubmissionRecord[];
  nextId: number;
}

declare global {
  var __questionUploadStore: MemoryStore | undefined;
}

const getMemoryStore = (): MemoryStore => {
  if (!globalThis.__questionUploadStore) {
    globalThis.__questionUploadStore = {
      submissions: [],
      nextId: 1,
    };
  }
  return globalThis.__questionUploadStore;
};

const getSupabaseClient = (): SupabaseClient | null => {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const toStoredRecord = (
  submission: NormalizedQuestionSubmission,
  origin: "single" | "bulk",
  batchId: string | null,
  overrides: Partial<StoredSubmissionRecord> = {},
): StoredSubmissionRecord => ({
  id: overrides.id ?? randomUUID(),
  topic: submission.topic,
  category: submission.category,
  difficulty: submission.difficulty,
  question: submission.question,
  correctAnswer: submission.correctAnswer,
  acceptableAnswers: submission.acceptableAnswers,
  externalSource: submission.externalSource,
  externalId: submission.externalId,
  image: submission.image,
  roundTimeMs: submission.roundTimeMs ?? FALLBACK_ROUND_TIME_MS,
  difficultyBand: submission.difficultyBand,
  familyId: submission.familyId,
  templateId: submission.templateId,
  paramValues: submission.paramValues,
  paramsHash: submission.paramsHash,
  contentHash: submission.contentHash,
  generationSource: submission.generationSource,
  status: overrides.status ?? "pending",
  submittedAt: overrides.submittedAt ?? new Date().toISOString(),
  origin,
  batchId,
  notes: overrides.notes ?? null,
});

const storeInMemory = (
  submissions: NormalizedQuestionSubmission[],
  origin: "single" | "bulk",
  batchId: string | null,
): StoreResult => {
  console.warn(
    "📦 Falling back to in-memory question staging store. Configure SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) for persistence.",
  );
  const memory = getMemoryStore();
  const stored: StoredSubmissionRecord[] = submissions.map((submission) => {
    const id = String(memory.nextId++);
    const record = toStoredRecord(submission, origin, batchId, { id });
    memory.submissions.unshift(record);
    return record;
  });
  return { stored };
};

const storeInSupabase = async (
  client: SupabaseClient,
  submissions: NormalizedQuestionSubmission[],
  origin: "single" | "bulk",
  batchId: string | null,
): Promise<StoreResult | null> => {
  if (submissions.length === 0) {
    return { stored: [] };
  }

  try {
    const payload = submissions.map((submission) => ({
      topic: submission.topic?.trim() || FALLBACK_TOPIC,
      category: submission.category?.trim() || FALLBACK_CATEGORY,
      difficulty: submission.difficulty ?? FALLBACK_DIFFICULTY,
      question: submission.question,
      correct_answer: submission.correctAnswer,
      acceptable_answers: submission.acceptableAnswers,
      external_source: submission.externalSource,
      external_id: submission.externalId,
      image: submission.image,
      origin,
      batch_id: batchId,
      round_time_ms: submission.roundTimeMs ?? FALLBACK_ROUND_TIME_MS,
      difficulty_band: submission.difficultyBand,
      family_id: submission.familyId,
      template_id: submission.templateId,
      param_values: submission.paramValues,
      params_hash: submission.paramsHash,
      content_hash: submission.contentHash,
      generation_source: submission.generationSource ?? (origin === "single" ? "manual.single" : "manual.bulk"),
    }));

    const { data, error } = await client
      .from(TABLE_NAME)
      .insert(payload)
      .select();

    if (error) {
      console.error("Failed to store submissions in Supabase", error);
      return null;
    }

    const stored = submissions.map((submission, index) => {
      const row = data?.[index] ?? {};
      return toStoredRecord(submission, origin, batchId, {
        id: row.id ? String(row.id) : randomUUID(),
        status: row.status ?? "pending",
        submittedAt: row.submitted_at ?? row.created_at ?? new Date().toISOString(),
        roundTimeMs: typeof row.round_time_ms === 'number' ? row.round_time_ms : submission.roundTimeMs ?? FALLBACK_ROUND_TIME_MS,
        difficultyBand: typeof row.difficulty_band === "string" ? row.difficulty_band : submission.difficultyBand,
        familyId: typeof row.family_id === "string" ? row.family_id : submission.familyId,
        templateId: typeof row.template_id === "string" ? row.template_id : submission.templateId,
        paramValues: row.param_values && typeof row.param_values === "object" ? row.param_values as Record<string, unknown> : submission.paramValues,
        paramsHash: typeof row.params_hash === "string" ? row.params_hash : submission.paramsHash,
        contentHash: typeof row.content_hash === "string" ? row.content_hash : submission.contentHash,
        generationSource: typeof row.generation_source === "string" ? row.generation_source : submission.generationSource,
      });
    });

    console.info(`✅ Stored ${stored.length} submission(s) in Supabase staging table "${TABLE_NAME}"`);
    return { stored };
  } catch (error) {
    console.error("Error inserting submissions into Supabase", error);
    return null;
  }
};

export const storeSubmissions = async (
  submissions: NormalizedQuestionSubmission[],
  origin: "single" | "bulk",
  batchId: string | null,
): Promise<StoreResult> => {
  const client = getSupabaseClient();
  if (client) {
    const supabaseResult = await storeInSupabase(client, submissions, origin, batchId);
    if (supabaseResult) {
      const memory = getMemoryStore();
      supabaseResult.stored.forEach((record) => {
        memory.submissions = memory.submissions.filter((existing) => existing.id !== record.id);
        memory.submissions.unshift(record);
      });
      return supabaseResult;
    }
    console.warn("⚠️ Supabase store failed; falling back to in-memory queue.");
  }

  return storeInMemory(submissions, origin, batchId);
};

export const fetchRecentSubmissions = async (
  limit: number = 10,
): Promise<StoredSubmissionRecord[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from(TABLE_NAME)
        .select("id, topic, category, difficulty, question, correct_answer, acceptable_answers, external_source, external_id, image, status, batch_id, origin, submitted_at, created_at, moderation_notes, round_time_ms, difficulty_band, family_id, template_id, param_values, params_hash, content_hash, generation_source")
        .order("submitted_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false, nullsFirst: false })
        .limit(limit);

      if (!error && data) {
        return data.map((row) => ({
          id: String(row.id),
          topic: row.topic,
          category: row.category,
          difficulty: row.difficulty ?? null,
          question: row.question,
          correctAnswer: row.correct_answer,
          acceptableAnswers: deserializeAcceptableAnswers(row.acceptable_answers ?? []),
          externalSource: row.external_source,
          externalId: row.external_id,
          image: row.image ?? null,
          status: row.status ?? "pending",
          submittedAt: row.submitted_at ?? row.created_at ?? new Date().toISOString(),
          origin: row.origin ?? "bulk",
          batchId: row.batch_id ?? null,
          notes: row.moderation_notes ?? null,
          roundTimeMs: typeof row.round_time_ms === 'number' ? row.round_time_ms : FALLBACK_ROUND_TIME_MS,
          difficultyBand: row.difficulty_band ?? null,
          familyId: row.family_id ?? null,
          templateId: row.template_id ?? null,
          paramValues: row.param_values ?? null,
          paramsHash: row.params_hash ?? null,
          contentHash: row.content_hash ?? null,
          generationSource: row.generation_source ?? null,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch submissions from Supabase", error);
    }
  }

  const memory = getMemoryStore();
  return memory.submissions.slice(0, limit);
};

export const memoryStoreDebug = () => getMemoryStore();
