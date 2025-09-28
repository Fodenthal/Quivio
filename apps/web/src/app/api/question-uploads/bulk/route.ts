import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  mapBulkRecordToSubmission,
  validateBulkSubmissions,
} from "@/utils/questionSubmission";
import { storeSubmissions } from "../store";

export const runtime = "nodejs";

const parseCsv = (text: string): Record<string, string>[] => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  };

  const headers = parseLine(lines[0]).map((header) => header.replace(/^"|"$/g, ""));
  if (headers.length === 0) {
    return [];
  }

  const records: Record<string, string>[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const rowValues = parseLine(lines[index]);
    if (rowValues.length === 0) {
      continue;
    }

    const record: Record<string, string> = {};
    headers.forEach((header, headerIndex) => {
      record[header] = rowValues[headerIndex] ?? "";
    });

    records.push(record);
  }

  return records;
};

const parseInputFile = async (file: File): Promise<Record<string, unknown>[]> => {
  const text = await file.text();
  const trimmed = text.trim();

  if (!trimmed) {
    return [];
  }

  if (file.type === "application/json" || trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const payload = JSON.parse(trimmed);
    if (Array.isArray(payload)) {
      return payload as Record<string, unknown>[];
    }
    return [payload as Record<string, unknown>];
  }

  return parseCsv(text) as Record<string, unknown>[];
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Upload a CSV or JSON file." }, { status: 400 });
    }

    const records = await parseInputFile(file);
    if (records.length === 0) {
      return NextResponse.json({ error: "The uploaded file was empty." }, { status: 400 });
    }

    const submissions = records.map(mapBulkRecordToSubmission);
    const { validSubmissions, invalidRows } = validateBulkSubmissions(submissions);

    const batchId = randomUUID();
    const result = await storeSubmissions(validSubmissions, "bulk", batchId);

    return NextResponse.json(
      {
        batchId,
        stored: result.stored,
        totalRows: records.length,
        accepted: validSubmissions.length,
        rejected: invalidRows.length,
        invalidRows,
      },
      { status: invalidRows.length > 0 ? 207 : 201 },
    );
  } catch (error) {
    console.error("Failed to process bulk upload", error);
    return NextResponse.json(
      { error: "We could not process that file. Double check the format and try again." },
      { status: 500 },
    );
  }
}
