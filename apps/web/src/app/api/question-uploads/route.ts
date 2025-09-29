import { NextResponse } from "next/server";
import { validateSubmission } from "@/utils/questionSubmission";
import { storeSubmissions, fetchRecentSubmissions } from "./store";
import { convertFileToDataUrl, uploadImageToSupabase, validateImageFile } from "./imageUpload";
import type { UploadedImageResult } from "./imageUpload";
import type { QuestionSubmissionInput } from "@/utils/questionSubmission";

interface ParsedFormPayload {
  payload: QuestionSubmissionInput;
  imageMetadata: UploadedImageResult | null;
}

const parseMultipartBody = async (request: Request): Promise<ParsedFormPayload> => {
  const formData = await request.formData();

  const getString = (key: string): string | undefined => {
    const value = formData.get(key);
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
  };

  const parseAcceptableAnswers = (): string[] => {
    const raw = formData.get("acceptableAnswers");
    if (typeof raw !== "string") return [];
    if (!raw.trim()) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.map((entry) => String(entry)).filter(Boolean)
        : [];
    } catch (error) {
      console.warn("Failed to parse acceptableAnswers JSON from multipart payload", error);
      return [];
    }
  };

  let imageMetadata: UploadedImageResult | null = null;
  const imageFile = formData.get("imageFile");

  if (imageFile instanceof File && imageFile.size > 0) {
    const validationError = validateImageFile(imageFile);
    if (validationError) {
      throw new Error(validationError);
    }

    const uploaded = await uploadImageToSupabase(imageFile);
    if (!uploaded) {
      console.warn("⚠️ Falling back to inline image storage for question upload (Supabase storage unavailable)." );
    }
    imageMetadata = uploaded || (await convertFileToDataUrl(imageFile));
  }

  const payload: QuestionSubmissionInput = {
    topic: getString("topic") ?? null,
    category: null,
    question: getString("question") ?? "",
    correctAnswer: getString("correctAnswer") ?? "",
    acceptableAnswers: parseAcceptableAnswers(),
    imageUrl: getString("imageUrl") ?? null,
    difficulty: null,
  };

  return { payload, imageMetadata };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 100) : 15;

  try {
    console.log(`📥 Fetching recent question submissions (limit=${limit})`);
    const submissions = await fetchRecentSubmissions(limit);
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Failed to fetch submission history", error);
    return NextResponse.json({ error: "Failed to load submissions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let rawPayload: QuestionSubmissionInput | null = null;
    let uploadedImage: UploadedImageResult | null = null;

    if (contentType.includes("multipart/form-data")) {
      try {
        const parsed = await parseMultipartBody(request);
        rawPayload = parsed.payload;
        uploadedImage = parsed.imageMetadata;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid multipart payload";
        const status = message.includes("too large") ? 413 : 400;
        console.warn("🚫 Multipart question submission rejected", message);
        return NextResponse.json({ error: message }, { status });
      }
    } else {
      const jsonPayload = (await request.json()) as QuestionSubmissionInput;
      rawPayload = jsonPayload;
    }

    console.log("📨 Incoming question submission", rawPayload);
    const validation = validateSubmission(rawPayload as QuestionSubmissionInput);

    if (!validation.success || !validation.submission) {
      console.warn("🚫 Question submission failed validation", validation.errors);
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: validation.errors,
        },
        { status: 400 },
      );
    }

    const submission = validation.submission;

    if (uploadedImage) {
      submission.image = {
        ...submission.image,
        ...uploadedImage,
        source: uploadedImage.source ?? "upload",
      };
    }

    const result = await storeSubmissions([submission], "single", null);
    console.log(
      "✅ Submission stored",
      result.stored.map((record) => ({ id: record.id, origin: record.origin, status: record.status })),
    );

    return NextResponse.json(
      {
        stored: result.stored,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to store question submission", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred while saving your question.",
      },
      { status: 500 },
    );
  }
}
